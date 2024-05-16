'use client';

import { useState, useEffect } from 'react';
import {
  AuthError,
  PostgrestError,
  User,
  createClient,
} from '@supabase/supabase-js';
import clsx from 'clsx';
import Schedule from '@/components/Schedule';
import Modal from '@/components/Modal';

const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_URL = 'https://dynrtinrvrbbilkazcei.supabase.co';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Member {
  userId: string;
  username: string;
  email: string;
  availableTimeSlots: string[];
  avatarUrl: string;
}

type ModalOptions = 'MemberSelection' | 'Logout' | '';

export default function Page({ params }: { params: { groupId: string } }) {
  const [user, setUser] = useState<Omit<Member, 'availableTimeSlots'> | null>(
    null
  );

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('all'); // selected member's userId
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]); // green time slots shown on screen
  const [isModalShown, setIsModalShown] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<ModalOptions>('');
  const [isUrlCopied, setIsUrlCopied] = useState<boolean>(false);

  const membersMap: Map<string, Member> = new Map(
    members.map((member) => [member.userId, member])
  );

  /*
    timeSlotsAvailability: Map<string, number>
  
    key: an available time slot in at least one member's availableTimeSlots
    value: the number of members who DON'T have [key] in their availableTimeSlots
  */

  const timeSlotsAvailability: Map<string, number> =
    getTimeSlotsAvailability(members);

  const selectedAvatarUrl: string | null =
    membersMap.get(selectedMember)?.avatarUrl ?? null;

  const almostAvailableTimeSlots: string[] = Array.from(timeSlotsAvailability)
    .filter((pair) => pair[1] === 1)
    .map((pair) => pair[0]); // blue time slots shown on screen (one member is absent)

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
    if (selectedMember) {
      updateAvailableTimeSlots(selectedMember);
    }
  }, [selectedMember]);

  useEffect(() => {
    /*
      When a user is viewing/changing his/her own schedule,
      changes in DB should not affect availableTimeSlots.
      
      Doing so could slow down changes and results in poor user experience.
    */
    if (selectedMember !== user?.userId) {
      updateAvailableTimeSlots(selectedMember);
    }
  }, [members]);

  async function setUp(): Promise<void> {
    const members: Member[] = await getMembers(params.groupId);
    const user: User | null = await retrieveUser();
    const memberIds: Set<string> = new Set(members.map(({ userId }) => userId));
    const allAvailableTimeSlots: Map<string, string[]> = new Map(
      members.map(({ userId, availableTimeSlots }) => [
        userId,
        availableTimeSlots,
      ])
    );

    setMembers(members);
    setSelectedMember('all');

    // user is logged in
    if (user) {
      setAvailableTimeSlots(allAvailableTimeSlots.get(user.id) ?? []);
      setUser({
        userId: user.id,
        username: user.user_metadata.name,
        email: user.user_metadata.email,
        avatarUrl: user.user_metadata.avatar_url,
      });

      // user not in the group yet -> user joins the group
      if (!memberIds.has(user.id)) {
        await joinGroup(user, params.groupId);
      }
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
      console.error('Retrieve Group User Error: ', error);
      alert('Retrieve Group User Error');

      return [];
    }

    return (
      data?.map(
        ({
          user_id: userId,
          user_name: username,
          email,
          available_time_slots: availableTimeSlots,
          avatar_url: avatarUrl,
        }) => {
          return {
            userId,
            username,
            email,
            availableTimeSlots,
            avatarUrl,
          };
        }
      ) ?? []
    );
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

  async function joinGroup(user: User, groupId: string) {
    const { error }: { error: PostgrestError | null } = await supabase
      .from('group_user')
      .insert([
        {
          group_id: groupId,
          user_id: user.id,
          user_name: user.user_metadata.name,
          email: user.user_metadata.email,
          available_time_slots: [],
          avatar_url: user.user_metadata.avatar_url,
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

  function openModal(content: 'MemberSelection' | 'Logout'): void {
    setModalContent(content);
    setIsModalShown(true);
  }

  function closeModal(): void {
    setIsModalShown(false);
  }

  function selectMember(memberId: string): void {
    setSelectedMember(memberId);
  }

  function updateAvailableTimeSlots(selectedMember: string): void {
    if (selectedMember === 'all') {
      setAvailableTimeSlots(
        Array.from(timeSlotsAvailability)
          .filter((pair) => pair[1] === 0)
          .map((pair) => pair[0])
      );
    } else {
      setAvailableTimeSlots(
        membersMap.get(selectedMember)?.availableTimeSlots ?? []
      );
    }
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

  async function copyUrl() {
    if (!isUrlCopied) {
      await navigator.clipboard.writeText(
        `https://lets-meet-ivory.vercel.app/group/${params.groupId}`
      );
    }

    setIsUrlCopied((val) => !val);
  }

  function handleClickOnProfilePic() {
    openModal('Logout');
  }

  function viewMembers() {
    openModal('MemberSelection');
  }

  return (
    <>
      <main
        className={clsx('relative mx-auto max-w-[1024px] px-4 text-white', {
          'h-screen overflow-hidden': isModalShown,
          'h-auto': !isModalShown,
        })}
      >
        <section className='flex h-12 w-full items-center justify-end bg-zinc-800 font-bold'>
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
            <span className='flex h-8 w-52 items-center overflow-auto whitespace-nowrap rounded-lg bg-zinc-400 px-4 text-slate-700'>{`https://lets-meet-ivory.vercel.app/group/${params.groupId}`}</span>
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
          availableTimeSlots={availableTimeSlots}
          almostAvailableTimeSlots={almostAvailableTimeSlots}
          setAvailableTimeSlots={setAvailableTimeSlots}
          isUserSelected={selectedMember === user?.userId}
          isAllSelected={selectedMember === 'all'}
        />

        {isModalShown && (
          <Modal
            email={user?.email ?? null}
            handleLogout={handleLogout}
            closeModal={closeModal}
            content={modalContent}
            members={members}
            selectMember={selectMember}
            selectedMember={selectedMember}
          />
        )}
      </main>
    </>
  );
}
