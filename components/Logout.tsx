export default function MemberSelection({
  email,
  handleLogout,
  closeModal,
}: {
  email: string | null;
  handleLogout: Function;
  closeModal: Function;
}) {
  return (
    <section className='flex h-60 w-80 flex-col items-center justify-center gap-8 rounded-lg bg-zinc-800/100 font-bold'>
      <h2 className='w-11/12 overflow-hidden text-ellipsis whitespace-nowrap text-center text-xl'>
        👋 {email ?? ''}
      </h2>
      <button
        className='text-xl text-sky-500'
        onClick={() => {
          handleLogout();
        }}
      >
        Log Out
      </button>
      <button
        className='text-xl text-rose-500'
        onClick={() => {
          closeModal();
        }}
      >
        Cancel
      </button>
    </section>
  );
}
