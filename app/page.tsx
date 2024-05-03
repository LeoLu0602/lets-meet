'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import clsx from 'clsx';

export default function Page() {
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  async function startNewMeeting() {
    setIsCreatingNewGroup(true);

    const { data, error } = await supabase.from('Group').insert([{}]).select();

    if (error) {
      console.error('Creating Groupe Error: ', error);
      alert('Creating Group Error');
      setIsCreatingNewGroup(false);
    } else {
      const groupId: string = data[0].id;
      const groupUrl: string = '/group/' + groupId;

      router.push(groupUrl);
    }
  }

  return (
    <>
      <main className='flex h-screen w-screen items-center justify-center bg-zinc-800 font-bold text-white'>
        <section className='flex flex-col items-center justify-center'>
          <h1 className='mb-4 text-center text-6xl text-emerald-500'>
            Let's Meet
          </h1>
          <h2 className='mb-8 text-center text-xl text-white '>
            Schedule your next group meeting
          </h2>
          <button
            className={clsx('h-10 w-40 rounded-lg', {
              'bg-emerald-500  hover:bg-emerald-600': !isCreatingNewGroup,
              'bg-emerald-700': isCreatingNewGroup,
            })}
            onClick={startNewMeeting}
            disabled={isCreatingNewGroup}
          >
            {isCreatingNewGroup ? 'Wait a minute ...' : 'New Meeting'}
          </button>
        </section>
      </main>
    </>
  );
}
