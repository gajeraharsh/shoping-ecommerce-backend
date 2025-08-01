const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  sku: z.string().optional(),
  weight: z.number().positive().optional(),
  isFeatured: z.boolean().default(false)
});

const updateProductSchema = createProductSchema.partial();

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional()
});

const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  description: z.string().optional()
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  createBrandSchema
};