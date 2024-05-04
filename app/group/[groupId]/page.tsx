import Schedule from '@/components/Schedule';

export default function Page({ params }: { params: { groupId: string } }) {
  return (
    <>
      <main className='h-screen w-screen text-white'>
        <section className='flex h-[5%] w-screen items-center justify-end gap-2 px-4 font-bold'>
          <div className='cursor-pointer text-emerald-500'>
            Choose a Schedule
          </div>
        </section>

        <section className='h-[95%]'>
          <Schedule />
        </section>
      </main>
    </>
  );
}
