/**
 * Product Variant Service
 * Contains business logic for product variant operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere, markDeleted } = require('../../utils/softDelete');
const { uploadToS3 } = require('../../utils/upload');

/**
 * Create a new product variant
 * @param {Object} variantData - Variant data
 * @param {Array} files - Uploaded files
 * @returns {Object} Created variant
 */
const createVariant = async (variantData, files = []) => {
  const { productId, ...data } = variantData;

  // Verify product exists and is not deleted
  const product = await prisma.product.findFirst({
    where: { id: Number(productId), ...notDeletedWhere() }
  });
  
  if (!product) {
    throw new Error('Product not found or has been deleted');
  }

  // Handle image uploads
  const imageUrls = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const imageUrl = await uploadToS3(file.buffer, `variants/${Date.now()}-${file.originalname}`, file.mimetype);
      imageUrls.push(imageUrl);
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Create variant
    const variant = await tx.productVariant.create({
      data: {
        ...data,
        productId: Number(productId),
        price: parseFloat(data.price),
        discountedPrice: data.discountedPrice ? parseFloat(data.discountedPrice) : null,
        stock: parseInt(data.stock) || 0
      },
      include: {
        product: true,
        ProductVarientImage: true
      }
    });

    // Create variant images
    if (imageUrls.length > 0) {
      await tx.productVarientImage.createMany({
        data: imageUrls.map((url, index) => ({
          variantId: variant.id,
          productId: Number(productId),
          url,
          position: index + 1
        }))
      });
    }

    return await tx.productVariant.findUnique({
      where: { id: variant.id },
      include: {
        product: true,
        ProductVarientImage: true
      }
    });
  });
};

/**
 * Get all variants for a product
 * @param {string} productId - Product ID
 * @returns {Array} Product variants
 */
const getVariantsByProduct = async (productId) => {
  // Verify product exists
  const product = await prisma.product.findFirst({
    where: { id: Number(productId), ...notDeletedWhere() }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  return await prisma.productVariant.findMany({
    where: { 
      productId: Number(productId), 
      ...notDeletedWhere() 
    },
    include: {
      product: true,
      ProductVarientImage: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Get variant by ID
 * @param {string} id - Variant ID
 * @returns {Object|null} Variant or null
 */
const getVariantById = async (id) => {
  return await prisma.productVariant.findFirst({
    where: { id: Number(id), ...notDeletedWhere() },
    include: {
      product: {
        include: {
          category: true
        }
      },
      ProductVarientImage: true
    }
  });
};

/**
 * Update variant by ID
 * @param {string} id - Variant ID
 * @param {Object} updateData - Update data
 * @param {Array} files - New uploaded files
 * @returns {Object} Updated variant
 */
const updateVariant = async (id, updateData, files = []) => {
  const { productId, ...data } = updateData;

  // Verify variant exists
  const existingVariant = await prisma.productVariant.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!existingVariant) {
    throw new Error('Product variant not found');
  }

  // Verify product if provided
  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: Number(productId), ...notDeletedWhere() }
    });
    
    if (!product) {
      throw new Error('Product not found or has been deleted');
    }
  }

  // Handle new image uploads
  const imageUrls = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const imageUrl = await uploadToS3(file.buffer, `variants/${Date.now()}-${file.originalname}`, file.mimetype);
      imageUrls.push(imageUrl);
    }
  }

  return await prisma.$transaction(async (tx) => {
    // Update variant
    const updatePayload = { ...data };
    if (productId) updatePayload.productId = Number(productId);
    if (data.price) updatePayload.price = parseFloat(data.price);
    if (data.discountedPrice) updatePayload.discountedPrice = parseFloat(data.discountedPrice);
    if (data.stock !== undefined) updatePayload.stock = parseInt(data.stock);

    const variant = await tx.productVariant.update({
      where: { id: Number(id) },
      data: updatePayload
    });

    // Add new images if provided
    if (imageUrls.length > 0) {
      const existingImagesCount = await tx.productVarientImage.count({
        where: { variantId: Number(id), ...notDeletedWhere() }
      });

      await tx.productVarientImage.createMany({
        data: imageUrls.map((url, index) => ({
          variantId: Number(id),
          productId: variant.productId,
          url,
          position: existingImagesCount + index + 1
        }))
      });
    }

    return await tx.productVariant.findUnique({
      where: { id: Number(id) },
      include: {
        product: true,
        ProductVarientImage: true
      }
    });
  });
};

/**
 * Soft delete variant by ID
 * @param {string} id - Variant ID
 */
const deleteVariant = async (id) => {
  const variant = await prisma.productVariant.findFirst({
    where: { id: Number(id), ...notDeletedWhere() }
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  await markDeleted('productVariant', id, prisma);
};

/**
 * Hard delete variant by ID (Admin only)
 * @param {string} id - Variant ID
 * @param {string} adminId - Admin user ID for audit
 */
const hardDeleteVariant = async (id, adminId) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: Number(id) }
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  // Log the hard delete action
  console.log(`Hard delete variant ${id} by admin ${adminId} at ${new Date().toISOString()}`);

  await prisma.productVariant.delete({
    where: { id: Number(id) }
  });
};

module.exports = {
  createVariant,
  getVariantsByProduct,
  getVariantById,
  updateVariant,
  deleteVariant,
  hardDeleteVariant
};
