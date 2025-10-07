import { swagger } from '@elysiajs/swagger';
import { env } from '../utils/env';

export const swaggerConfig = swagger({
  documentation: {
    info: {
      title: 'Ski Academy API',
      version: '1.0.0',
      description: `
# Ski Academy Management System API

A comprehensive REST API for managing ski academy operations including reservations, coaches, pricing, and admin dashboard functionality.

## Features

- **Reservation Management**: Create, update, delete, and manage ski lesson reservations
- **Coach Management**: Manage ski instructors and their profiles
- **Pricing System**: Dynamic pricing for different time slots and coaches
- **Admin Dashboard**: Complete administrative interface with statistics and logging
- **Authentication**: JWT-based authentication with role-based access control
- **File Upload**: Support for payslip and document uploads
- **Firebase Integration**: Real-time data synchronization with Firebase

## Authentication

Most endpoints require authentication. Include your JWT token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_JWT_TOKEN
\`\`\`

## Roles

- **Customer**: Can create and manage their own reservations
- **Coach**: Can view and manage assigned reservations
- **Admin**: Full access to all endpoints and admin dashboard

## Error Handling

All endpoints return consistent error responses:

\`\`\`json
{
  "code": 500,
  "message": "Error description",
  "data": "Detailed error information"
}
\`\`\`

## Rate Limiting

API requests are limited to ${env.rateLimitMax} requests per ${Math.floor(env.rateLimitWindow / 60000)} minutes per IP address.
      `,
      contact: {
        name: 'Ski Academy Support',
        email: 'support@skiacademy.com',
        url: 'https://skiacademy.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://bun-line-ao-production.up.railway.app',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check and system status endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Reservations',
        description: 'Ski lesson reservation management'
      },
      {
        name: 'Coaches',
        description: 'Ski instructor management'
      },
      {
        name: 'Pricing',
        description: 'Dynamic pricing management'
      },
      {
        name: 'Settings',
        description: 'Application settings and configuration'
      },
      {
        name: 'Upload',
        description: 'File upload endpoints'
      },
      {
        name: 'Admin',
        description: 'Administrative dashboard and management'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from authentication endpoint'
        }
      },
      schemas: {
        // Success Response Schema
        SuccessResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              example: 0,
              description: 'Response code (0 for success)'
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
              description: 'Human-readable success message'
            },
            data: {
              description: 'Response data (varies by endpoint)'
            }
          },
          required: ['code', 'message']
        },
        
        // Error Response Schema
        ErrorResponse: {
          type: 'object',
          properties: {
            code: {
              type: 'integer',
              example: 500,
              description: 'HTTP status code'
            },
            message: {
              type: 'string',
              example: 'Internal Server Error',
              description: 'Error message'
            },
            data: {
              type: 'string',
              example: 'Detailed error information',
              description: 'Additional error details'
            }
          },
          required: ['code', 'message']
        },

        // Reservation Schema
        Reservation: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'reservation-123',
              description: 'Unique reservation identifier'
            },
            userId: {
              type: 'string',
              example: 'user-456',
              description: 'Customer user ID'
            },
            coachId: {
              type: 'string',
              example: 'coach-789',
              description: 'Assigned coach ID'
            },
            date: {
              type: 'string',
              format: 'date',
              example: '2024-01-15',
              description: 'Lesson date (YYYY-MM-DD)'
            },
            timeSlot: {
              type: 'string',
              example: '10:00-11:00',
              description: 'Time slot for the lesson'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'cancelled'],
              example: 'confirmed',
              description: 'Reservation status'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'refunded'],
              example: 'paid',
              description: 'Payment status'
            },
            price: {
              type: 'number',
              example: 150,
              description: 'Lesson price'
            },
            currency: {
              type: 'string',
              example: 'USD',
              description: 'Price currency'
            },
            payslipUrl: {
              type: 'string',
              example: 'https://storage.googleapis.com/payslip-123.jpg',
              description: 'URL to uploaded payslip'
            },
            notes: {
              type: 'string',
              example: 'First skiing lesson',
              description: 'Additional notes'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-10T08:00:00.000Z',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-10T08:00:00.000Z',
              description: 'Last update timestamp'
            }
          }
        },

        // Coach Schema
        Coach: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'coach-123',
              description: 'Unique coach identifier'
            },
            name: {
              type: 'string',
              example: 'John Smith',
              description: 'Coach full name'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.smith@skiacademy.com',
              description: 'Coach email address'
            },
            phone: {
              type: 'string',
              example: '+1-555-123-4567',
              description: 'Coach phone number'
            },
            specialties: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['Beginner Lessons', 'Advanced Techniques'],
              description: 'Coach specialties'
            },
            bio: {
              type: 'string',
              example: 'Experienced ski instructor with 10+ years...',
              description: 'Coach biography'
            },
            isActive: {
              type: 'boolean',
              example: true,
              description: 'Whether coach is currently active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },

        // Pricing Schema
        PriceEntry: {
          type: 'object',
          properties: {
            price: {
              type: 'number',
              example: 150,
              description: 'Price amount'
            },
            currency: {
              type: 'string',
              example: 'USD',
              description: 'Price currency'
            },
            coachId: {
              type: 'string',
              example: 'coach-123',
              description: 'Optional specific coach ID'
            }
          },
          required: ['price', 'currency']
        },

        // Admin Log Schema
        AdminLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'log-123',
              description: 'Log entry ID'
            },
            adminUser: {
              type: 'string',
              example: 'admin@skiacademy.com',
              description: 'Admin user who performed the action'
            },
            action: {
              type: 'string',
              example: 'reservation_confirmed',
              description: 'Action performed'
            },
            details: {
              type: 'string',
              example: 'Reservation 123 was confirmed',
              description: 'Detailed description of the action'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-10T08:00:00.000Z',
              description: 'When the action occurred'
            }
          }
        },

        // Statistics Schema
        ReservationStats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 150,
              description: 'Total number of reservations'
            },
            confirmed: {
              type: 'integer',
              example: 120,
              description: 'Number of confirmed reservations'
            },
            pending: {
              type: 'integer',
              example: 25,
              description: 'Number of pending reservations'
            },
            cancelled: {
              type: 'integer',
              example: 5,
              description: 'Number of cancelled reservations'
            },
            totalRevenue: {
              type: 'number',
              example: 18000,
              description: 'Total revenue from confirmed reservations'
            }
          }
        },

        // Appearance Settings Schema
        AppearanceSettings: {
          type: 'object',
          properties: {
            primaryColor: {
              type: 'string',
              example: '#007bff',
              description: 'Primary theme color'
            },
            secondaryColor: {
              type: 'string',
              example: '#6c757d',
              description: 'Secondary theme color'
            },
            logo: {
              type: 'string',
              example: 'https://example.com/logo.png',
              description: 'Logo URL'
            },
            companyName: {
              type: 'string',
              example: 'Ski Academy',
              description: 'Company name'
            },
            storagePath: {
              type: 'string',
              example: 'ski-academy-uploads',
              description: 'File storage path'
            },
            theme: {
              type: 'string',
              enum: ['light', 'dark', 'auto'],
              example: 'light',
              description: 'UI theme preference'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  exclude: ['/swagger', '/swagger/json'],
  path: '/swagger'
});
