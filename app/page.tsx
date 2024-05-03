'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export default function Page() {
  const [isCreatingNewRoom, setIsCreatingNewRoom] = useState(false);

  const router = useRouter();

  function startNewMeeting() {
    setIsCreatingNewRoom(true);
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
              'bg-emerald-500  hover:bg-emerald-600': !isCreatingNewRoom,
              'bg-emerald-700': isCreatingNewRoom,
            })}
            onClick={startNewMeeting}
            disabled={isCreatingNewRoom}
          >
            {isCreatingNewRoom ? 'Wait a minute ...' : 'New Meeting'}
          </button>
        </section>
      </main>
    </>
  );
}
