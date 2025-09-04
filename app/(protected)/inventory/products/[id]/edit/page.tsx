import React from 'react';
import ProductForm from '@/components/forms/ProductForm';
import { prisma } from '@/lib/prisma';
import PageContainer from '@/components/layout/page-container';

const page = async ({ params }: { params: { id: string } }) => {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      sku: true,
      notes: true,
      imageUrl: true,
      barcodeUnit: true,
      barcodePack: true,
      packSize: true,
      trackExpiry: true,
      brand: { select: { name: true } },
      category: { select: { name: true } }
    }
  });

  if (!product)
    return <div className="text-sm text-red-600">Product not found.</div>;

  const initialValues = {
    name: product.name,
    sku: product.sku,
    brand: product.brand?.name ?? '',
    category: product.category?.name ?? '',
    barcodeUnit: product.barcodeUnit ?? '',
    barcodePack: product.barcodePack ?? '',
    packSize: product.packSize ?? 0,
    trackExpiry: product.trackExpiry,
    imageUrl: product.imageUrl ?? '',
    notes: product.notes ?? ''
  };

  async function handleDelete() {
    'use server';
    await fetch(`/api/inventory/products/${product.id}`, {
      method: 'DELETE'
    });
  }
  return (
    <PageContainer>
      <h1 className="mb-3 text-2xl font-semibold">Edit Product</h1>
      <ProductForm
        initialValues={initialValues}
        method="PUT"
        actionUrl={`/api/inventory/products/${product.id}`}
        showDelete
        onDelete={handleDelete}
      />
    </PageContainer>
  );
};

export default page;
