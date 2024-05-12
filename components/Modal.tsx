'use client';
import MemberSelection from '@/components/MemberSelection';
import Logout from '@/components/Logout';

export default function Modal({
  email,
  handleLogout,
  closeModal,
  content,
}: {
  email: string | null;
  handleLogout: Function;
  closeModal: Function;
  content: 'MemberSelection' | 'Logout' | '';
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
        <MemberSelection />
      ) : content === 'Logout' ? (
        <Logout
          email={email}
          handleLogout={handleLogout}
          closeModal={closeModal}
        />
      ) : (
        <></>
      )}
    </section>
  );
}
