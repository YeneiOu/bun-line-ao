# Ski Academy API Documentation

## Overview

The Ski Academy API is a comprehensive REST API for managing ski academy operations including reservations, coaches, pricing, and administrative functions. Built with Bun, Elysia, and Firebase.

## Base URLs

- **Development**: `http://localhost:3000`
- **Production**: `https://bun-line-ao-production.up.railway.app`
- **Swagger Documentation**: `/swagger`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Roles

- **Customer**: Can manage their own reservations
- **Coach**: Can view and manage assigned reservations  
- **Admin**: Full access to all endpoints and admin dashboard

## Response Format

All endpoints return responses in this format:

### Success Response
```json
{
  "code": 0,
  "message": "Success message",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "code": 500,
  "message": "Error message", 
  "data": "Error details"
}
```

## Endpoints

### Health & Information

#### GET `/`
Get API information and available endpoints.

**Response:**
```json
{
  "code": 0,
  "message": "Ski Academy API",
  "data": {
    "msg": "Welcome to Ski Academy Management System API",
    "version": "1.0.0",
    "documentation": "/swagger",
    "endpoints": { /* endpoint list */ },
    "features": [ /* feature list */ ]
  }
}
```

#### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "code": 0,
  "message": "Firebase service is healthy",
  "data": null
}
```

### Reservations

#### POST `/api/reservations`
Create a new reservation.

**Authentication:** Required  
**Body:**
```json
{
  "coachId": "coach-123",
  "date": "2024-01-15",
  "timeSlot": "10:00-11:00",
  "notes": "First skiing lesson"
}
```

**Response:**
```json
{
  "code": 0,
  "message": "Reservation created successfully",
  "data": {
    "id": "reservation-456"
  }
}
```

#### GET `/api/reservations/my`
Get current user's reservations.

**Authentication:** Required

**Response:**
```json
{
  "code": 0,
  "message": "Reservations retrieved successfully",
  "data": [
    {
      "id": "reservation-123",
      "userId": "user-456",
      "coachId": "coach-789",
      "date": "2024-01-15",
      "timeSlot": "10:00-11:00",
      "status": "confirmed",
      "paymentStatus": "paid",
      "price": 150,
      "currency": "USD",
      "notes": "First lesson",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "updatedAt": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

#### GET `/api/reservations/:id`
Get specific reservation details.

**Authentication:** Required  
**Parameters:**
- `id` (string): Reservation ID

#### PATCH `/api/reservations/:id`
Update reservation details.

**Authentication:** Required  
**Parameters:**
- `id` (string): Reservation ID

**Body:**
```json
{
  "status": "confirmed",
  "paymentStatus": "paid",
  "notes": "Updated notes"
}
```

#### DELETE `/api/reservations/:id`
Delete a reservation.

**Authentication:** Required  
**Parameters:**
- `id` (string): Reservation ID

### Coaches

#### GET `/api/coaches`
Get all active coaches.

**Response:**
```json
{
  "code": 0,
  "message": "Coaches retrieved successfully",
  "data": [
    {
      "id": "coach-123",
      "name": "John Smith",
      "email": "john.smith@skiacademy.com",
      "phone": "+1-555-123-4567",
      "specialties": ["Beginner Lessons", "Advanced Techniques"],
      "bio": "Experienced ski instructor with 10+ years...",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET `/api/coaches/:id`
Get specific coach details.

**Parameters:**
- `id` (string): Coach ID

#### POST `/api/coaches`
Create a new coach.

**Authentication:** Admin required  
**Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@skiacademy.com",
  "phone": "+1-555-987-6543",
  "specialties": ["Snowboarding", "Freestyle"],
  "bio": "Professional snowboard instructor..."
}
```

#### PATCH `/api/coaches/:id`
Update coach information.

**Authentication:** Admin required  
**Parameters:**
- `id` (string): Coach ID

**Body:**
```json
{
  "name": "Updated Name",
  "specialties": ["Updated Specialties"],
  "isActive": false
}
```

### Pricing

#### GET `/api/prices`
Get pricing information.

**Query Parameters:**
- `date` (optional): Specific date (YYYY-MM-DD)

**Response:**
```json
{
  "code": 0,
  "message": "Prices retrieved successfully",
  "data": {
    "10:00-11:00": {
      "price": 150,
      "currency": "USD",
      "coachId": "coach-123"
    },
    "11:00-12:00": {
      "price": 150,
      "currency": "USD"
    }
  }
}
```

#### POST `/api/prices/:date`
Set prices for a specific date.

**Authentication:** Admin required  
**Parameters:**
- `date` (string): Date in YYYY-MM-DD format

**Body:**
```json
{
  "10:00-11:00": {
    "price": 150,
    "currency": "USD",
    "coachId": "coach-123"
  },
  "11:00-12:00": {
    "price": 175,
    "currency": "USD"
  }
}
```

### Settings

#### GET `/api/settings/appearance`
Get appearance settings.

**Response:**
```json
{
  "code": 0,
  "message": "Appearance settings retrieved successfully",
  "data": {
    "primaryColor": "#007bff",
    "secondaryColor": "#6c757d",
    "logo": "https://example.com/logo.png",
    "companyName": "Ski Academy",
    "storagePath": "ski-academy-uploads",
    "theme": "light"
  }
}
```

#### PATCH `/api/settings/appearance`
Update appearance settings.

**Authentication:** Admin required  
**Body:**
```json
{
  "primaryColor": "#28a745",
  "companyName": "Updated Ski Academy",
  "theme": "dark"
}
```

### File Upload

#### POST `/api/upload/payslip`
Upload a payslip file.

**Authentication:** Required  
**Body:** Form data with file
- `file`: File to upload

**Response:**
```json
{
  "code": 0,
  "message": "Payslip uploaded successfully",
  "data": {
    "url": "https://storage.googleapis.com/payslip-123.jpg"
  }
}
```

### Admin Dashboard

#### GET `/api/admin/reservations`
Get all reservations (admin view).

**Authentication:** Admin required

#### GET `/api/admin/reservations/customer/:customerId`
Get reservations for a specific customer.

**Authentication:** Admin required  
**Parameters:**
- `customerId` (string): Customer user ID

#### GET `/api/admin/stats`
Get reservation statistics.

**Authentication:** Admin required

**Response:**
```json
{
  "code": 0,
  "message": "Statistics retrieved successfully",
  "data": {
    "total": 150,
    "confirmed": 120,
    "pending": 25,
    "cancelled": 5,
    "totalRevenue": 18000
  }
}
```

#### PATCH `/api/admin/reservations/:id/status`
Update reservation status.

**Authentication:** Admin required  
**Parameters:**
- `id` (string): Reservation ID

**Body:**
```json
{
  "status": "confirmed"
}
```

#### PATCH `/api/admin/reservations/:id`
Update reservation with custom data.

**Authentication:** Admin required  
**Parameters:**
- `id` (string): Reservation ID

**Body:**
```json
{
  "status": "confirmed",
  "paymentStatus": "paid",
  "notes": "Updated by admin",
  "date": "2024-01-16",
  "timeSlot": "11:00-12:00",
  "coachId": "coach-456"
}
```

#### DELETE `/api/admin/reservations/:id`
Delete a single reservation.

**Authentication:** Admin required  
**Parameters:**
- `id` (string): Reservation ID

#### DELETE `/api/admin/reservations`
Bulk delete reservations.

**Authentication:** Admin required  
**Body:**
```json
{
  "reservationIds": ["reservation-123", "reservation-456", "reservation-789"]
}
```

#### GET `/api/admin/reservations/status/:status`
Get reservations by status.

**Authentication:** Admin required  
**Parameters:**
- `status` (string): Status filter (pending, confirmed, cancelled)

#### GET `/api/admin/reservations/date-range`
Get reservations by date range.

**Authentication:** Admin required  
**Query Parameters:**
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

#### GET `/api/admin/logs`
Get admin activity logs.

**Authentication:** Admin required  
**Query Parameters:**
- `limit` (optional): Number of logs to retrieve (default: 50)

**Response:**
```json
{
  "code": 0,
  "message": "Admin logs retrieved successfully",
  "data": [
    {
      "id": "log-123",
      "adminUser": "admin@skiacademy.com",
      "action": "reservation_confirmed",
      "details": "Reservation 123 was confirmed",
      "timestamp": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

#### POST `/api/admin/logs`
Log custom admin activity.

**Authentication:** Admin required  
**Body:**
```json
{
  "action": "manual_review",
  "details": "Reviewed and approved reservation for VIP customer"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 0    | Success |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 500  | Internal Server Error |
| 503  | Service Unavailable |

## Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers

## Environment Variables

See `.env` file for complete configuration options:

### Required Variables
- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `LINE_REDIRECT_URI`
- `JWT_PRIVATE_KEY`
- `JWT_PUBLIC_KEY`

### Firebase Variables
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT_KEY` (for admin features)

### Optional Variables
- `PORT` (default: 3000)
- `NODE_ENV` (default: development)
- `FRONTEND_URL`
- `API_PREFIX` (default: /api)
- `CORS_ORIGIN` (default: *)
- `RATE_LIMIT_MAX` (default: 100)
- `RATE_LIMIT_WINDOW` (default: 900000)

## Getting Started

1. **Clone and install dependencies:**
   ```bash
   git clone <repository>
   cd bun-line-ao
   bun install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   bun run dev
   ```

4. **Access API documentation:**
   Open `http://localhost:3000/swagger` in your browser

## Support

For support and questions:
- **Documentation**: `/swagger` endpoint
- **Health Check**: `/api/health` endpoint
- **API Information**: `/` endpoint

## License

MIT License - see LICENSE file for details.
