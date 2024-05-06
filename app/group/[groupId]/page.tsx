import Schedule from '@/components/Schedule';

export default function Page({ params }: { params: { groupId: string } }) {
  return (
    <>
      <main className='text-white'>
        <section className='fixed left-0 top-0 flex h-12 w-screen items-center bg-zinc-800 px-4 font-bold'>
          <div className='cursor-pointer text-emerald-500'>
            Choose a Schedule
          </div>
        </section>
        <Schedule />
      </main>
    </>
  );
}
