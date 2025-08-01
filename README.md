# 🛍️ E-commerce Backend API

A complete, production-ready e-commerce backend API built with Node.js, Express, Prisma ORM, and PostgreSQL. This API provides all the functionality needed for a modern e-commerce platform.

## 🚀 Features

### Core E-commerce Features
- **Product Management**: CRUD operations, categories, brands, variants, images
- **User Management**: Authentication, authorization, profiles, addresses
- **Shopping Cart**: Add, update, remove items, cart summary
- **Wishlist**: Add/remove products, move to cart
- **Order Management**: Create orders, track status, order history
- **Reviews & Ratings**: Product reviews with moderation
- **Coupons & Discounts**: Percentage and fixed discounts
- **Search & Filtering**: Advanced product search with multiple filters

### Additional Features
- **Blog System**: Blog posts with comments and moderation
- **Notifications**: Real-time notifications for users
- **Contact Forms**: Customer support system
- **Banners**: Promotional banners management
- **File Upload**: Image upload for products and banners
- **Email Integration**: Password reset, order confirmations
- **API Documentation**: Swagger/OpenAPI documentation

### Security & Performance
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: User, Admin, Vendor roles
- **Input Validation**: Zod schema validation
- **Rate Limiting**: API rate limiting
- **Error Handling**: Comprehensive error handling
- **Logging**: Winston logging system
- **CORS**: Cross-origin resource sharing

## 🛠️ Tech Stack

- **Runtime**: Node.js (v22)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Zod
- **File Upload**: Multer
- **Email**: Nodemailer
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston

## 📋 Prerequisites

- Node.js (v22 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shoping-ecommerce-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000
   API_VERSION=v1

   # Database Configuration
   DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d

   # Email Configuration (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=noreply@yourdomain.com

   # Frontend URL
   FRONTEND_URL=http://localhost:3000

   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Admin Configuration
   ADMIN_EMAIL=admin@yourdomain.com
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database with sample data
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

Once the server is running, you can access the API documentation at:
- **Swagger UI**: `http://localhost:5000/docs`
- **Health Check**: `http://localhost:5000/health`

## 🗂️ API Structure

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 📖 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/forgot-password` - Forgot password
- `POST /auth/reset-password` - Reset password
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password
- `POST /auth/logout` - Logout

### Products
- `GET /products` - Get all products with filtering
- `GET /products/featured` - Get featured products
- `GET /products/new` - Get new products
- `GET /products/trending` - Get trending products
- `GET /products/recommendations` - Get product recommendations
- `GET /products/search` - Search products
- `GET /products/:slug` - Get product by slug
- `POST /products` - Create product (Admin)
- `PUT /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)

### Categories
- `GET /products/categories` - Get all categories
- `GET /products/categories/:slug` - Get category by slug
- `GET /products/categories/:slug/products` - Get products by category
- `POST /products/categories` - Create category (Admin)
- `PUT /products/categories/:id` - Update category (Admin)
- `DELETE /products/categories/:id` - Delete category (Admin)

### Brands
- `GET /products/brands` - Get all brands
- `GET /products/brands/:slug` - Get brand by slug
- `GET /products/brands/:slug/products` - Get products by brand
- `POST /products/brands` - Create brand (Admin)
- `PUT /products/brands/:id` - Update brand (Admin)
- `DELETE /products/brands/:id` - Delete brand (Admin)

### Reviews
- `GET /products/:productId/reviews` - Get product reviews
- `POST /products/:productId/reviews` - Create review
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review
- `PATCH /reviews/:id/approve` - Approve review (Admin)

### Cart
- `GET /cart` - Get user's cart
- `GET /cart/summary` - Get cart summary
- `POST /cart/add` - Add item to cart
- `PUT /cart/:id` - Update cart item
- `DELETE /cart/:id` - Remove item from cart
- `DELETE /cart` - Clear cart

### Wishlist
- `GET /wishlist` - Get user's wishlist
- `POST /wishlist/add` - Add to wishlist
- `DELETE /wishlist/:productId` - Remove from wishlist
- `GET /wishlist/check/:productId` - Check if in wishlist
- `DELETE /wishlist` - Clear wishlist
- `POST /wishlist/:productId/move-to-cart` - Move to cart

### Orders
- `POST /orders` - Create order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get order by ID
- `GET /orders/admin` - Get all orders (Admin)
- `PUT /orders/:id/status` - Update order status (Admin)

### Addresses
- `GET /addresses` - Get user addresses
- `GET /addresses/:id` - Get address by ID
- `POST /addresses` - Create address
- `PUT /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address
- `PATCH /addresses/:id/default` - Set default address

### Users
- `PUT /users/profile` - Update user profile
- `GET /users/addresses` - Get user addresses
- `POST /users/addresses` - Add address
- `GET /users/wishlist` - Get user wishlist
- `POST /users/wishlist/:productId` - Add to wishlist
- `DELETE /users/wishlist/:productId` - Remove from wishlist

### Blog
- `GET /blog` - Get all blog posts
- `GET /blog/:slug` - Get blog post by slug
- `GET /blog/:postId/comments` - Get blog comments
- `POST /blog/:postId/comments` - Add comment
- `POST /blog` - Create blog post (Admin)
- `PUT /blog/:id` - Update blog post (Admin)
- `DELETE /blog/:id` - Delete blog post (Admin)
- `PATCH /blog/comments/:id/moderate` - Moderate comment (Admin)

### Notifications
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread count
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/:id` - Delete notification
- `DELETE /notifications` - Clear notifications
- `POST /notifications` - Create notification (Admin)
- `POST /notifications/bulk` - Create bulk notifications (Admin)

### Contact
- `POST /contact/submit` - Submit contact form
- `GET /contact` - Get all contacts (Admin)
- `GET /contact/stats` - Get contact stats (Admin)
- `GET /contact/:id` - Get contact by ID (Admin)
- `PATCH /contact/:id/read` - Mark as read (Admin)
- `PATCH /contact/mark-all-read` - Mark all as read (Admin)
- `DELETE /contact/:id` - Delete contact (Admin)

### Banners
- `GET /banners` - Get active banners
- `POST /banners` - Create banner (Admin)
- `PUT /banners/:id` - Update banner (Admin)
- `DELETE /banners/:id` - Delete banner (Admin)

### Coupons
- `GET /coupons/validate/:code` - Validate coupon
- `GET /coupons` - Get all coupons (Admin)
- `POST /coupons` - Create coupon (Admin)
- `PUT /coupons/:id` - Update coupon (Admin)
- `DELETE /coupons/:id` - Delete coupon (Admin)

## 🗄️ Database Schema

The application uses Prisma ORM with PostgreSQL. Key models include:

- **User**: Authentication, profiles, roles
- **Product**: Products with categories, brands, variants
- **Category**: Product categories
- **Brand**: Product brands
- **Review**: Product reviews and ratings
- **Cart**: Shopping cart items
- **Wishlist**: User wishlist items
- **Order**: Customer orders with items
- **Address**: User addresses
- **BlogPost**: Blog posts with comments
- **Notification**: User notifications
- **Contact**: Contact form submissions
- **Banner**: Promotional banners
- **Coupon**: Discount coupons

## 🔧 Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run db:generate # Generate Prisma client
npm run db:push    # Push schema to database
npm run db:migrate # Run database migrations
npm run db:studio  # Open Prisma Studio
npm run db:seed    # Seed database with sample data
```

### Project Structure
```
src/
├── app.js                 # Express app configuration
├── config/               # Configuration files
│   ├── database.js       # Database configuration
│   ├── logger.js         # Winston logger
│   └── swagger.js        # Swagger documentation
├── constants/            # Application constants
├── middlewares/          # Express middlewares
│   ├── auth.js          # Authentication middleware
│   ├── admin.js         # Admin authorization
│   ├── errorHandler.js  # Error handling
│   ├── notFound.js      # 404 handler
│   └── upload.js        # File upload
├── utils/               # Utility functions
│   ├── auth.js          # Authentication utilities
│   ├── email.js         # Email utilities
│   ├── jwt.js           # JWT utilities
│   ├── orderNumber.js   # Order number generation
│   └── slugify.js       # Slug generation
├── validations/         # Zod validation schemas
└── v1/                  # API version 1
    ├── index.js         # Main router
    └── modules/         # Feature modules
        ├── auth/        # Authentication
        ├── product/     # Products, categories, brands
        ├── cart/        # Shopping cart
        ├── wishlist/    # Wishlist
        ├── order/       # Orders
        ├── user/        # User management
        ├── blog/        # Blog system
        ├── notification/# Notifications
        ├── contact/     # Contact forms
        ├── address/     # Address management
        ├── banner/      # Banners
        └── coupon/      # Coupons
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: User, Admin, Vendor roles
- **Input Validation**: Comprehensive validation with Zod
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Password Hashing**: bcrypt for password security

## 📊 Sample Data

The database comes pre-seeded with:
- Admin user (admin@example.com / admin123)
- Regular user (user@example.com / user123)
- Sample categories (Kurtis, Dresses, Ethnic Wear, etc.)
- Sample brands (Ethnic Elegance, Modern Chic)
- Sample products with images and variants
- Sample blog posts and comments
- Sample coupons and banners

## 🚀 Deployment

### Environment Variables
Make sure to set all required environment variables in production:
- Database connection string
- JWT secrets
- Email configuration
- File upload settings
- Rate limiting configuration

### Database Migration
```bash
npm run db:migrate
```

### Production Build
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the health check at `/health`

## 🔄 API Versioning

The API uses versioning in the URL path (`/api/v1/`). Future versions will be available at `/api/v2/`, etc.

## 📈 Performance

- Database queries are optimized with Prisma
- Pagination implemented for large datasets
- Image optimization for product images
- Caching strategies for frequently accessed data

## 🔍 Monitoring

- Winston logging for application logs
- Error tracking and monitoring
- Health check endpoint
- Database connection monitoring
