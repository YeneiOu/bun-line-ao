# Admin Dashboard API Usage Examples

## Authentication Required

All admin endpoints require authentication with an admin role. Include the Firebase JWT token in the Authorization header.

```bash
# Replace YOUR_ADMIN_JWT_TOKEN with actual Firebase JWT token
export ADMIN_TOKEN="YOUR_ADMIN_JWT_TOKEN"
```

(failed)net::ERR_CONNECTION_REFUSED

## Admin Dashboard Endpoints

### 1. Get All Reservations

```bash
curl -X GET http://localhost:3000/api/admin/reservations \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

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

### 2. Get Reservation Statistics

```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

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

### 3. Get Customer Reservations

```bash
curl -X GET http://localhost:3000/api/admin/reservations/customer/user-456 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 4. Update Reservation Status

```bash
curl -X PATCH http://localhost:3000/api/admin/reservations/reservation-123/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed"
  }'
```

### 5. Update Reservation (Full Update)

```bash
curl -X PATCH http://localhost:3000/api/admin/reservations/reservation-123 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "paymentStatus": "paid",
    "notes": "Updated lesson details",
    "date": "2024-01-16",
    "timeSlot": "11:00-12:00"
  }'
```

### 6. Delete Single Reservation

```bash
curl -X DELETE http://localhost:3000/api/admin/reservations/reservation-123 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 7. Bulk Delete Reservations

```bash
curl -X DELETE http://localhost:3000/api/admin/reservations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reservationIds": ["reservation-123", "reservation-456", "reservation-789"]
  }'
```

### 8. Get Reservations by Status

```bash
# Get pending reservations
curl -X GET http://localhost:3000/api/admin/reservations/status/pending \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get confirmed reservations
curl -X GET http://localhost:3000/api/admin/reservations/status/confirmed \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get cancelled reservations
curl -X GET http://localhost:3000/api/admin/reservations/status/cancelled \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 9. Get Reservations by Date Range

```bash
curl -X GET "http://localhost:3000/api/admin/reservations/date-range?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 10. Get Admin Activity Logs

```bash
# Get last 50 logs (default)
curl -X GET http://localhost:3000/api/admin/logs \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Get last 100 logs
curl -X GET "http://localhost:3000/api/admin/logs?limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 11. Log Custom Admin Activity

```bash
curl -X POST http://localhost:3000/api/admin/logs \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "manual_review",
    "details": "Reviewed and approved reservation for VIP customer"
  }'
```

## Frontend Integration Examples

### Vue.js Admin Dashboard Component

```vue
<template>
  <div class="admin-dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Reservations</h3>
        <p>{{ stats.total }}</p>
      </div>
      <div class="stat-card">
        <h3>Confirmed</h3>
        <p>{{ stats.confirmed }}</p>
      </div>
      <div class="stat-card">
        <h3>Pending</h3>
        <p>{{ stats.pending }}</p>
      </div>
      <div class="stat-card">
        <h3>Total Revenue</h3>
        <p>${{ stats.totalRevenue }}</p>
      </div>
    </div>

    <div class="reservations-table">
      <h2>All Reservations</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reservation in reservations" :key="reservation.id">
            <td>{{ reservation.id }}</td>
            <td>{{ reservation.userId }}</td>
            <td>{{ reservation.date }}</td>
            <td>{{ reservation.timeSlot }}</td>
            <td>
              <select
                :value="reservation.status"
                @change="updateStatus(reservation.id, $event.target.value)"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
            <td>
              <button @click="deleteReservation(reservation.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const stats = ref({
  total: 0,
  confirmed: 0,
  pending: 0,
  cancelled: 0,
  totalRevenue: 0,
});

const reservations = ref([]);
const adminToken = ref("YOUR_ADMIN_JWT_TOKEN"); // Get from auth state

const fetchStats = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/admin/stats", {
      headers: {
        Authorization: `Bearer ${adminToken.value}`,
      },
    });
    const result = await response.json();
    if (result.code === 0) {
      stats.value = result.data;
    }
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
};

const fetchReservations = async () => {
  try {
    const response = await fetch(
      "http://localhost:3000/api/admin/reservations",
      {
        headers: {
          Authorization: `Bearer ${adminToken.value}`,
        },
      }
    );
    const result = await response.json();
    if (result.code === 0) {
      reservations.value = result.data;
    }
  } catch (error) {
    console.error("Error fetching reservations:", error);
  }
};

const updateStatus = async (reservationId, newStatus) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/admin/reservations/${reservationId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken.value}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    const result = await response.json();
    if (result.code === 0) {
      // Refresh data
      await fetchReservations();
      await fetchStats();
      alert("Status updated successfully!");
    }
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update status");
  }
};

const deleteReservation = async (reservationId) => {
  if (!confirm("Are you sure you want to delete this reservation?")) return;

  try {
    const response = await fetch(
      `http://localhost:3000/api/admin/reservations/${reservationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken.value}`,
        },
      }
    );

    const result = await response.json();
    if (result.code === 0) {
      // Refresh data
      await fetchReservations();
      await fetchStats();
      alert("Reservation deleted successfully!");
    }
  } catch (error) {
    console.error("Error deleting reservation:", error);
    alert("Failed to delete reservation");
  }
};

onMounted(() => {
  fetchStats();
  fetchReservations();
});
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.stat-card p {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #007bff;
}

.reservations-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
}

button {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #c82333;
}

select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
```

## Error Handling

All admin endpoints return consistent error responses:

```json
{
  "code": 500,
  "message": "Error description",
  "data": "Detailed error information"
}
```

Common error codes:

- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (not admin role)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error
- `503` - Service Unavailable (Firebase Admin not configured)

## Best Practices

1. **Always validate admin permissions** before allowing access to admin features
2. **Log all admin activities** for audit trails
3. **Use bulk operations** for better performance when dealing with multiple records
4. **Implement proper error handling** and user feedback
5. **Cache statistics** for better performance on dashboard loads
6. **Implement pagination** for large datasets
7. **Add confirmation dialogs** for destructive operations
