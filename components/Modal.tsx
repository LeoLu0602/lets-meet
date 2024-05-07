'use client';

export default function Modal({
  email,
  handleLogout,
  closeModal,
}: {
  email: string | null;
  handleLogout: Function;
  closeModal: Function;
}) {
  return (
    <section
      className='fixed left-0 top-0 z-20 flex h-screen w-screen items-center justify-center bg-zinc-800/90'
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          closeModal();
        }
      }}
    >
      <section className='flex h-40 w-80 flex-col items-center justify-center gap-4 bg-black/100 font-bold'>
        <h2>👋 {email ?? ''}</h2>
        <button
          className='text-sky-500'
          onClick={() => {
            handleLogout();
          }}
        >
          Log Out
        </button>
        <button
          className='text-rose-500'
          onClick={() => {
            closeModal();
          }}
        >
          Cancel
        </button>
      </section>
    </section>
  );
}
