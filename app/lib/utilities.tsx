import { AuthError, User, createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function handleLogin(redirectTo: string): Promise<void> {
  const { error }: { error: AuthError | null } =
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

  if (error) {
    console.error('Login Error: ', error);
    alert('Login Error');
  }
}

export async function handleLogout(): Promise<void> {
  const { error }: { error: AuthError | null } = await supabase.auth.signOut();

  if (error) {
    console.error('Logout Error: ', error);
    alert('Logout Error');
  }
}

export async function retrieveUser(): Promise<User | null> {
  try {
    const {
      data: { user },
    }: { data: { user: User | null } } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    console.error('Retrieve User Error: ', error);
    alert('Retrieve User Error');

    return null;
  }
}
