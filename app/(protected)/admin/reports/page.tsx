import PageContainer from '@/components/layout/page-container';
import Dashboard from '@/components/main/admin/Dashboard';
import React from 'react';

const page = () => {
  return (
    <PageContainer scrollable={true}>
      <Dashboard />
    </PageContainer>
  );
};

export default page;
