'use client';
import MemberSelection from '@/components/MemberSelection';
import Logout from '@/components/Logout';

interface Member {
  userId: string;
  username: string;
  email: string;
  availableTimeSlots: string[];
  avatarUrl: string;
}

export default function Modal({
  email,
  handleLogout,
  closeModal,
  content,
  members,
  selectMember,
  selectedMember,
  handleLeave,
}: {
  email: string | null;
  handleLogout: Function;
  closeModal: Function;
  content: 'MemberSelection' | 'Logout' | '';
  members: Member[];
  selectMember: Function;
  selectedMember: string | null;
  handleLeave: Function;
}) {
  return (
    <section
      className='fixed left-0 top-0 z-20 flex h-screen w-screen items-center justify-center bg-black/80'
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          closeModal();
        }
      }}
    >
      {content === 'MemberSelection' ? (
        <MemberSelection
          members={members}
          selectMember={selectMember}
          closeModal={closeModal}
          selectedMember={selectedMember}
        />
      ) : content === 'Logout' ? (
        <Logout
          email={email}
          handleLogout={handleLogout}
          closeModal={closeModal}
          handleLeave={handleLeave}
        />
      ) : (
        <></>
      )}
    </section>
  );
}
