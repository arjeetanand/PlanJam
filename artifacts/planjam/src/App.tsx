import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ClerkProvider, SignIn, SignUp } from '@clerk/react';

import { HomePage } from './pages/home';
import { UserPortal } from './pages/user-portal';
import { RoomContainer } from './pages/room-container';
import { Shell } from './components/layout/shell';
import { ClerkAuthProvider, AuthContext } from './lib/auth';
import { clerkPubKey, clerkProxyUrl, clerkAppearance, hasClerk, basePath } from './lib/clerk-config';

function NotFound() {
  return (
    <Shell>
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <h1 className="font-display text-4xl font-bold text-[#27304C]">404</h1>
          <p className="mt-2 text-[#6A6E80]">We couldn't find what you're looking for.</p>
        </div>
      </div>
    </Shell>
  );
}

export default function App() {
  const router = (
    <WouterRouter base={basePath}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/user-portal">
          {hasClerk ? <UserPortal /> : <NotFound />}
        </Route>
        
        <Route path="/sign-in">
          <Shell>
            {hasClerk ? (
              <main className="page-in mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-16 sm:px-8">
                <SignIn routing="hash" />
              </main>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="text-center">
                  <h1 className="font-display text-2xl font-bold text-[#27304C]">Sign in unavailable</h1>
                  <p className="mt-2 text-[#6A6E80]">Accounts are currently disabled for this app.</p>
                </div>
              </div>
            )}
          </Shell>
        </Route>
        
        <Route path="/sign-up">
          <Shell>
            {hasClerk ? (
              <main className="page-in mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-16 sm:px-8">
                <SignUp routing="hash" />
              </main>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="text-center">
                  <h1 className="font-display text-2xl font-bold text-[#27304C]">Sign up unavailable</h1>
                  <p className="mt-2 text-[#6A6E80]">Accounts are currently disabled for this app.</p>
                </div>
              </div>
            )}
          </Shell>
        </Route>
        
        <Route path="/room/:slug" component={RoomContainer} />
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );

  if (hasClerk && clerkPubKey) {
    return (
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signUpForceRedirectUrl="/user-portal"
        signInForceRedirectUrl="/user-portal"
        afterSignOutUrl="/"
      >
        <ClerkAuthProvider>
          {router}
        </ClerkAuthProvider>
      </ClerkProvider>
    );
  }

  return (
    <AuthContext.Provider value={{ isLoaded: true, isSignedIn: false, user: null, signOut: () => {} }}>
      {router}
    </AuthContext.Provider>
  );
}
