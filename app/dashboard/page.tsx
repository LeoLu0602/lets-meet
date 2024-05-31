'use client';

import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { handleLogin, handleLogout, retrieveUser } from '@/app/lib/utilities';

export default function Page() {
  useEffect(() => {
    setUp();
  }, []);

  async function setUp(): Promise<void> {
    const user: User | null = await retrieveUser();

    console.log('user:', user);
  }

  return (
    <>
      <main>
        <section className='flex h-12 w-screen items-center justify-between px-4'>
          <h2 className='font-bold text-white'>Dashboard</h2>
          <button
            className='font-bold text-emerald-500'
            onClick={() => {
              handleLogin(`${window.location.origin}/dashboard`);
            }}
          >
            Log In
          </button>
          <button
            className='font-bold text-rose-500'
            onClick={() => {
              handleLogout();
            }}
          >
            Log Out
          </button>
        </section>
      </main>
    </>
  );
}
