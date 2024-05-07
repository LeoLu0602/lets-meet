'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Schedule from '@/components/Schedule';
import Modal from '@/components/Modal';

const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_URL = 'https://dynrtinrvrbbilkazcei.supabase.co';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface User {
  userId: string;
  email: string;
  avatarUrl: string;
}

export default function Page({ params }: { params: { groupId: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [isModalShown, setIsModalShown] = useState<boolean>(false);

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
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

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout Error: ', error);
      alert('Logout Error');
    } else {
      setUser(null);
      closeModal();
    }
  }

  function openModal() {
    setIsModalShown(true);
  }

  function closeModal() {
    setIsModalShown(false);
  }

  useEffect(() => {
    async function setUp() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUser({
            userId: user.id,
            email: user.email ?? '',
            avatarUrl: user.user_metadata.avatar_url,
          });

          // check if group-user relation exists
          const { data: group_user } = await supabase
            .from('group_user')
            .select('*')
            .eq('user_id', user.id);

          // no group-user relation -> create one
          if (!group_user || group_user.length === 0) {
            await supabase
              .from('group_user')
              .insert([{ group_id: params.groupId, user_id: user.id }]);
          }
        }
      } catch (error) {
        console.error('Set Up Error: ', error);
        alert('Set Up Error');
      }
    }

    setUp();
  }, []);

  return (
    <>
      <main className='text-white'>
        <section className='fixed left-0 top-0 z-10 flex h-12 w-screen items-center justify-end bg-zinc-800 px-4 font-bold'>
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
        <Schedule supabase={supabase} userId={user?.userId ?? null} />
        {isModalShown && (
          <Modal
            email={user?.email ?? ''}
            handleLogout={handleLogout}
            closeModal={closeModal}
          />
        )}
      </main>
    </>
  );
}
