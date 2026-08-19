import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
  ReactNode,
} from 'react';
type LocalUser = { id: string; email: string; user_metadata: { username: string } };
type LocalSession = { user: LocalUser };

interface AuthContextType {
  user: LocalUser | null;
  session: LocalSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    username?: string
  ) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const localUser: LocalUser = { id: 'local-owner', email: '', user_metadata: { username: 'Owner' } };
  const [user, setUser] = useState<LocalUser | null>(localUser);
  const [session, setSession] = useState<LocalSession | null>({ user: localUser });
  const [loading] = useState(false);

  useEffect(() => {
    // Private alpha: identity stays on this device. No remote auth or tracking.
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const next = { ...localUser, email };
    setUser(next); setSession({ user: next });
    return { error: null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, username?: string) => {
      const next = { ...localUser, email, user_metadata: { username: username || email.split('@')[0] } };
      setUser(next); setSession({ user: next });
      return { error: null, needsConfirmation: false };
    },
    []
  );

  const signOut = useCallback(async () => {
    setUser(localUser); setSession({ user: localUser });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
