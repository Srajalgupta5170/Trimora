# 🧪 Barber Queue System - API Testing Guide

## Prerequisites

- Backend running on `http://localhost:5000`
- MongoDB connected
- All models, controllers, and middleware updated
- Postman or similar API testing tool

---

## 🔑 Authentication

All protected endpoints require a JWT token in the header:

```
Authorization: Bearer <token>
```

---

## 📋 Test Workflow

### Phase 1: Setup & Cleanup

#### 1. Clear Database
```bash
cd server
node scripts/cleanup.js
```
✅ Clears Queue, Appointment, Service collections

---

### Phase 2: User Registration

#### 2a. Create Salon Owner
**Endpoint:** `POST /api/auth/signup`

**Body:**
```json
{
  "name": "John Owner",
  "email": "owner@salon.com",
  "password": "password123",
  "role": "salonOwner"
}
```

**Expected Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id_1",
    "name": "John Owner",
    "email": "owner@salon.com",
    "role": "salonOwner"
  }
}
```

**Save:** `owner_token` (for next login)

---

#### 2b. Create Customer
**Endpoint:** `POST /api/auth/signup`

**Body:**
```json
{
  "name": "Alice Customer",
  "email": "customer@example.com",
  "password": "password123",
  "role": "customer"
}
```

**Save:** `customer_token` (for login)

---

#### 2c. Create Barber
**Endpoint:** `POST /api/auth/signup`

**Body:**
```json
{
  "name": "Bob Barber",
  "email": "barber@salon.com",
  "password": "password123",
  "role": "barber"
}
```

**Save:** `barber_token` (for login)

---

### Phase 3: User Authentication

#### 3a. Login Owner
**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "owner@salon.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "owner_id",
    "name": "John Owner",
    "email": "owner@salon.com",
    "role": "salonOwner"
  }
}
```

**Save:** `OWNER_TOKEN = jwt_token_here`

---

#### 3b. Login Customer
**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

**Save:** `CUSTOMER_TOKEN = jwt_token_here`

---

#### 3c. Login Barber
**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "barber@salon.com",
  "password": "password123"
}
```

**Save:** `BARBER_TOKEN = jwt_token_here`

---

### Phase 4: Salon Management

#### 4a. Create Salon (Owner)
**Endpoint:** `POST /api/booking/salon`

**Headers:**
```
Authorization: Bearer OWNER_TOKEN
```

**Body:**
```json
{
  "name": "Premium Cuts",
  "address": "123 Main Street",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "description": "Premium barber shop",
  "openingTime": "09:00",
  "closingTime": "21:00",
  "image": "https://images.unsplash.com/photo-1599662150142-3c5dbe2b1a25?w=400"
}
```

**Expected Response:**
```json
{
  "message": "Salon registered successfully",
  "salon": {
    "_id": "salon_id_123",
    "name": "Premium Cuts",
    "ownerId": "owner_id",
    ...
  }
}
```

**Save:** `SALON_ID = salon_id_123`

---

#### 4b. Add Barber to Salon (Owner)
**Endpoint:** `POST /api/auth/salon/:salonId/add-barber`

**Headers:**
```
Authorization: Bearer OWNER_TOKEN
```

**Body:**
```json
{
  "barberId": "barber_user_id",
  "name": "Bob Barber",
  "experience": 5,
  "specializations": ["fade", "beard", "design"],
  "basePrice": 25,
  "bio": "Expert barber with 5 years experience"
}
```

**Expected Response:**
```json
{
  "message": "Barber added to salon successfully",
  "barberProfile": {
    "_id": "barber_profile_id",
    "userId": "barber_user_id",
    "salonId": "salon_id",
    ...
  }
}
```

**Save:** `BARBER_ID = barber_profile_id`

---

### Phase 5: Queue Operations

#### 5a. Customer Joins Queue
**Endpoint:** `POST /api/queue/join`

**Headers:**
```
Authorization: Bearer CUSTOMER_TOKEN
```

**Body:**
```json
{
  "barberId": "BARBER_ID",
  "salonId": "SALON_ID",
  "service": "Haircut"
}
```

**Expected Response:**
```json
{
  "message": "Added to queue! Your position: #1",
  "position": 1,
  "queueEntry": {
    "_id": "queue_entry_id",
    "position": 1,
    "status": "waiting"
  }
}
```

---

#### 5b. Customer Checks Position
**Endpoint:** `GET /api/queue/my-position`

**Headers:**
```
Authorization: Bearer CUSTOMER_TOKEN
```

**Expected Response:**
```json
{
  "position": 1,
  "status": "waiting",
  "service": "Haircut",
  "message": "You are #1 in queue"
}
```

---

#### 5c. Customer Gets My Status (for specific barber)
**Endpoint:** `GET /api/queue/my-status/:BARBER_ID`

**Headers:**
```
Authorization: Bearer CUSTOMER_TOKEN
```

**Expected Response:**
```json
{
  "position": 1,
  "peopleAhead": 0,
  "status": "waiting",
  "estimatedTime": "Your turn is next!",
  "estimatedTimeMinutes": 0
}
```

---

#### 5d. Barber Views Their Queue
**Endpoint:** `GET /api/queue/barber/:BARBER_ID`

**Headers:**
```
Authorization: Bearer BARBER_TOKEN
```

**Expected Response:**
```json
{
  "barberId": "barber_profile_id",
  "totalWaiting": 1,
  "currentServing": 0,
  "queue": [
    {
      "_id": "queue_id",
      "position": 1,
      "status": "waiting",
      "service": "Haircut",
      "userId": {
        "_id": "customer_id",
        "name": "Alice Customer",
        "email": "customer@example.com"
      }
    }
  ]
}
```

---

#### 5e. Barber Calls Next Customer
**Endpoint:** `POST /api/queue/barber/:BARBER_ID/next`

**Headers:**
```
Authorization: Bearer BARBER_TOKEN
```

**Expected Response:**
```json
{
  "message": "Next customer called",
  "customer": {
    "id": "customer_id",
    "service": "Haircut"
  }
}
```

**Note:** The customer's status should now be "in-progress"

---

#### 5f. Barber Completes Service
**Endpoint:** `POST /api/queue/barber/:BARBER_ID/complete`

**Headers:**
```
Authorization: Bearer BARBER_TOKEN
```

**Expected Response:**
```json
{
  "message": "Service completed",
  "completedCustomer": {
    "userId": "customer_id",
    "service": "Haircut"
  },
  "remainingQueueLength": 0
}
```

---

### Phase 6: Stats & Analytics

#### 6a. Barber Views Stats
**Endpoint:** `GET /api/queue/barber/:BARBER_ID/stats`

**Headers:**
```
Authorization: Bearer BARBER_TOKEN
```

**Expected Response:**
```json
{
  "today": {
    "totalServed": 1,
    "estimatedEarnings": 25
  },
  "currentStatus": {
    "waitingCount": 0,
    "inProgressCount": 0,
    "totalActive": 0
  }
}
```

---

#### 6b. Owner Views Salon Queues
**Endpoint:** `GET /api/booking/salon/:SALON_ID/queues`

**Headers:**
```
Authorization: Bearer OWNER_TOKEN
```

**Expected Response:**
```json
{
  "salon": {
    "id": "salon_id",
    "name": "Premium Cuts"
  },
  "queuesByBarber": [
    {
      "barberId": "barber_profile_id",
      "barberName": "Bob Barber",
      "waiting": [],
      "inProgress": [],
      "completed": [
        {
          "userId": "customer_id",
          "service": "Haircut"
        }
      ]
    }
  ]
}
```

---

#### 6c. Owner Views Salon Stats
**Endpoint:** `GET /api/booking/salon/:SALON_ID/stats`

**Headers:**
```
Authorization: Bearer OWNER_TOKEN
```

**Expected Response:**
```json
{
  "salon": {
    "id": "salon_id",
    "name": "Premium Cuts"
  },
  "today": {
    "totalServed": 1,
    "totalCustomers": 1,
    "activeQueues": 0
  },
  "barbers": 1
}
```

---

## ⚠️ Error Test Cases

### Test: Customer tries to access barber queue
**Endpoint:** `GET /api/queue/barber/:BARBER_ID`

**Headers:**
```
Authorization: Bearer CUSTOMER_TOKEN
```

**Expected Response:**
```json
{
  "message": "Access denied: insufficient permissions"
}
```
Status: `403`

---

### Test: Barber tries to access another barber's queue
**Endpoint:** `GET /api/queue/barber/:OTHER_BARBER_ID/`

**Headers:**
```
Authorization: Bearer BARBER_TOKEN (belongs to different barber)
```

**Expected Response:**
```json
{
  "message": "Unauthorized: You can only access your own queue"
}
```
Status: `403`

---

### Test: Customer joins same queue twice
**Endpoint:** `POST /api/queue/join`

**Headers:**
```
Authorization: Bearer CUSTOMER_TOKEN
```

**Body:**
```json
{
  "barberId": "BARBER_ID",
  "salonId": "SALON_ID",
  "service": "Haircut"
}
```

**Expected Response:**
```json
{
  "message": "You are already in this barber's queue",
  "position": 1
}
```
Status: `400`

---

## 🔌 Socket.IO Testing

### Connect to Socket.IO
```javascript
const socket = io('http://localhost:5000');

// Join barber's room
socket.emit('joinBarberRoom', { barberId: 'BARBER_ID' });

// Listen for updates
socket.on('queueUpdated', (data) => {
  console.log('Queue updated:', data);
  // data.action = 'customerJoined' | 'nextCalled' | 'serviceCompleted'
});

// Watch customer queue position
socket.emit('watchBarberQueue', { barberId: 'BARBER_ID' });

socket.on('queueRoomJoined', (data) => {
  console.log('Watching queue:', data.room);
});
```

---

## 📊 Test Checklist

- [ ] Salon owner can register salon
- [ ] Barber can be added to salon
- [ ] Customer can join queue
- [ ] Customer cannot join twice
- [ ] Queue positions are sequential (1, 2, 3...)
- [ ] Barber can call next customer
- [ ] Service completion moves to next
- [ ] Positions recalculate correctly
- [ ] Stats are accurate
- [ ] Authorization prevents unauthorized access
- [ ] Socket.IO emits to correct room only
- [ ] Transactions prevent race conditions

---

## 🐛 Troubleshooting

**Issue:** "Not authorized, token failed"
- Check token is valid and not expired
- Check Authorization header format: `Bearer <token>`

**Issue:** "Barber not found"
- Verify barber profile was created
- Check BARBER_ID is correct

**Issue:** "Position jumped from 1 to 3"
- Run cleanup script to reset
- Check queue recalculation logic

**Issue:** Socket.IO not receiving updates
- Verify room name format: `barber_<barberId>`
- Check Socket.IO connection is active
- Verify emit is targeting correct room

---

## ✅ All Tests Passing = Production Ready!
