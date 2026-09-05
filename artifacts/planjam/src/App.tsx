import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ClerkProvider, SignIn, SignUp } from '@clerk/react';

import { HomePage } from './pages/home';
import { UserPortal } from './pages/user-portal';
import { RoomContainer } from './pages/room-container';
import { Shell } from './components/layout/shell';
import { ClerkAuthProvider, AuthContext } from './lib/auth';
import { clerkPubKey, clerkProxyUrl, clerkAppearance, hasClerk, basePath } from './lib/clerk-config';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

function NotFound() {
  return (
    <Shell>
      <main className="safe-page flex flex-1 items-center justify-center py-12">
        <div className="ink-card w-full max-w-md rounded-[2rem] p-8 text-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#F26F52]">wrong turn</p>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-[-.07em] text-[#27304C]">404</h1>
          <p className="mt-3 text-[#6A6E80]">That plan wandered off. Let’s get you back to the start.</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#27304C] px-5 py-3 text-sm font-bold text-[#FFF7E8] shadow-[0_4px_0_#11182D]" data-testid="link-not-found-home">
            <ArrowLeft size={16} /> Back home
          </Link>
        </div>
      </main>
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
              <main className="safe-page page-in flex flex-1 items-center justify-center py-8 sm:py-14">
                <div className="auth-frame">
                  <div className="auth-intro">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#F26F52]">your plans are waiting</p>
                    <h1 className="mt-3 font-display text-4xl font-bold leading-[.94] tracking-[-.07em] text-[#27304C] sm:text-6xl">Good to see you again.</h1>
                    <p className="mt-5 max-w-md text-base leading-7 text-[#6A6E80]">Keep your rooms, pick up the thread, and get the group moving.</p>
                  </div>
                  <div className="auth-panel"><SignIn routing="hash" /></div>
                </div>
              </main>
            ) : (
              <main className="safe-page flex flex-1 items-center justify-center py-12">
                <div className="ink-card max-w-md rounded-[2rem] p-8 text-center">
                  <h1 className="font-display text-2xl font-bold text-[#27304C]">Sign in unavailable</h1>
                  <p className="mt-2 text-[#6A6E80]">Accounts are currently disabled for this app.</p>
                </div>
              </main>
            )}
          </Shell>
        </Route>
        
        <Route path="/sign-up">
          <Shell>
            {hasClerk ? (
              <main className="safe-page page-in flex flex-1 items-center justify-center py-8 sm:py-14">
                <div className="auth-frame">
                  <div className="auth-intro">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-[#F26F52]">bring the crew</p>
                    <h1 className="mt-3 font-display text-4xl font-bold leading-[.94] tracking-[-.07em] text-[#27304C] sm:text-6xl">Make the next plan easier.</h1>
                    <p className="mt-5 max-w-md text-base leading-7 text-[#6A6E80]">Save the room, invite the friends, and skip the endless “what should we do?” loop.</p>
                  </div>
                  <div className="auth-panel"><SignUp routing="hash" /></div>
                </div>
              </main>
            ) : (
              <main className="safe-page flex flex-1 items-center justify-center py-12">
                <div className="ink-card max-w-md rounded-[2rem] p-8 text-center">
                  <h1 className="font-display text-2xl font-bold text-[#27304C]">Sign up unavailable</h1>
                  <p className="mt-2 text-[#6A6E80]">Accounts are currently disabled for this app.</p>
                </div>
              </main>
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
