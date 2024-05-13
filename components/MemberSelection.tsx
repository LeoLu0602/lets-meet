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
}: {
  members: Member[];
  selectMember: Function;
  closeModal: Function;
}) {
  function handleSelect(userId: string) {
    selectMember(userId);
    closeModal();
  }

  return (
    <section className='h-96 w-80 bg-zinc-800/100'>
      <ul className='h-full w-full overflow-auto font-bold'>
        <li
          className='cursor-pointer border-b-2 p-4 text-2xl'
          onClick={() => {
            handleSelect('all');
          }}
        >
          All ({members.length})
        </li>
        {[...members]
          .sort(({ username: username1 }, { username: username2 }) => {
            if (username1 < username2) {
              return -1;
            } else {
              return 1;
            }

            return 0;
          })
          .map(({ userId, username, email, avatarUrl }) => (
            <li
              className='cursor-pointer border-b-2 p-4 last:border-b-0'
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
                <span className='text-2xl'>{username}</span>
              </section>
              <section>{email}</section>
            </li>
          ))}
      </ul>
    </section>
  );
}
