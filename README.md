# Elysia with Firebase Integration

A clean, type-safe Firebase integration with Elysia and Bun runtime for building modern web APIs.

## Features

- 🔥 **Firebase Integration**: Complete Firestore, Authentication, and Storage support
- 🦊 **Elysia Framework**: Fast and type-safe web framework
- 🚀 **Bun Runtime**: Ultra-fast JavaScript runtime
- 📝 **TypeScript**: Full type safety throughout the application
- 🔐 **Authentication**: Firebase Auth with JWT middleware
- 📊 **Admin Panel**: Admin logging and management features
- 🎨 **Customizable**: Appearance settings and configuration

## Project Structure

```
src/
├── config/
│   └── firebase.ts          # Firebase configuration
├── middleware/
│   └── auth.ts              # Authentication middleware
├── routes/
│   ├── auth.ts              # Authentication routes
│   ├── firebase.ts          # Full Firebase routes (with auth)
│   └── firebase-simple.ts   # Simplified Firebase routes (demo)
├── services/
│   └── firebase.ts          # Firebase service layer
├── types/
│   └── firebase.ts          # TypeScript type definitions
├── utils/
│   ├── env.ts               # Environment utilities
│   └── response.ts          # Response utilities
└── index.ts                 # Main application entry point
```

## Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication
4. Enable Storage
5. Generate a service account key for Firebase Admin SDK

### 3. Environment Configuration
Copy the example environment file and configure your Firebase credentials:
```bash
cp .env.example .env
```

Edit `.env` with your Firebase configuration:
```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 4. Development
Start the development server:
```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

## API Endpoints

### Public Endpoints
- `GET /` - API information and available endpoints
- `GET /api/health` - Health check
- `GET /api/coaches` - Get all coaches
- `GET /api/coaches/:id` - Get specific coach
- `GET /api/prices` - Get pricing information
- `GET /api/settings/appearance` - Get appearance settings

### Reservation Endpoints
- `POST /api/reservations` - Create a reservation
- `GET /api/reservations/:id` - Get specific reservation

### Authenticated Endpoints (require Bearer token)
- `GET /api/reservations/my` - Get user's reservations
- `PATCH /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Delete reservation
- `POST /api/upload/payslip` - Upload payslip

### Admin Endpoints (require admin role)
- `GET /api/admin/reservations` - Get all reservations
- `GET /api/admin/reservations/customer/:id` - Get customer reservations
- `GET /api/admin/stats` - Get reservation statistics
- `PATCH /api/admin/reservations/:id/status` - Update reservation status
- `PATCH /api/admin/reservations/:id` - Update reservation details
- `DELETE /api/admin/reservations/:id` - Delete single reservation
- `DELETE /api/admin/reservations` - Bulk delete reservations
- `GET /api/admin/reservations/status/:status` - Get reservations by status
- `GET /api/admin/reservations/date-range` - Get reservations by date range
- `GET /api/admin/logs` - Get admin activity logs
- `POST /api/admin/logs` - Log custom admin activity
- `POST /api/coaches` - Create new coach
- `PATCH /api/coaches/:id` - Update coach
- `POST /api/prices/:date` - Set prices for date
- `PATCH /api/settings/appearance` - Update appearance settings

## Usage Examples

### Create a Reservation
```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user",
    "coachId": "coach-123",
    "date": "2024-01-15",
    "timeSlot": "10:00-11:00",
    "notes": "First lesson"
  }'
```

### Get All Coaches
```bash
curl http://localhost:3000/api/coaches
```

### Authenticated Request (with Firebase JWT)
```bash
curl -X GET http://localhost:3000/api/reservations/my \
  -H "Authorization: Bearer YOUR_FIREBASE_JWT_TOKEN"
```

## Firebase Data Structure

The application uses the following Firestore structure:
```
artifacts/{projectId}/public/data/
├── reservations/          # User reservations
├── coaches/              # Coach profiles
├── prices/               # Pricing by date
├── settings/
│   └── appearance        # UI customization
└── admin_logs/           # Admin activity logs
```

## Type Safety

All Firebase operations are fully typed with TypeScript interfaces:
- `Reservation` - Booking information
- `Coach` - Coach profiles and availability
- `Prices` - Pricing structure
- `AppearanceSettings` - UI customization
- `AdminLog` - Admin activity tracking

## Authentication

The application supports Firebase Authentication with:
- Anonymous authentication for demo purposes
- JWT token verification for protected routes
- Role-based access control (admin, coach, customer)
- Custom claims support

## Development

### Adding New Routes
1. Define types in `src/types/firebase.ts`
2. Add service methods in `src/services/firebase.ts`
3. Create routes in `src/routes/`
4. Register routes in `src/index.ts`

### Testing
```bash
bun test
```

## Production Deployment

1. Set production environment variables
2. Build the application:
```bash
bun run build
```
3. Start the production server:
```bash
bun start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request