'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  brand: z.string().optional(),
  category: z.string().optional(),
  barcodeUnit: z.string().trim().optional().or(z.literal('')),
  barcodePack: z.string().trim().optional().or(z.literal('')),
  packSize: z
    .number({ invalid_type_error: 'Pack size must be a number' })
    .int('Must be an integer')
    .nonnegative('Must be >= 0')
    .default(0),
  trackExpiry: z.boolean().default(false),
  imageUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional()
});

export type ProductFormValues = z.infer<typeof schema>;
const ProductForm = ({
  initialValues,
  method,
  actionUrl,
  onSuccessHref = '/inventory/products',
  showDelete,
  onDelete
}: {
  initialValues?: Partial<ProductFormValues>;
  method: 'POST' | 'PUT';
  actionUrl: string;
  onSuccessHref?: string;
  showDelete?: boolean;
  onDelete?: () => Promise<void>;
}) => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sku: '',
      brand: '',
      category: '',
      barcodeUnit: '',
      barcodePack: '',
      packSize: 0,
      trackExpiry: false,
      imageUrl: '',
      notes: '',
      ...initialValues
    }
  });

  // If initialValues can arrive async (e.g., edit page), reset the form.
  React.useEffect(() => {
    if (initialValues)
      reset({
        ...schema.parse({
          ...initialValues,
          packSize: Number(initialValues.packSize ?? 0)
        })
      });
  }, [initialValues, reset]);

  const imageUrl = watch('imageUrl');

  const onSubmit = async (values: ProductFormValues) => {
    const body = {
      ...values,
      // normalize empties
      barcodeUnit: values.barcodeUnit || undefined,
      barcodePack: values.barcodePack || undefined,
      imageUrl: values.imageUrl || undefined,
      packSize: Number(values.packSize || 0)
    };

    const res = await fetch(actionUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Request failed');

    router.push(onSuccessHref);
    router.refresh();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Errors summary */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {Object.values(errors).map((e, i) => (
            <div key={i}>{e?.message as string}</div>
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm">Name</span>
          <input
            className="w-full rounded border px-3 py-2"
            {...register('name')}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">SKU (internal)</span>
          <input
            className="w-full rounded border px-3 py-2"
            {...register('sku')}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Brand</span>
          <input
            className="w-full rounded border px-3 py-2"
            {...register('brand')}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Category</span>
          <input
            className="w-full rounded border px-3 py-2"
            {...register('category')}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Unit Barcode</span>
          <input
            className="w-full rounded border px-3 py-2"
            {...register('barcodeUnit')}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Pack Barcode</span>
          <input
            className="w-full rounded border px-3 py-2"
            {...register('barcodePack')}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm">Pack Size</span>
          <input
            type="number"
            className="w-full rounded border px-3 py-2"
            {...register('packSize', { valueAsNumber: true })}
          />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('trackExpiry')} />
          <span className="text-sm">Track expiry/lot</span>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm">Image URL</span>
          <input
            className="w-full rounded border px-3 py-2"
            {...register('imageUrl')}
            placeholder="https://…"
          />
        </label>

        {imageUrl ? (
          <div className="flex items-end">
            <img
              src={imageUrl}
              alt="preview"
              className="h-24 w-24 rounded border object-cover"
              onError={(e) =>
                ((e.currentTarget as HTMLImageElement).style.display = 'none')
              }
            />
          </div>
        ) : (
          <div />
        )}
      </div>

      <label className="block space-y-1">
        <span className="text-sm">Notes</span>
        <textarea
          className="w-full rounded border px-3 py-2"
          {...register('notes')}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting
            ? 'Saving…'
            : method === 'POST'
              ? 'Create'
              : 'Save changes'}
        </button>

        {showDelete && onDelete && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Delete this product?')) return;
              await onDelete();
            }}
            className="rounded border border-red-300 bg-red-50 px-3 py-2 text-red-700"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;
