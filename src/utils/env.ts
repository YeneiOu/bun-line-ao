// Environment configuration with validation
export const env = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // LINE Bot Configuration
  channelId: process.env.LINE_CHANNEL_ID!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
  redirectUri: process.env.LINE_REDIRECT_URI!,
  
  // Frontend Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // JWT Configuration
  jwtPrivateKey: process.env.JWT_PRIVATE_KEY!,
  jwtPublicKey: process.env.JWT_PUBLIC_KEY!,
  
  // Firebase Configuration
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
    serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '',
  },
  
  // API Configuration
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Security
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
}

// Validation function
export function validateEnv() {
  const required = [
    'LINE_CHANNEL_ID',
    'LINE_CHANNEL_SECRET', 
    'LINE_REDIRECT_URI',
    'JWT_PRIVATE_KEY',
    'JWT_PUBLIC_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment validation passed');
}

// Firebase validation
export function validateFirebaseEnv() {
  const firebaseRequired = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];
  
  const missing = firebaseRequired.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing Firebase environment variables: ${missing.join(', ')}`);
    console.warn('Firebase features may not work properly');
    return false;
  }
  
  console.log('✅ Firebase environment validation passed');
  return true;
}
