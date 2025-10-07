# Firebase Integration Usage Examples

## Basic Setup

1. **Start the server:**
```bash
bun run dev
```

2. **Test the health endpoint:**
```bash
curl http://localhost:3000/api/health
```

## Working with Firebase Data

### 1. Create a Reservation (No Auth Required for Demo)

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user-123",
    "coachId": "coach-456",
    "date": "2024-01-15",
    "timeSlot": "10:00-11:00",
    "notes": "First skiing lesson"
  }'
```

Expected Response:
```json
{
  "code": 0,
  "message": "Reservation created successfully",
  "data": {
    "id": "generated-reservation-id"
  }
}
```

### 2. Get a Reservation

```bash
curl http://localhost:3000/api/reservations/RESERVATION_ID
```

### 3. Get All Coaches

```bash
curl http://localhost:3000/api/coaches
```

### 4. Get Pricing Information

```bash
curl http://localhost:3000/api/prices
```

### 5. Get Appearance Settings

```bash
curl http://localhost:3000/api/settings/appearance
```

## Frontend Integration

### Vue.js Example (Client-side)

```vue
<template>
  <div>
    <h2>Create Reservation</h2>
    <form @submit.prevent="createReservation">
      <input v-model="reservation.coachId" placeholder="Coach ID" required />
      <input v-model="reservation.date" type="date" required />
      <input v-model="reservation.timeSlot" placeholder="Time Slot" required />
      <textarea v-model="reservation.notes" placeholder="Notes"></textarea>
      <button type="submit">Create Reservation</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const reservation = ref({
  userId: 'demo-user',
  coachId: '',
  date: '',
  timeSlot: '',
  notes: ''
})

const createReservation = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservation.value)
    })
    
    const result = await response.json()
    
    if (result.code === 0) {
      alert('Reservation created successfully!')
      console.log('Reservation ID:', result.data.id)
    } else {
      alert('Error: ' + result.message)
    }
  } catch (error) {
    console.error('Error creating reservation:', error)
    alert('Failed to create reservation')
  }
}
</script>
```

### React Example

```jsx
import React, { useState } from 'react';

function CreateReservation() {
  const [reservation, setReservation] = useState({
    userId: 'demo-user',
    coachId: '',
    date: '',
    timeSlot: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:3000/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation)
      });
      
      const result = await response.json();
      
      if (result.code === 0) {
        alert('Reservation created successfully!');
        console.log('Reservation ID:', result.data.id);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to create reservation');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={reservation.coachId}
        onChange={(e) => setReservation({...reservation, coachId: e.target.value})}
        placeholder="Coach ID"
        required
      />
      <input
        type="date"
        value={reservation.date}
        onChange={(e) => setReservation({...reservation, date: e.target.value})}
        required
      />
      <input
        value={reservation.timeSlot}
        onChange={(e) => setReservation({...reservation, timeSlot: e.target.value})}
        placeholder="Time Slot"
        required
      />
      <textarea
        value={reservation.notes}
        onChange={(e) => setReservation({...reservation, notes: e.target.value})}
        placeholder="Notes"
      />
      <button type="submit">Create Reservation</button>
    </form>
  );
}

export default CreateReservation;
```

## Authentication (When Firebase Admin is Configured)

### 1. Get Firebase JWT Token (Client-side)

```javascript
import { signInAnonymously, getAuth } from 'firebase/auth';

const auth = getAuth();

// Sign in anonymously
const userCredential = await signInAnonymously(auth);
const user = userCredential.user;

// Get ID token
const idToken = await user.getIdToken();

// Use token in API requests
const response = await fetch('http://localhost:3000/api/reservations/my', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

### 2. Authenticated API Calls

```bash
# Replace YOUR_JWT_TOKEN with actual Firebase JWT
curl -X GET http://localhost:3000/api/reservations/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "code": 0,
  "message": "Success message",
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "code": 500,
  "message": "Error message",
  "data": "Error details"
}
```

## Common Error Codes

- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
- `503` - Service Unavailable (Firebase Admin not configured)

## Next Steps

1. **Configure Firebase Admin SDK** by setting `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable
2. **Set up proper authentication** in your frontend application
3. **Implement role-based access control** for admin features
4. **Add data validation** and business logic as needed
5. **Set up proper error logging** and monitoring
