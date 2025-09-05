import PageContainer from '@/components/layout/page-container';
import ProductsView from '@/components/main/inventory/ProductsView';
import React from 'react';

const page = () => {
  return (
    <PageContainer scrollable>
      <ProductsView />
    </PageContainer>
  );
};

export default page;
