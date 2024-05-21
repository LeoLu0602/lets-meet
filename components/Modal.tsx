'use client';
import MemberSelection from '@/components/MemberSelection';
import Menu from '@/components/Menu';
import Leaving from '@/components/Leaving';

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
  leave,
}: {
  email: string | null;
  handleLogout: Function;
  closeModal: Function;
  content: '' | 'MemberSelection' | 'Menu' | 'Leaving';
  members: Member[];
  selectMember: Function;
  selectedMember: string | null;
  handleLeave: Function;
  leave: Function;
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
      ) : content === 'Menu' ? (
        <Menu
          email={email}
          handleLogout={handleLogout}
          closeModal={closeModal}
          handleLeave={handleLeave}
        />
      ) : content === 'Leaving' ? (
        <Leaving leave={leave} closeModal={closeModal} />
      ) : (
        <></>
      )}
    </section>
  );
}
