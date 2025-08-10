# E-commerce Backend API

A complete Node.js + Express + Prisma e-commerce REST API with JWT authentication, AWS S3 integration, and comprehensive admin/user functionality.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control (Admin/User)
- **Database**: PostgreSQL with Prisma ORM and soft delete functionality
- **File Upload**: AWS S3 integration for image uploads
- **API Documentation**: Swagger/OpenAPI documentation at `/docs`
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston logger with file and console outputs
- **Error Handling**: Centralized error handling with detailed logging
- **Validation**: Joi schema validation for all endpoints
- **Pagination**: Built-in pagination, filtering, and search

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- AWS S3 bucket for file storage

## 🛠️ Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration

3. **Database Setup**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

- **Swagger UI**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm test             # Run tests
```
# shoping-ecommerce-backend
