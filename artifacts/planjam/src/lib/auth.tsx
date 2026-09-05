import { createContext, useContext, type ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/react';

export type AuthUser = {
  firstName?: string | null;
  primaryEmailAddress?: { emailAddress?: string } | null;
};

export type AuthContextType = {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: AuthUser | null;
  signOut: (options?: any) => void;
};

export const AuthContext = createContext<AuthContextType>({
  isLoaded: true,
  isSignedIn: false,
  user: null,
  signOut: () => {},
});

export function useAppAuth() {
  return useContext(AuthContext);
}

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  
  return (
    <AuthContext.Provider value={{ isLoaded, isSignedIn: !!isSignedIn, user: user || null, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
