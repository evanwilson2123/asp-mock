import { ClerkProvider, SignedIn, SignedOut } from '@clerk/nextjs';
import './globals.css';
import SignInPrompt from '@/components/SignInPrompt';
import ConditionalNavbar from '@/components/ConditionalNavbar';

export const metadata = {
  title: 'ASP Analytics',
  description: 'Generated by create next app',
  icons: {
    icon: '/logo.PNG',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
          <meta charSet="UTF-8" />
        </head>
        {/* 
          Using min-h-screen makes the body at least the viewport height,
          and flex + flex-col + overflow-y-auto let the page scroll 
          if content is longer than the screen. 
        */}
        <body className="min-h-screen w-full flex flex-col overflow-y-auto overflow-x-hidden">
          {/* Fixed Navbar at the top */}
          <ConditionalNavbar />
          {/* 
            Main content:
            - SignedIn: shows the actual page content if the user is signed in
            - SignedOut: shows the sign-in prompt otherwise
          */}
          <SignedIn>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </SignedIn>
          <SignedOut>
            <SignInPrompt />
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}
