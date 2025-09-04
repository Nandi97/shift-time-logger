import PageContainer from '@/components/layout/page-container';

import React from 'react';
import ProductForm from '@/components/forms/ProductForm';

const page = () => {
  return (
    <PageContainer>
      <h1 className="mb-3 text-2xl font-semibold">Create Product</h1>
      <ProductForm method="POST" actionUrl="/api/inventory/products" />
    </PageContainer>
  );
};

export default page;
