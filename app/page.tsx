'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Page() {
  const router = useRouter();

  function startNewMeeting() {
    router.push(`/group/${uuidv4()}`);
  }

  function goToDashboard() {
    router.push('/dashboard');
  }

  return (
    <>
      <main className='flex h-screen w-screen items-center justify-center font-bold text-white'>
        <section className='flex flex-col items-center justify-center'>
          <h1 className='mb-4 text-center text-6xl text-emerald-500'>
            Let's Meet
          </h1>

          <h2 className='mb-8 text-center text-xl text-white '>
            Schedule your next group meeting
          </h2>

          <section className='flex gap-4'>
            <button
              className='h-10 w-36 rounded-lg bg-emerald-500'
              onClick={startNewMeeting}
            >
              New Meeting
            </button>

            <button
              className='h-10 w-36 rounded-lg bg-sky-500'
              onClick={goToDashboard}
            >
              Dashboard
            </button>
          </section>
        </section>
      </main>
    </>
  );
}
