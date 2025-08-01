const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  stock: z.number().int().min(0, 'Stock cannot be negative').default(0),
  sku: z.string().optional(),
  weight: z.number().positive().optional(),
  fabric: z.string().optional(),
  care: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isActive: z.boolean().default(true)
});

const updateProductSchema = createProductSchema.partial();

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true)
});

const updateCategorySchema = createCategorySchema.partial();

const createBrandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  description: z.string().optional(),
  logo: z.string().optional(),
  isActive: z.boolean().default(true)
});

const updateBrandSchema = createBrandSchema.partial();

const createReviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().optional(),
  comment: z.string().min(1, 'Comment is required').max(1000, 'Comment cannot exceed 1000 characters')
});

const updateReviewSchema = createReviewSchema.partial();

const createProductImageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  altText: z.string().optional(),
  sortOrder: z.number().int().default(0)
});

const createProductVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  value: z.string().min(1, 'Variant value is required'),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional()
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
  createReviewSchema,
  updateReviewSchema,
  createProductImageSchema,
  createProductVariantSchema
};