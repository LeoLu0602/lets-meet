'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { UserInfo } from '@/app/interfacesAndTypes';
import {
  handleLogin,
  handleLogout,
  retrieveUser,
  getGroups,
} from '@/app/lib/utilities';
import { group } from 'console';

export default function Page() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [groups, setGroups] = useState<{ name: string; id: string }[]>([]);

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

      const groups: { name: string; id: string }[] = await getGroups(user.id);

      setGroups(groups);
    }
  }

  return (
    <>
      <main className='absolute left-0 top-0 w-screen p-4'>
        <section className='flex h-12 w-full items-center justify-between'>
          <h2 className='text-2xl font-bold text-white'>Dashboard</h2>
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

        <a className='my-4 block font-bold text-sky-500' href='/'>
          New Group
        </a>

        {user && (
          <>
            <section className='font-bold text-white'>
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

            <h2 className='my-8 text-2xl font-bold text-emerald-500'>
              Your Groups
            </h2>

            <ul className='font-bold text-white'>
              {groups.map((group) => (
                <li
                  key={group.id}
                  className='mb-4 cursor-pointer text-sky-500 last:mb-0'
                >
                  <a href={`/group/${group.id}`}>{group.name}</a>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
