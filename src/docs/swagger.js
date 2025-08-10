/**
 * Swagger Configuration
 * Complete API documentation for E-commerce Backend
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce API',
      version: '1.0.0',
      description: 'Complete REST API for E-commerce platform with admin and user endpoints',
      contact: {
        name: 'API Support',
        email: 'support@ecommerce.com'
      }
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.ecommerce.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // Common Response Schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error occurred'
            },
            error: {
              type: 'object'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1
            },
            limit: {
              type: 'integer',
              example: 20
            },
            total: {
              type: 'integer',
              example: 100
            },
            totalPages: {
              type: 'integer',
              example: 5
            }
          }
        },
        
        // User Schema
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              example: '+1234567890'
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              example: 'USER'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Category Schema
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'Electronics'
            },
            slug: {
              type: 'string',
              example: 'electronics'
            },
            description: {
              type: 'string',
              example: 'Electronic items and gadgets'
            },
            image: {
              type: 'string',
              example: 'https://example.com/category.jpg'
            },
            parentId: {
              type: 'integer',
              nullable: true,
              example: null
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Product Schema
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'iPhone 14'
            },
            sku: {
              type: 'string',
              example: 'IPH14-001'
            },
            slug: {
              type: 'string',
              example: 'iphone-14'
            },
            description: {
              type: 'string',
              example: 'Latest iPhone with advanced features'
            },
            price: {
              type: 'number',
              format: 'float',
              example: 999.99
            },
            discountedPrice: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 899.99
            },
            stock: {
              type: 'integer',
              example: 50
            },
            categoryId: {
              type: 'integer',
              example: 1
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
            },
            tags: {
              type: 'object',
              example: { color: 'black', brand: 'Apple' }
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Variant Schema
        Variant: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            productId: {
              type: 'integer',
              example: 1
            },
            name: {
              type: 'string',
              example: 'iPhone 14 - 128GB Black'
            },
            sku: {
              type: 'string',
              example: 'IPH14-128-BLK'
            },
            price: {
              type: 'number',
              format: 'float',
              example: 999.99
            },
            stock: {
              type: 'integer',
              example: 25
            },
            attributes: {
              type: 'object',
              example: { storage: '128GB', color: 'Black' }
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            isActive: {
              type: 'boolean',
              example: true
            }
          }
        },

        // Order Schema
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            userId: {
              type: 'integer',
              example: 1
            },
            orderNumber: {
              type: 'string',
              example: 'ORD-2024-001'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
              example: 'PENDING'
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              example: 1299.98
            },
            shippingAddress: {
              type: 'object'
            },
            billingAddress: {
              type: 'object'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Order Item Schema
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            orderId: {
              type: 'integer',
              example: 1
            },
            productId: {
              type: 'integer',
              example: 1
            },
            variantId: {
              type: 'integer',
              nullable: true,
              example: 1
            },
            quantity: {
              type: 'integer',
              example: 2
            },
            price: {
              type: 'number',
              format: 'float',
              example: 999.99
            },
            totalPrice: {
              type: 'number',
              format: 'float',
              example: 1999.98
            }
          }
        },

        // Cart Schema
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            userId: {
              type: 'integer',
              example: 1
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem'
              }
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              example: 1999.98
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Cart Item Schema
        CartItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            cartId: {
              type: 'integer',
              example: 1
            },
            productId: {
              type: 'integer',
              example: 1
            },
            variantId: {
              type: 'integer',
              nullable: true,
              example: 1
            },
            quantity: {
              type: 'integer',
              example: 2
            },
            price: {
              type: 'number',
              format: 'float',
              example: 999.99
            }
          }
        },

        // Address Schema
        Address: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            userId: {
              type: 'integer',
              example: 1
            },
            type: {
              type: 'string',
              enum: ['HOME', 'WORK', 'OTHER'],
              example: 'HOME'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            phone: {
              type: 'string',
              example: '+1234567890'
            },
            addressLine1: {
              type: 'string',
              example: '123 Main St'
            },
            addressLine2: {
              type: 'string',
              nullable: true,
              example: 'Apt 4B'
            },
            city: {
              type: 'string',
              example: 'New York'
            },
            state: {
              type: 'string',
              example: 'NY'
            },
            postalCode: {
              type: 'string',
              example: '10001'
            },
            country: {
              type: 'string',
              example: 'USA'
            },
            isDefault: {
              type: 'boolean',
              example: false
            }
          }
        },

        // Wishlist Schema
        Wishlist: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            userId: {
              type: 'integer',
              example: 1
            },
            productId: {
              type: 'integer',
              example: 1
            },
            product: {
              $ref: '#/components/schemas/Product'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Discount Schema
        Discount: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            code: {
              type: 'string',
              example: 'SAVE20'
            },
            name: {
              type: 'string',
              example: '20% Off Summer Sale'
            },
            description: {
              type: 'string',
              example: 'Get 20% off on all summer items'
            },
            type: {
              type: 'string',
              enum: ['PERCENTAGE', 'FIXED'],
              example: 'PERCENTAGE'
            },
            value: {
              type: 'number',
              format: 'float',
              example: 20
            },
            minOrderAmount: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 100
            },
            maxDiscountAmount: {
              type: 'number',
              format: 'float',
              nullable: true,
              example: 50
            },
            usageLimit: {
              type: 'integer',
              nullable: true,
              example: 100
            },
            usedCount: {
              type: 'integer',
              example: 25
            },
            startDate: {
              type: 'string',
              format: 'date-time'
            },
            endDate: {
              type: 'string',
              format: 'date-time'
            },
            isActive: {
              type: 'boolean',
              example: true
            }
          }
        },

        // Rating Schema
        Rating: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            userId: {
              type: 'integer',
              example: 1
            },
            productId: {
              type: 'integer',
              example: 1
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              example: 5
            },
            review: {
              type: 'string',
              nullable: true,
              example: 'Excellent product! Highly recommended.'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            isVerifiedPurchase: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Blog Schema
        Blog: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            title: {
              type: 'string',
              example: 'Latest Fashion Trends 2024'
            },
            slug: {
              type: 'string',
              example: 'latest-fashion-trends-2024'
            },
            content: {
              type: 'string',
              example: 'Discover the hottest fashion trends for 2024...'
            },
            excerpt: {
              type: 'string',
              example: 'A brief overview of the latest fashion trends'
            },
            featuredImage: {
              type: 'string',
              example: 'https://example.com/blog-image.jpg'
            },
            authorId: {
              type: 'integer',
              example: 1
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
              example: 'PUBLISHED'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['fashion', 'trends', '2024']
            },
            publishedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Feed Schema
        Feed: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            title: {
              type: 'string',
              example: 'New Product Launch'
            },
            content: {
              type: 'string',
              example: 'We are excited to announce our new product line...'
            },
            image: {
              type: 'string',
              example: 'https://example.com/feed-image.jpg'
            },
            type: {
              type: 'string',
              enum: ['ANNOUNCEMENT', 'PROMOTION', 'NEWS'],
              example: 'ANNOUNCEMENT'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },

        // Instagram Schema
        Instagram: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            postId: {
              type: 'string',
              example: 'instagram_post_123'
            },
            imageUrl: {
              type: 'string',
              example: 'https://instagram.com/image.jpg'
            },
            caption: {
              type: 'string',
              example: 'Check out our latest collection! #fashion #style'
            },
            permalink: {
              type: 'string',
              example: 'https://instagram.com/p/abc123'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints for platform management'
      },
      {
        name: 'User',
        description: 'User-accessible endpoints'
      },
      {
        name: 'Categories',
        description: 'Product category management'
      },
      {
        name: 'Products',
        description: 'Product catalog management'
      },
      {
        name: 'Variants',
        description: 'Product variant management'
      },
      {
        name: 'Orders',
        description: 'Order management and processing'
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations'
      },
      {
        name: 'Wishlist',
        description: 'User wishlist management'
      },
      {
        name: 'Addresses',
        description: 'User address management'
      },
      {
        name: 'Discounts',
        description: 'Discount codes and promotions'
      },
      {
        name: 'Ratings',
        description: 'Product ratings and reviews'
      },
      {
        name: 'Blog',
        description: 'Blog posts and content management'
      },
      {
        name: 'Feed',
        description: 'Social media feed management'
      },
      {
        name: 'Instagram',
        description: 'Instagram integration'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/modules/*/*.route.js',
    './src/docs/*.swagger.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'E-commerce API Documentation'
  })
};
