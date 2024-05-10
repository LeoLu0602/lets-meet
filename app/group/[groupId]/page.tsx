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
  const [user, setUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isModalShown, setIsModalShown] = useState<boolean>(false);
  const isUserSelected: boolean =
    user !== null && selectedMember !== null && selectedMember === user.userId;

  useEffect(() => {
    setUp();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      updateAvailableTimeSlots(selectedMember);
    }
  }, [selectedMember]);

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
        availableTimeSlots: allAvailableTimeSlots.get(user.id) ?? [],
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
      closeModal();
    }
  }

  function openModal(): void {
    setIsModalShown(true);
  }

  function closeModal(): void {
    setAvailableTimeSlots([]);
    setIsModalShown(false);
  }

  function selectMember(memberId: string | null): void {
    setSelectedMember(memberId);
  }

  function updateAvailableTimeSlots(selectedMember: string): void {
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

  return (
    <>
      <main className='text-white'>
        <section className='fixed left-0 top-0 z-10 flex h-12 w-screen items-center justify-between  bg-zinc-800 px-4 font-bold'>
          <section>
            <button
              className={clsx('h-8 px-4', {
                'bg-zinc-500': isUserSelected,
                'bg-emerald-500': !isUserSelected,
              })}
              onClick={() => {
                selectMember('all');
              }}
            >
              All
            </button>
            <button
              className={clsx('h-8 px-4', {
                'bg-emerald-500': isUserSelected,
                'bg-zinc-500': !isUserSelected,
              })}
              onClick={() => {
                selectMember(user?.userId ?? null);
              }}
            >
              You
            </button>
          </section>
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
        <Schedule
          supabase={supabase}
          userId={user?.userId ?? null}
          groupId={params.groupId}
          initAvailableTimeSlots={availableTimeSlots}
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
