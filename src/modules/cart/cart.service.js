/**
 * Cart Service
 * Contains business logic for cart operations
 */

const prisma = require('../../config/prisma');
const { notDeletedWhere } = require('../../utils/softDelete');

/**
 * Get or create user's cart
 * @param {number} userId - User ID
 * @returns {Object} User's cart
 */
const getCart = async (userId) => {
  let cart = await prisma.cart.findFirst({
    where: { 
      userId: Number(userId),
      ...notDeletedWhere() 
    },
    include: {
      items: {
        where: notDeletedWhere(),
        include: {
          product: {
            include: {
              ProductImage: true
            }
          },
          variant: {
            include: {
              ProductVarientImage: true
            }
          }
        }
      }
    }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: Number(userId) },
      include: {
        items: {
          include: {
            product: {
              include: {
                ProductImage: true
              }
            },
            variant: {
              include: {
                ProductVarientImage: true
              }
            }
          }
        }
      }
    });
  }

  // Calculate cart totals
  let totalItems = 0;
  let totalAmount = 0;

  cart.items.forEach(item => {
    totalItems += item.quantity;
    const price = item.variant.discountedPrice || item.variant.price;
    totalAmount += price * item.quantity;
  });

  return {
    ...cart,
    totalItems,
    totalAmount
  };
};

/**
 * Add item to cart
 * @param {number} userId - User ID
 * @param {Object} itemData - Item data
 * @returns {Object} Updated cart
 */
const addToCart = async (userId, itemData) => {
  const { productId, variantId, quantity } = itemData;

  // Verify product and variant exist
  const product = await prisma.product.findFirst({
    where: { id: Number(productId), ...notDeletedWhere() }
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const variant = await prisma.productVariant.findFirst({
    where: { 
      id: Number(variantId), 
      productId: Number(productId),
      ...notDeletedWhere() 
    }
  });

  if (!variant) {
    throw new Error('Product variant not found');
  }

  // Check stock availability
  if (variant.stock < quantity) {
    throw new Error('Insufficient stock available');
  }

  // Get or create cart
  let cart = await prisma.cart.findFirst({
    where: { userId: Number(userId), ...notDeletedWhere() }
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: Number(userId) }
    });
  }

  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: Number(productId),
      variantId: Number(variantId),
      ...notDeletedWhere()
    }
  });

  if (existingItem) {
    // Update quantity
    const newQuantity = existingItem.quantity + Number(quantity);
    
    if (variant.stock < newQuantity) {
      throw new Error('Insufficient stock available');
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity }
    });
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: Number(productId),
        variantId: Number(variantId),
        quantity: Number(quantity)
      }
    });
  }

  return await getCart(userId);
};

/**
 * Update cart item quantity
 * @param {number} userId - User ID
 * @param {string} itemId - Cart item ID
 * @param {number} quantity - New quantity
 * @returns {Object} Updated cart
 */
const updateCartItem = async (userId, itemId, quantity) => {
  const cartItem = await prisma.cartItem.findFirst({
    where: { 
      id: Number(itemId),
      ...notDeletedWhere()
    },
    include: {
      cart: true,
      variant: true
    }
  });

  if (!cartItem || cartItem.cart.userId !== Number(userId)) {
    throw new Error('Cart item not found');
  }

  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  // Check stock availability
  if (cartItem.variant.stock < quantity) {
    throw new Error('Insufficient stock available');
  }

  await prisma.cartItem.update({
    where: { id: Number(itemId) },
    data: { quantity: Number(quantity) }
  });

  return await getCart(userId);
};

/**
 * Remove item from cart
 * @param {number} userId - User ID
 * @param {string} itemId - Cart item ID
 * @returns {Object} Updated cart
 */
const removeFromCart = async (userId, itemId) => {
  const cartItem = await prisma.cartItem.findFirst({
    where: { 
      id: Number(itemId),
      ...notDeletedWhere()
    },
    include: {
      cart: true
    }
  });

  if (!cartItem || cartItem.cart.userId !== Number(userId)) {
    throw new Error('Cart item not found');
  }

  await prisma.cartItem.update({
    where: { id: Number(itemId) },
    data: { isDeleted: true, deletedAt: new Date() }
  });

  return await getCart(userId);
};

/**
 * Clear cart
 * @param {number} userId - User ID
 */
const clearCart = async (userId) => {
  const cart = await prisma.cart.findFirst({
    where: { userId: Number(userId), ...notDeletedWhere() }
  });

  if (!cart) {
    throw new Error('Cart not found');
  }

  await prisma.cartItem.updateMany({
    where: { cartId: cart.id },
    data: { isDeleted: true, deletedAt: new Date() }
  });
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
