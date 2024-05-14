'use client';
import clsx from 'clsx';

interface Member {
  userId: string;
  username: string;
  email: string;
  availableTimeSlots: string[];
  avatarUrl: string;
}

export default function MemberSelection({
  members,
  selectMember,
  closeModal,
  selectedMember,
}: {
  members: Member[];
  selectMember: Function;
  closeModal: Function;
  selectedMember: string | null;
}) {
  function handleSelect(userId: string) {
    selectMember(userId);
    closeModal();
  }

  return (
    <section className='relative h-96 w-80 rounded-lg bg-zinc-800/100'>
      <button
        className='absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded bg-rose-500 text-xl font-bold'
        onClick={() => {
          closeModal();
        }}
      >
        &#x2715;
      </button>
      <ul className='h-full w-full overflow-auto font-bold'>
        <li
          className='cursor-pointer p-4 text-2xl'
          onClick={() => {
            handleSelect('all');
          }}
        >
          All ({members.length})
        </li>
        {[...members]
          .sort(({ username: username1 }, { username: username2 }) => {
            if (username1 <= username2) {
              return -1;
            } else {
              return 1;
            }
          })
          .map(({ userId, username, email, avatarUrl }) => (
            <li
              className={clsx('cursor-pointer p-4', {
                'bg-sky-500': userId === selectedMember,
              })}
              key={userId}
              onClick={() => {
                handleSelect(userId);
              }}
            >
              <section className='flex items-center gap-2'>
                <img
                  src={avatarUrl}
                  className='h-6 w-6 cursor-pointer rounded-full'
                />
                <span className='overflow-hidden text-ellipsis whitespace-nowrap text-2xl'>
                  {username}
                </span>
              </section>
              <section className='overflow-hidden text-ellipsis whitespace-nowrap'>
                {email}
              </section>
            </li>
          ))}
      </ul>
    </section>
  );
}
