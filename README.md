# E-commerce API Backend

A comprehensive, production-ready e-commerce API built with Node.js, Express, PostgreSQL, and Prisma ORM.

## 🚀 Features

### Core Modules
- **User Management**: Registration, authentication, profile management, addresses, wishlist
- **Product Management**: Products, categories, brands, variants, reviews
- **Order Management**: Cart to order flow, order tracking, admin order management
- **Banner Management**: Homepage banners with scheduling
- **Coupon Management**: Discount codes with various rules and validations

### Technical Features
- **JWT Authentication** with role-based access control
- **API Versioning** (v1) for future scalability
- **Comprehensive Validation** using Zod
- **File Upload** support (local/cloud ready)
- **Swagger Documentation** at `/docs`
- **Rate Limiting** and security middleware
- **Error Handling** with proper logging
- **Database Migrations** with Prisma

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (v20+) |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT + bcrypt |
| Validation | Zod |
| File Upload | Multer |
| Documentation | Swagger |
| Security | Helmet, CORS, Rate Limiting |
| Logging | Winston |

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your database and other configurations
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed database with sample data
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ecommerce_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# File Upload
UPLOAD_DIR="uploads"
MAX_FILE_SIZE=5242880
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/health`

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Default Users (after seeding):
- **Admin**: `admin@ecommerce.com` / `admin123`
- **User**: `user@ecommerce.com` / `user123`

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user profile

### Products
- `GET /api/v1/products` - Get products (with filtering)
- `GET /api/v1/products/:slug` - Get product by slug
- `POST /api/v1/products` - Create product (Admin)
- `PUT /api/v1/products/:id` - Update product (Admin)
- `DELETE /api/v1/products/:id` - Delete product (Admin)

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order details
- `GET /api/v1/orders/admin` - Get all orders (Admin)
- `PUT /api/v1/orders/:id/status` - Update order status (Admin)

### Coupons
- `GET /api/v1/coupons/validate/:code` - Validate coupon
- `GET /api/v1/coupons` - Get all coupons (Admin)
- `POST /api/v1/coupons` - Create coupon (Admin)

## 🗄️ Database Schema

The API includes the following main entities:
- **Users** (with roles and addresses)
- **Products** (with categories, brands, variants, images)
- **Orders** (with items and order tracking)
- **Coupons** (with usage tracking)
- **Banners** (for marketing)
- **Reviews** (product reviews)
- **Cart & Wishlist** (user preferences)

## 🚀 Deployment

1. **Set up PostgreSQL database**
2. **Configure environment variables**
3. **Run database migrations**
   ```bash
   npm run db:migrate
   ```
4. **Seed the database**
   ```bash
   npm run db:seed
   ```
5. **Start the production server**
   ```bash
   npm start
   ```

## 🔒 Security Features

- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** (100 requests per 15 minutes)
- **JWT token** authentication
- **Password hashing** with bcrypt
- **Input validation** with Zod
- **SQL injection** protection via Prisma

## 📊 Logging

The API uses Winston for logging:
- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console output**: Development mode only

## 🧪 Testing

```bash
npm test
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

For support or questions, please contact:
- Email: support@ecommerce.com
- Documentation: http://localhost:3000/docs# shoping-ecommerce-backend
