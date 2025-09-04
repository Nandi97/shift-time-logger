import { auth } from '@/auth';
import ClockPage from '@/components/main/ClockPage';
import React from 'react';

const page = async () => {
  console.log((await auth())?.user.role);
  return (
    <div>
      <ClockPage />
    </div>
  );
};

export default page;
