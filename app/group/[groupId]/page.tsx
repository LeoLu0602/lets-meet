import Schedule from '@/components/Schedule';

export default function Page({ params }: { params: { groupId: string } }) {
  return (
    <>
      <main className='text-white'>
        <section className='flex h-12 w-screen items-center px-4 font-bold'>
          <div className='cursor-pointer text-emerald-500'>
            Choose a Schedule
          </div>
        </section>
        <Schedule />
      </main>
    </>
  );
}
