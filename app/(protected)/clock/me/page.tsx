import PageContainer from '@/components/layout/page-container';
import Dashboard from '@/components/main/me/Dashboard';
import React from 'react';

const page = () => {
  return (
    <PageContainer scrollable>
      <Dashboard />
    </PageContainer>
  );
};

export default page;
