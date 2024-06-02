'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { UserInfo } from '@/app/interfacesAndTypes';
import { handleLogin, handleLogout, retrieveUser } from '@/app/lib/utilities';

export default function Page() {
  const [user, setUser] = useState<UserInfo | null>(null);

  const router = useRouter();

  useEffect(() => {
    setUp();
  }, []);

  async function setUp(): Promise<void> {
    const user: User | null = await retrieveUser();

    if (user) {
      setUser({
        userId: user.id,
        username: user.user_metadata.name,
        email: user.user_metadata.email,
        avatarUrl: user.user_metadata.avatar_url,
      });
    }
  }

  return (
    <>
      <main>
        <section className='flex h-12 w-screen items-center justify-between px-4'>
          <h2 className='text-xl font-bold text-white'>Dashboard</h2>
          {user ? (
            <button
              className='font-bold text-rose-500'
              onClick={() => {
                handleLogout();
                router.push('/');
              }}
            >
              Log Out
            </button>
          ) : (
            <button
              className='font-bold text-emerald-500'
              onClick={() => {
                handleLogin(`${window.location.origin}/dashboard`);
              }}
            >
              Log In
            </button>
          )}
        </section>

        <a className='px-4 font-bold text-sky-500' href='/'>
          New Group
        </a>

        {user && (
          <section className='w-screen p-4 font-bold text-white'>
            <section className='flex items-center gap-2'>
              <img src={user.avatarUrl} className='h-8 w-8 rounded-full' />
              <span className='overflow-hidden text-ellipsis whitespace-nowrap text-2xl'>
                {user.username}
              </span>
            </section>
            <section className='mt-2 overflow-hidden text-ellipsis whitespace-nowrap'>
              {user.email}
            </section>
          </section>
        )}
      </main>
    </>
  );
}
