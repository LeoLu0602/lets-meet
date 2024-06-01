export interface Member {
  userId: string;
  username: string;
  email: string;
  avatarUrl: string;
  availableTimeSlots: string[];
}

export interface UserInfo {
  userId: string;
  username: string;
  email: string;
  avatarUrl: string;
}

export type ModalOptions = '' | 'MemberSelection' | 'Menu' | 'Leaving';
