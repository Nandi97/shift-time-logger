'use client';
import { Button } from '@/components/ui/button';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import GithubSignInButton from './github-auth-button';

// type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, startTransition] = useTransition();
  const defaultValues = {
    email: 'demo@gmail.com'
  };

  // const onSubmit = async (data: UserFormValue) => {
  //   startTransition(() => {
  //     signIn('credentials', {
  //       email: data.email,
  //       callbackUrl: callbackUrl ?? '/dashboard'
  //     });
  //     toast.success('Signed In Successfully!');
  //   });
  // };

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or continue with
          </span>
        </div>
      </div>
      <GithubSignInButton />
    </>
  );
}
