// src/components/ui/FormModal.tsx
import React, { ReactNode } from 'react';
import { useForm, FieldValues, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from './Modal';
import Button from './Button';
import { toast } from 'sonner';

interface FormModalProps<T extends FieldValues> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  schema: z.ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
  defaultValues?: Partial<T>;
  submitLabel?: string;
  children: (form: UseFormReturn<T>) => ReactNode;
}

export function FormModal<T extends FieldValues>({
  isOpen,
  onClose,
  title,
  schema,
  onSubmit,
  defaultValues,
  submitLabel = 'Submit',
  children
}: FormModalProps<T>) {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any
  });

  const handleSubmit = async (data: T) => {
    try {
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end space-x-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={form.handleSubmit(handleSubmit)}
            isLoading={form.formState.isSubmitting}
          >
            {submitLabel}
          </Button>
        </div>
      }
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {children(form)}
      </form>
    </Modal>
  );
}

// Form field components
export const FormInput: React.FC<{
  label: string;
  name: string;
  register: any;
  error?: any;
  type?: string;
  placeholder?: string;
  required?: boolean;
}> = ({ label, name, register, error, type = 'text', placeholder, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...register(name)}
      type={type}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
    />
    {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
  </div>
);

export const FormSelect: React.FC<{
  label: string;
  name: string;
  register: any;
  error?: any;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}> = ({ label, name, register, error, options, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      {...register(name)}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
    >
      <option value="">Select {label.toLowerCase()}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
  </div>
);

export const FormTextarea: React.FC<{
  label: string;
  name: string;
  register: any;
  error?: any;
  rows?: number;
  placeholder?: string;
}> = ({ label, name, register, error, rows = 3, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <textarea
      {...register(name)}
      rows={rows}
      placeholder={placeholder}
      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
    />
    {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
  </div>
);

// Example usage:
/*
const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive')
});

<FormModal
  isOpen={isOpen}
  onClose={onClose}
  title="Add Product"
  schema={productSchema}
  onSubmit={async (data) => {
    await productsService.create(data);
    toast.success('Product created!');
  }}
>
  {(form) => (
    <>
      <FormInput
        label="Product Name"
        name="name"
        register={form.register}
        error={form.formState.errors.name}
        required
      />
      <FormSelect
        label="Category"
        name="category"
        register={form.register}
        error={form.formState.errors.category}
        options={categories}
        required
      />
    </>
  )}
</FormModal>
*/