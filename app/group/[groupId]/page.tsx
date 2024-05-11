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
  email: string;
  availableTimeSlots: string[];
  avatarUrl: string;
}

export default function Page({ params }: { params: { groupId: string } }) {
  const [user, setUser] = useState<Omit<Member, 'availableTimeSlots'> | null>(
    null
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isModalShown, setIsModalShown] = useState<boolean>(false);
  const isUserSelected: boolean =
    user !== null && selectedMember !== null && selectedMember === user.userId;

  useEffect(() => {
    setUp();

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
      changeAvailableTimeSlots(selectedMember);
    }
  }, [selectedMember]);

  useEffect(() => {
    /*
      When a user is viewing/changing his/her own schedule,
      changes in DB should not affect availableTimeSlots.
      
      Doing so could slow down changes and results in poor user experience.
    */

    if (selectedMember && user && selectedMember !== user.userId) {
      changeAvailableTimeSlots(selectedMember);
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

    // user is logged in
    if (user) {
      setAvailableTimeSlots(allAvailableTimeSlots.get(user.id) ?? []);
      setUser({
        userId: user.id,
        email: user.user_metadata.email,
        avatarUrl: user.user_metadata.avatar_url,
      });
      setSelectedMember('all');

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
          email,
          available_time_slots: availableTimeSlots,
          avatar_url: avatarUrl,
        }) => {
          return {
            userId,
            email,
            availableTimeSlots,
            avatarUrl,
          };
        }
      ) ?? []
    );
  }

  async function retrieveUser(): Promise<User | null> {
    const {
      data: { user },
    }: { data: { user: User | null } } = await supabase.auth.getUser();

    return user;
  }

  async function joinGroup(user: User, groupId: string) {
    const { error }: { error: PostgrestError | null } = await supabase
      .from('group_user')
      .insert([
        {
          group_id: groupId,
          user_id: user.id,
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
      setAvailableTimeSlots([]);
      closeModal();
    }
  }

  function openModal(): void {
    setIsModalShown(true);
  }

  function closeModal(): void {
    setIsModalShown(false);
  }

  function selectMember(memberId: string | null): void {
    setSelectedMember(memberId);
  }

  function changeAvailableTimeSlots(selectedMember: string): void {
    const allAvailableTimeSlots: Map<string, string[]> = new Map(
      members.map(({ userId, availableTimeSlots }) => [
        userId,
        availableTimeSlots,
      ])
    );
    const newAllAvailableTimeSlots: string[] =
      selectedMember === 'all'
        ? Array.from(
            combineSets(
              members.map(
                ({ availableTimeSlots }) => new Set(availableTimeSlots)
              )
            )
          )
        : allAvailableTimeSlots.get(selectedMember) ?? [];

    setAvailableTimeSlots(newAllAvailableTimeSlots);
  }

  function combineSets(sets: Set<string>[]): Set<string> {
    let combinedSet: Set<string> = new Set();

    for (let i = 0; i < sets.length; i++) {
      const nextSet: Set<string> = sets[i];

      if (i === 0) {
        combinedSet = sets[0];
        continue;
      }

      combinedSet = new Set(
        Array.from(combinedSet).filter((val: string) => nextSet.has(val))
      );
    }

    return combinedSet;
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(
      `https://lets-meet-ivory.vercel.app/group/${params.groupId}`
    );
  }

  return (
    <>
      <main className='relative mx-auto max-w-[1024px] px-4 text-white'>
        <section className='sticky left-0 top-0 z-10 flex h-12 w-full items-center justify-end bg-zinc-800 font-bold'>
          {user ? (
            <img
              src={user.avatarUrl}
              className='h-8 w-8 cursor-pointer rounded-full'
              onClick={openModal}
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

        <section className='sticky left-0 top-12 z-10 flex h-12 w-full items-center justify-end gap-4 bg-zinc-800'>
          <input
            className='h-8 w-60 overflow-auto rounded-lg px-4 text-black focus:outline-none'
            value={`https://lets-meet-ivory.vercel.app/group/${params.groupId}`}
          />
          <button
            className='h-6 w-6 bg-[url("/copy.svg")] bg-contain bg-no-repeat invert'
            onClick={copyUrl}
          />
        </section>

        <Schedule
          supabase={supabase}
          userId={user?.userId ?? null}
          groupId={params.groupId}
          availableTimeSlots={availableTimeSlots}
          setAvailableTimeSlots={setAvailableTimeSlots}
          isUserSelected={isUserSelected}
        />

        {isModalShown && (
          <Modal
            email={user?.email ?? null}
            handleLogout={handleLogout}
            closeModal={closeModal}
          />
        )}
      </main>
    </>
  );
}
