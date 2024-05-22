'use client';

import { useRouter } from 'next/navigation';
import { uuid } from 'uuidv4';

export default function Page() {
  const router = useRouter();

  function startNewMeeting() {
    router.push(`/group/${uuid()}`);
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
          <button
            className='h-10 w-40 rounded-lg bg-emerald-500  hover:bg-emerald-600'
            onClick={() => {
              startNewMeeting();
            }}
          >
            New Meeting
          </button>
        </section>
      </main>
    </>
  );
}
