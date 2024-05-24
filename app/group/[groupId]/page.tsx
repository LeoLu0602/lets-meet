'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

import {
  AuthError,
  PostgrestError,
  User,
  createClient,
} from '@supabase/supabase-js';

import { useDebouncedCallback } from 'use-debounce';
import clsx from 'clsx';
import { Member, ModalOptions } from '@/app/interfacesAndTypes';
import Schedule from '@/components/Schedule';
import Modal from '@/components/Modal';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Page({ params }: { params: { groupId: string } }) {
  /*
    greenSlots vs availableTimeSlots

    greenSlots: CLIENT side's available time slots
    availableTimeSlots: SERVER side's available time slots

    Updates on the server side from clicking on time slots don't happen immediately.
    However, users want immediate changes on screen.
    Therefore, greenSlots is used to enable immediate changes.
  */

  const [user, setUser] = useState<Omit<Member, 'availableTimeSlots'> | null>(
    null
  );

  const [members, setMembers] = useState<Member[]>([]);

  const [groupName, setGroupName] = useState<string>('Untitled group');

  // selected member's userId ('all' for combined schedule)
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const [modalContent, setModalContent] = useState<ModalOptions>('');

  const [isUrlCopied, setIsUrlCopied] = useState<boolean>(false);

  const [greenSlots, setGreenSlots] = useState<string[]>([]);

  const router = useRouter();

  const membersMap: Map<string, Member> = new Map(
    members.map((member) => [member.userId, member])
  );

  const selectedAvatarUrl: string | null =
    membersMap.get(selectedMember)?.avatarUrl ?? null;

  /*    
    timeSlotsAvailability: Map<string, number>
  
    key: an available time slot in at least one member's availableTimeSlots
    value: the number of members who DON'T have [key] in their availableTimeSlots
  */

  const timeSlotsAvailability: Map<string, number> =
    getTimeSlotsAvailability(members);

  const combinedAvailableTimeSlots: string[] = Array.from(timeSlotsAvailability)
    .filter((pair) => pair[1] === 0)
    .map((pair) => pair[0]);

  // blue time slots shown on screen (only one member is absent)
  const almostAvailableTimeSlots: string[] = Array.from(timeSlotsAvailability)
    .filter((pair) => pair[1] === 1)
    .map((pair) => pair[0]);

  const availableTimeSlots: string[] =
    selectedMember !== 'all'
      ? membersMap.get(selectedMember)?.availableTimeSlots ?? []
      : combinedAvailableTimeSlots;

  useEffect(() => {
    setUp();

    // listen to changes in group_user table
    const channel = supabase
      .channel('custom-filter-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_user',
          filter: `group_id=eq.${params.groupId}`,
        },
        async () => {
          const members: Member[] = await getMembers(params.groupId);

          setMembers(members);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setGreenSlots(availableTimeSlots);
  }, [selectedMember]);

  useEffect(() => {
    /*
      When a user is viewing his/her own schedule,
      changes in DB should not update greenSlots.
      Doing so would result in poor user experience.
    */
    if (selectedMember !== user?.userId) {
      setGreenSlots(availableTimeSlots);
    }
  }, [members]);

  async function setUp(): Promise<void> {
    const members: Member[] = await getMembers(params.groupId);
    const groupName: string = await getGroupName(params.groupId);
    const memberIds: Set<string> = new Set(members.map(({ userId }) => userId));
    const user: User | null = await retrieveUser();

    setMembers(members);
    setGroupName(groupName);

    if (!user) {
      return;
    }

    // user is logged in

    setUser({
      userId: user.id,
      username: user.user_metadata.name,
      email: user.user_metadata.email,
      avatarUrl: user.user_metadata.avatar_url,
    });

    setSelectedMember(user.id);

    // user is the first member -> create the group
    if (members.length === 0) {
      const isSuccessful: boolean = await createGroup(params.groupId);

      if (!isSuccessful) {
        return;
      }
    }

    // user not in the group yet -> user joins the group
    if (!memberIds.has(user.id)) {
      await joinGroup(user, params.groupId);
    }
  }

  async function getMembers(groupId: string): Promise<Member[]> {
    const {
      data,
      error,
    }: { data: any[] | null; error: PostgrestError | null } = await supabase
      .from('group_user')
      .select('*')
      .eq('group_id', groupId);

    if (error) {
      console.error('Get Members Error: ', error);
      alert('Get Members Error');

      return [];
    }

    return (
      data?.map(
        ({
          user_id: userId,
          user_name: username,
          email,
          avatar_url: avatarUrl,
          available_time_slots: availableTimeSlots,
        }) => {
          return {
            userId,
            username,
            email,
            avatarUrl,
            availableTimeSlots,
          };
        }
      ) ?? []
    );
  }

  async function getGroupName(groupId: string): Promise<string> {
    const {
      data,
      error,
    }: {
      data: { name: string }[] | null;
      error: PostgrestError | null;
    } = await supabase.from('group').select('name').eq('id', groupId);

    if (error) {
      console.error('Get Group Name Error: ', error);
      alert('Get Group Name Error');

      return 'Untitled group';
    }

    return data?.[0].name ?? 'Untitled group';
  }

  async function handleGroupNameChange(
    e: ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    if (user) {
      const newGroupName: string = e.target.value;

      setGroupName(newGroupName);
      debouncedUpdateGroupName(params.groupId, newGroupName);
    }
  }

  const debouncedUpdateGroupName = useDebouncedCallback(updateGroupName, 500);

  async function updateGroupName(
    groupId: string,
    newGroupName: string
  ): Promise<void> {
    const { error }: { error: PostgrestError | null } = await supabase
      .from('group')
      .update({ name: newGroupName })
      .eq('id', groupId)
      .select();

    if (error) {
      console.error('Update Group Name Error: ', error);
      alert('Update Group Name Error');
    }
  }

  async function retrieveUser(): Promise<User | null> {
    try {
      const {
        data: { user },
      }: { data: { user: User | null } } = await supabase.auth.getUser();

      return user;
    } catch (error) {
      console.error('Retrieve User Error: ', error);
      alert('Retrieve User Error');

      return null;
    }
  }

  async function joinGroup(user: User, groupId: string): Promise<void> {
    const { error }: { error: PostgrestError | null } = await supabase
      .from('group_user')
      .insert([
        {
          group_id: groupId,
          user_id: user.id,
          user_name: user.user_metadata.name,
          email: user.user_metadata.email,
          avatar_url: user.user_metadata.avatar_url,
          available_time_slots: [],
        },
      ]);

    if (error) {
      console.error('Join Group Error: ', error);
      alert('Join Group Error');
    }
  }

  async function handleLogin(): Promise<void> {
    const { error }: { error: AuthError | null } =
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/group/${params.groupId}`,
        },
      });

    if (error) {
      console.error('Login Error: ', error);
      alert('Login Error');
    }
  }

  async function handleLogout(): Promise<void> {
    const { error }: { error: AuthError | null } =
      await supabase.auth.signOut();

    if (error) {
      console.error('Logout Error: ', error);
      alert('Logout Error');
    } else {
      setUser(null);
      closeModal();
    }
  }

  async function handleLeave(): Promise<void> {
    openModal('Leaving');
  }

  async function leave(): Promise<void> {
    if (!user) {
      return;
    }

    const { error }: { error: PostgrestError | null } = await supabase
      .from('group_user')
      .delete()
      .eq('user_id', user.userId)
      .eq('group_id', params.groupId);

    if (error) {
      console.error('Leave Group Error: ', error);
      alert('Leave Group Error');

      return;
    }

    await handleLogout();

    setSelectedMember('all');

    const members: Member[] = await getMembers(params.groupId);

    if (members.length === 0) {
      await deleteGroup(params.groupId);
    }
  }

  async function createGroup(groupId: string): Promise<boolean> {
    const { error } = await supabase
      .from('group')
      .insert([{ id: groupId, groupName: 'Untitled group' }])
      .select();

    if (error) {
      console.error('Creating Group Error: ', error);
      alert('Creating Group Error');

      return false;
    }

    return true;
  }

  async function deleteGroup(groupId: string): Promise<boolean> {
    const { error } = await supabase.from('group').delete().eq('id', groupId);

    if (error) {
      console.error('Delete Group Error: ', error);
      alert('Delete Group Error');

      return false;
    }

    router.push('/');

    return true;
  }

  function openModal(content: 'MemberSelection' | 'Menu' | 'Leaving'): void {
    setModalContent(content);
  }

  function closeModal(): void {
    setModalContent('');
  }

  function selectMember(memberId: string): void {
    setSelectedMember(memberId);
  }

  function getTimeSlotsAvailability(members: Member[]): Map<string, number> {
    const newTimeSlotsAvailability: Map<string, number> = new Map();
    const numberOfMembers: number = members.length;

    for (let { availableTimeSlots } of members) {
      for (let availableTimeSlot of availableTimeSlots) {
        const count: number =
          newTimeSlotsAvailability.get(availableTimeSlot) ?? numberOfMembers;

        newTimeSlotsAvailability.set(availableTimeSlot, count - 1);
      }
    }

    return newTimeSlotsAvailability;
  }

  async function copyUrl(): Promise<void> {
    if (!isUrlCopied) {
      await navigator.clipboard.writeText(
        `https://lets-meet-ivory.vercel.app/group/${params.groupId}`
      );
    }

    setIsUrlCopied((val) => !val);
  }

  function handleClickOnProfilePic() {
    openModal('Menu');
  }

  function viewMembers() {
    openModal('MemberSelection');
  }

  return (
    <>
      <main
        className={clsx('relative mx-auto max-w-[1024px] px-4 text-white', {
          'h-screen overflow-hidden': modalContent !== '',
          'h-auto': modalContent === '',
        })}
      >
        <section className='flex h-12 w-full items-center justify-end gap-4 bg-zinc-800 font-bold'>
          <a className='text-sky-500' href='/'>
            New meetings
          </a>
          {user ? (
            <img
              className='h-8 w-8 cursor-pointer rounded-full'
              src={user.avatarUrl}
              onClick={handleClickOnProfilePic}
            />
          ) : (
            <button
              className='cursor-pointer text-emerald-500'
              onClick={handleLogin}
            >
              Log In
            </button>
          )}
        </section>

        <section className='flex h-12 w-full items-center justify-end gap-4 bg-zinc-800'>
          <input
            className={clsx(
              'h-8 w-[15.5rem] overflow-hidden text-ellipsis bg-zinc-800 text-right font-bold text-white focus:border-2 focus:border-white focus:pr-4 focus:outline-none',
              {
                'pointer-events-none': user === null,
              }
            )}
            value={groupName}
            onChange={handleGroupNameChange}
          />
        </section>

        <section className='flex h-12 w-full items-center justify-end gap-4 bg-zinc-800'>
          {selectedMember === 'all' ? (
            <button
              className='h-8 w-12 rounded-lg bg-sky-500 font-bold'
              onClick={viewMembers}
            >
              All
            </button>
          ) : (
            <img
              className={clsx('h-8 w-8 cursor-pointer rounded-full', {
                invert: !selectedAvatarUrl,
              })}
              src={selectedAvatarUrl ?? '/person-circle.svg'}
              onClick={viewMembers}
            />
          )}

          <section className='flex h-full items-center gap-4'>
            <span className='flex h-8 w-52 items-center overflow-auto whitespace-nowrap rounded-lg bg-zinc-300 px-4 text-slate-700'>{`https://lets-meet-ivory.vercel.app/group/${params.groupId}`}</span>
            {isUrlCopied ? (
              <button
                className='flex h-6 w-6 items-center justify-center text-2xl text-emerald-500'
                onClick={copyUrl}
              >
                &#x2713;
              </button>
            ) : (
              <button
                className='h-6 w-6 bg-[url("/copy.svg")] bg-contain bg-no-repeat invert'
                onClick={copyUrl}
              />
            )}
          </section>
        </section>

        <Schedule
          supabase={supabase}
          userId={user?.userId ?? null}
          groupId={params.groupId}
          blueSlots={almostAvailableTimeSlots}
          greenSlots={greenSlots}
          setGreenSlots={setGreenSlots}
          isUserSelected={selectedMember === user?.userId}
          isAllSelected={selectedMember === 'all'}
        />

        {modalContent !== '' && (
          <Modal
            email={user?.email ?? null}
            handleLogout={handleLogout}
            closeModal={closeModal}
            content={modalContent}
            members={members}
            selectMember={selectMember}
            selectedMember={selectedMember}
            handleLeave={handleLeave}
            leave={leave}
          />
        )}
      </main>
    </>
  );
}
