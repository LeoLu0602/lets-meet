'use client';

import { useState, useEffect } from 'react';
import {
  AuthError,
  PostgrestError,
  User,
  createClient,
} from '@supabase/supabase-js';
import Schedule from '@/components/Schedule';
import Modal from '@/components/Modal';

const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_URL = 'https://dynrtinrvrbbilkazcei.supabase.co';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Page({ params }: { params: { groupId: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isModalShown, setIsModalShown] = useState<boolean>(false);

  useEffect(() => {
    setUp();
  }, []);

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

  async function setUp() {
    const user: User | null = await retrieveUser();

    setUser(user);

    if (!user) {
      return;
    }

    const groupUser: any[] | null = await retrieveGroupUser(user);

    setAvailableTimeSlots(groupUser?.[0].available_time_slots ?? []);

    if (!groupUser || groupUser.length > 0) {
      return;
    }

    await joinGroup(user);
  }

  async function retrieveUser(): Promise<User | null> {
    const {
      data: { user },
    }: { data: { user: User | null } } = await supabase.auth.getUser();

    return user;
  }

  async function retrieveGroupUser(user: User) {
    const {
      data,
      error,
    }: { data: any[] | null; error: PostgrestError | null } = await supabase
      .from('group_user')
      .select('*')
      .eq('user_id', user.id)
      .eq('group_id', params.groupId);

    if (error) {
      console.error('Retrieve Group User Error: ', error);
      alert('Retrieve Group User Error');
    }

    return data;
  }

  async function joinGroup(user: User) {
    const { error }: { error: PostgrestError | null } = await supabase
      .from('group_user')
      .insert([
        {
          user_id: user.id,
          group_id: params.groupId,
          available_time_slots: [],
        },
      ]);

    if (error) {
      console.error('Join Group Error: ', error);
      alert('Join Group Error');
    }
  }

  return (
    <>
      <main className='text-white'>
        <section className='fixed left-0 top-0 z-10 flex h-12 w-screen items-center justify-end bg-zinc-800 px-4 font-bold'>
          {user ? (
            <img
              src={user.user_metadata.avatar_url}
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
          userId={user?.id ?? null}
          groupId={params.groupId}
          initAvailableTimeSlots={availableTimeSlots}
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
