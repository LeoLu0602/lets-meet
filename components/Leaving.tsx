'use client';

export default function Leaving({
  leave,
  closeModal,
}: {
  leave: Function;
  closeModal: Function;
}) {
  return (
    <section className='flex h-60 w-80 flex-col items-center justify-center gap-6 rounded-lg bg-zinc-800/100 font-bold'>
      <h2 className='w-11/12 overflow-hidden text-ellipsis whitespace-nowrap text-center text-xl'>
        Are you sure?
      </h2>
      <section className='flex gap-16'>
        <button
          className='text-xl text-emerald-500'
          onClick={() => {
            closeModal();
          }}
        >
          No
        </button>
        <button
          className='text-xl text-rose-500'
          onClick={() => {
            leave();
          }}
        >
          Yes
        </button>
      </section>
    </section>
  );
}
