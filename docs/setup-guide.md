# Ski Academy API Setup Guide

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository>
   cd bun-line-ao
   bun install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   bun run dev
   ```

4. **Access Documentation**
   - API Info: `http://localhost:3000`
   - Swagger Docs: `http://localhost:3000/swagger`
   - Health Check: `http://localhost:3000/api/health`

## Environment Configuration

### Required Variables

#### LINE Bot Configuration
Get from [LINE Developers Console](https://developers.line.biz/):
```env
LINE_CHANNEL_ID="your_channel_id"
LINE_CHANNEL_SECRET="your_channel_secret"  
LINE_REDIRECT_URI="http://localhost:3000/callback"
```

#### JWT Keys
Generate RSA key pair:
```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Generate public key
openssl rsa -in private.pem -pubout -out public.pem

# Base64 encode for environment variables
base64 -i private.pem > private_b64.txt
base64 -i public.pem > public_b64.txt
```

Then add to `.env`:
```env
JWT_PRIVATE_KEY="contents_of_private_b64.txt"
JWT_PUBLIC_KEY="contents_of_public_b64.txt"
```

#### Firebase Configuration
Get from [Firebase Console](https://console.firebase.google.com/) > Project Settings > General:
```env
FIREBASE_API_KEY="your_api_key"
FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
FIREBASE_APP_ID="your_app_id"
FIREBASE_MEASUREMENT_ID="your_measurement_id"
```

#### Firebase Admin SDK (Optional - for admin features)
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Add to `.env` as string:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
```

### Optional Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"

# API Configuration  
API_PREFIX="/api"
CORS_ORIGIN="*"

# Security
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Logging
LOG_LEVEL="info"
LOG_FORMAT="json"
```

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard

### 2. Enable Firestore
1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location

### 3. Enable Authentication (Optional)
1. Go to Authentication > Sign-in method
2. Enable desired providers (Email/Password, Google, etc.)

### 4. Enable Storage (Optional)
1. Go to Storage
2. Click "Get started"
3. Set up security rules

### 5. Get Configuration
1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Add a web app or use existing config
4. Copy the config values to your `.env` file

## Database Structure

The API uses this Firestore structure:
```
artifacts/{projectId}/public/data/
├── reservations/
│   ├── {reservationId}
│   │   ├── userId: string
│   │   ├── coachId: string
│   │   ├── date: string
│   │   ├── timeSlot: string
│   │   ├── status: "pending" | "confirmed" | "cancelled"
│   │   ├── paymentStatus: "pending" | "paid" | "refunded"
│   │   ├── price: number
│   │   ├── currency: string
│   │   ├── notes: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
├── coaches/
│   ├── {coachId}
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── specialties: string[]
│   │   ├── bio: string
│   │   ├── isActive: boolean
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
├── prices/
│   ├── {date}
│   │   └── {timeSlot}
│   │       ├── price: number
│   │       ├── currency: string
│   │       └── coachId?: string
├── settings/
│   ├── appearance
│   │   ├── primaryColor: string
│   │   ├── secondaryColor: string
│   │   ├── logo: string
│   │   ├── companyName: string
│   │   ├── storagePath: string
│   │   └── theme: "light" | "dark" | "auto"
└── admin_logs/
    ├── {logId}
    │   ├── adminUser: string
    │   ├── action: string
    │   ├── details: string
    │   └── timestamp: timestamp
```

## Development Workflow

### 1. Start Development Server
```bash
bun run dev
```

### 2. Test API Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Get coaches
curl http://localhost:3000/api/coaches

# Get admin stats (requires auth)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/admin/stats
```

### 3. View API Documentation
Open `http://localhost:3000/swagger` in your browser

### 4. Test with Frontend
Point your frontend application to `http://localhost:3000`

## Production Deployment

### 1. Environment Variables
Set all required environment variables in your production environment:
- Railway: Project Settings > Variables
- Vercel: Project Settings > Environment Variables  
- Netlify: Site Settings > Environment Variables

### 2. Build and Deploy
```bash
# Build for production
bun run build

# Start production server
bun start
```

### 3. Update URLs
Update these URLs for production:
- `LINE_REDIRECT_URI`: Your production callback URL
- `FRONTEND_URL`: Your frontend production URL
- `CORS_ORIGIN`: Your frontend domain (for security)

### 4. Firebase Security Rules
Update Firestore security rules for production:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{projectId}/public/data/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Environment Validation Failed
```
❌ Environment validation failed: Missing required environment variables: JWT_PRIVATE_KEY
```
**Solution**: Ensure all required environment variables are set in `.env`

#### 2. Firebase Admin SDK Not Configured
```
⚠️ Firebase Admin SDK not initialized: FIREBASE_SERVICE_ACCOUNT_KEY not provided
```
**Solution**: Add Firebase service account key to `FIREBASE_SERVICE_ACCOUNT_KEY`

#### 3. CORS Issues
```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Solution**: Update `CORS_ORIGIN` in `.env` or use CORS middleware

#### 4. JWT Token Issues
```
{"code":401,"message":"Unauthorized","data":"Invalid token"}
```
**Solution**: 
- Check JWT keys are correctly base64 encoded
- Ensure token is included in Authorization header
- Verify token hasn't expired

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL="debug"
NODE_ENV="development"
```

### Health Checks

Monitor these endpoints:
- `GET /` - API information
- `GET /api/health` - Service health
- `GET /swagger` - Documentation availability

## API Testing

### Using curl
```bash
# Create reservation
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "coachId": "coach-123",
    "date": "2024-01-15", 
    "timeSlot": "10:00-11:00",
    "notes": "First lesson"
  }'

# Get admin statistics  
curl -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
     http://localhost:3000/api/admin/stats
```

### Using Postman
1. Import the OpenAPI spec from `/swagger/json`
2. Set up environment variables for base URL and tokens
3. Test all endpoints with proper authentication

## Support

- **Documentation**: `/swagger` endpoint
- **Health Check**: `/api/health` endpoint  
- **API Info**: `/` endpoint
- **GitHub Issues**: Create issues for bugs and feature requests

## License

MIT License - see LICENSE file for details.
