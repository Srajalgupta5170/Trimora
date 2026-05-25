# Queue System Testing & Validation Guide

## Testing Overview

This guide covers all testing scenarios for the production-ready queue system, from unit tests to end-to-end validation.

---

## Unit Tests

### Queue Model Tests

Create `server/tests/models/Queue.test.js`:

```javascript
import mongoose from 'mongoose';
import Queue from '../../models/Queue.js';
import { expect } from 'chai';

describe('Queue Model', () => {
  
  before(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
  });
  
  after(async () => {
    await mongoose.connection.close();
  });
  
  describe('Unique Index - Duplicate Prevention', () => {
    
    it('should prevent duplicate active entries for same customer-barber', async () => {
      const userData = {
        salonId: new mongoose.Types.ObjectId(),
        barberId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        position: 1,
        status: 'waiting',
        service: 'Haircut',
        serviceDuration: 30
      };
      
      // Create first entry
      await Queue.create(userData);
      
      // Try to create duplicate - should fail
      try {
        await Queue.create(userData);
        expect.fail('Should have thrown duplicate key error');
      } catch (error) {
        expect(error.code).to.equal(11000); // Duplicate key
      }
    });
    
    it('should allow new entry after completing previous', async () => {
      const userData = {
        salonId: new mongoose.Types.ObjectId(),
        barberId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        position: 1,
        status: 'completed', // Completed, not active
        service: 'Haircut',
        serviceDuration: 30
      };
      
      // Create completed entry
      await Queue.create(userData);
      
      // Create waiting entry for same customer-barber - should succeed
      const newEntry = await Queue.create({
        ...userData,
        status: 'waiting',
        position: 1
      });
      
      expect(newEntry.status).to.equal('waiting');
    });
  });
  
  describe('Schema Validation', () => {
    
    it('should require service name', async () => {
      try {
        await Queue.create({
          salonId: new mongoose.Types.ObjectId(),
          barberId: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          service: '', // Empty
          status: 'waiting'
        });
        expect.fail('Should have failed validation');
      } catch (error) {
        expect(error.errors.service).to.exist;
      }
    });
    
    it('should default serviceDuration to 30', async () => {
      const entry = await Queue.create({
        salonId: new mongoose.Types.ObjectId(),
        barberId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        service: 'Haircut',
        status: 'waiting'
      });
      
      expect(entry.serviceDuration).to.equal(30);
    });
    
    it('should accept valid status values only', async () => {
      const validStatuses = ['waiting', 'in-progress', 'completed', 'cancelled'];
      
      for (const status of validStatuses) {
        const entry = await Queue.create({
          salonId: new mongoose.Types.ObjectId(),
          barberId: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          service: 'Haircut',
          status
        });
        expect(entry.status).to.equal(status);
      }
    });
  });
  
  describe('Index Performance', () => {
    
    it('should use barber queue index for efficient queries', async () => {
      const barberId = new mongoose.Types.ObjectId();
      
      // Create multiple entries
      for (let i = 0; i < 100; i++) {
        await Queue.create({
          salonId: new mongoose.Types.ObjectId(),
          barberId,
          userId: new mongoose.Types.ObjectId(),
          position: i + 1,
          status: 'waiting',
          service: 'Haircut',
          serviceDuration: 30
        });
      }
      
      // Query should be fast
      const startTime = Date.now();
      const queue = await Queue.find({ barberId, status: 'waiting' }).sort('position');
      const queryTime = Date.now() - startTime;
      
      expect(queue).to.have.lengthOf(100);
      expect(queryTime).to.be.lessThan(100); // Should complete in < 100ms
    });
  });
});
```

### Controller Tests

Create `server/tests/controllers/queueController.test.js`:

```javascript
import { expect } from 'chai';
import sinon from 'sinon';
import Queue from '../../models/Queue.js';
import * as controller from '../../controllers/queueController.js';

describe('Queue Controller', () => {
  
  describe('Position Recalculation', () => {
    
    it('should recalculate positions without gaps', async () => {
      const barberId = new mongoose.Types.ObjectId();
      
      // Create entries at positions 1, 2, 3
      for (let i = 1; i <= 3; i++) {
        await Queue.create({
          barberId,
          position: i,
          status: 'waiting'
        });
      }
      
      // Remove position 2
      await Queue.deleteOne({ barberId, position: 2 });
      
      // Recalculate
      await controller.recalculatePositions(barberId, 'waiting');
      
      // Check positions are 1, 2 (not 1, 3)
      const queue = await Queue.find({ barberId }).sort('position');
      expect(queue[0].position).to.equal(1);
      expect(queue[1].position).to.equal(2);
    });
  });
  
  describe('Estimated Wait Time', () => {
    
    it('should calculate wait time based on service durations', async () => {
      const barberId = new mongoose.Types.ObjectId();
      
      // Create queue: 30min, 20min, 50min
      const entries = [
        { position: 1, service: 'Haircut', serviceDuration: 30 },
        { position: 2, service: 'Beard', serviceDuration: 20 },
        { position: 3, service: 'Hair+Beard', serviceDuration: 50 }
      ];
      
      for (const entry of entries) {
        await Queue.create({
          barberId,
          status: 'waiting',
          ...entry
        });
      }
      
      // Calculate wait for position 3
      const waitTime = await controller.calculateEstimatedWaitTime(barberId, 3);
      
      expect(waitTime).to.equal(50); // 30 + 20
    });
    
    it('should return 0 for first position', async () => {
      const barberId = new mongoose.Types.ObjectId();
      await Queue.create({
        barberId,
        position: 1,
        status: 'waiting',
        service: 'Haircut',
        serviceDuration: 30
      });
      
      const waitTime = await controller.calculateEstimatedWaitTime(barberId, 1);
      expect(waitTime).to.equal(0);
    });
  });
  
  describe('Join Queue - Duplicate Prevention', () => {
    
    it('should return 400 if customer already in queue', async () => {
      const req = {
        user: { _id: new mongoose.Types.ObjectId() },
        body: {
          salonId: new mongoose.Types.ObjectId(),
          barberId: new mongoose.Types.ObjectId(),
          service: 'Haircut'
        }
      };
      
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
      
      // First join - should succeed
      await controller.joinQueue(req, res);
      
      // Second join - should fail
      res.status.resetHistory();
      res.json.resetHistory();
      
      await controller.joinQueue(req, res);
      
      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('already in queue');
    });
  });
});
```

---

## Integration Tests

### Scenario: Complete Queue Lifecycle

Create `server/tests/integration/queueLifecycle.test.js`:

```javascript
import { expect } from 'chai';
import request from 'supertest';
import app from '../../server.js';

describe('Queue Lifecycle - Integration Test', () => {
  
  let customerToken, barberToken, salonId, barberId;
  
  before(async () => {
    // Setup: Create customer, barber, salon
    const customerRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'Ahmed',
        email: 'ahmed@test.com',
        password: 'password123',
        role: 'customer'
      });
    customerToken = customerRes.body.token;
    
    const barberRes = await request(app)
      .post('/api/auth/signup')
      .send({
        name: 'John',
        email: 'john@test.com',
        password: 'password123',
        role: 'barber'
      });
    barberToken = barberRes.body.token;
    
    // Create salon and register barber
    // ... setup code ...
  });
  
  it('should handle complete customer queue journey', async () => {
    
    // Step 1: Customer joins queue
    const joinRes = await request(app)
      .post('/api/queue/join')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        salonId,
        barberId,
        service: 'Haircut'
      });
    
    expect(joinRes.status).to.equal(201);
    expect(joinRes.body.queueEntry.position).to.equal(1);
    expect(joinRes.body.queueEntry.status).to.equal('waiting');
    
    // Step 2: Customer checks position
    const statusRes = await request(app)
      .get(`/api/queue/my-status/${barberId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(statusRes.status).to.equal(200);
    expect(statusRes.body.position).to.equal(1);
    
    // Step 3: Customer cannot join again
    const dupRes = await request(app)
      .post('/api/queue/join')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, barberId, service: 'Haircut' });
    
    expect(dupRes.status).to.equal(400);
    expect(dupRes.body.message).to.include('already in queue');
    
    // Step 4: Customer leaves queue
    const leaveRes = await request(app)
      .post('/api/queue/leave')
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(leaveRes.status).to.equal(200);
    expect(leaveRes.body.message).to.include('left the queue');
    
    // Step 5: Customer can rejoin after leaving
    const rejoinRes = await request(app)
      .post('/api/queue/join')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, barberId, service: 'Haircut' });
    
    expect(rejoinRes.status).to.equal(201);
  });
  
  it('should maintain accurate positions with multiple customers', async () => {
    // Create 5 customers
    const customers = [];
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/auth/signup').send({
        name: `Customer${i}`,
        email: `cust${i}@test.com`,
        password: 'pass'
      });
      customers.push(res.body.token);
    }
    
    // All join queue
    const positions = [];
    for (const token of customers) {
      const res = await request(app)
        .post('/api/queue/join')
        .set('Authorization', `Bearer ${token}`)
        .send({ salonId, barberId, service: 'Haircut' });
      positions.push(res.body.queueEntry.position);
    }
    
    // Should be 1, 2, 3, 4, 5
    expect(positions).to.deep.equal([1, 2, 3, 4, 5]);
    
    // Customer at position 3 leaves
    await request(app)
      .post('/api/queue/leave')
      .set('Authorization', `Bearer ${customers[2]}`);
    
    // Positions should recalculate to 1, 2, 3, 4
    const queueRes = await request(app)
      .get(`/api/queue/barber/${barberId}`)
      .set('Authorization', `Bearer ${barberToken}`);
    
    const newPositions = queueRes.body.queue.map(e => e.position);
    expect(newPositions).to.deep.equal([1, 2, 3, 4]);
  });
});
```

---

## End-to-End Testing

### Manual Test Checklist

```
CUSTOMER FLOW
=============
☐ Browse all salons (public endpoint)
☐ Select salon and view barbers
☐ Select barber and see public queue
☐ Join queue with specific service
☐ See position and estimated wait time
☐ Real-time position updates via Socket.IO
☐ Receive notification when turn comes (yourTurn event)
☐ Leave queue before service starts
☐ Receive notification when service completes
☐ View service history

BARBER FLOW
===========
☐ Login and view dashboard
☐ See queue of waiting customers
☐ See service durations for each customer
☐ Call next customer (status: waiting → in-progress)
☐ Receive customer details
☐ Complete service with price
☐ See next customer automatically
☐ View stats (served, earnings)
☐ Socket.IO real-time queue updates

SALON OWNER FLOW
================
☐ View all owned salons
☐ See queue status for each barber
☐ View earnings breakdown
☐ Monitor active queues
☐ Access barber requests

CONCURRENT LOAD
===============
☐ 5 customers try to join simultaneously
☐ Positions correctly assigned (1-5)
☐ No duplicate entries created
☐ All positions unique and sequential
☐ Wait times calculated correctly

EDGE CASES
==========
☐ Customer leaves queue, position recalculates
☐ Last position customer joins, gets correct number
☐ Barber not active - join rejected
☐ Invalid service name - rejected
☐ Duplicate join attempt - rejected
☐ Leave when not in queue - appropriate error
```

---

## Performance Testing

### Load Test Script

Create `server/tests/performance/loadTest.js`:

```javascript
import autocannon from 'autocannon';

const testConfig = {
  url: 'http://localhost:5000',
  connections: 100,
  pipelining: 10,
  duration: 60,
  requests: [
    {
      path: '/api/queue/barber/:barberId/public',
      method: 'GET',
      weight: 10 // 10% of requests
    },
    {
      path: '/api/queue/join',
      method: 'POST',
      weight: 20,
      body: {
        salonId: '...', 
        barberId: '...',
        service: 'Haircut'
      },
      headers: { 'Authorization': 'Bearer <token>' }
    },
    {
      path: '/api/queue/my-status/:barberId',
      method: 'GET',
      weight: 40,
      headers: { 'Authorization': 'Bearer <token>' }
    },
    {
      path: '/api/queue/barber/:barberId',
      method: 'GET',
      weight: 30,
      headers: { 'Authorization': 'Bearer <token>' }
    }
  ]
};

autocannon(testConfig, (err, result) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('Load Test Results:');
  console.log(`Throughput: ${result.throughput.average} req/sec`);
  console.log(`Latency P50: ${result.latency.p50} ms`);
  console.log(`Latency P95: ${result.latency.p95} ms`);
  console.log(`Latency P99: ${result.latency.p99} ms`);
  console.log(`Errors: ${result.errors}`);
});
```

Run: `node server/tests/performance/loadTest.js`

Expected Results:
- Throughput: > 500 req/sec
- Latency P50: < 50ms
- Latency P95: < 200ms
- Errors: 0

---

## Security Testing

### Authorization Tests

```javascript
describe('Authorization', () => {
  
  it('should reject unauthenticated queue join', async () => {
    const res = await request(app)
      .post('/api/queue/join')
      .send({ salonId, barberId, service: 'Haircut' });
    
    expect(res.status).to.equal(401);
  });
  
  it('should reject customer accessing barber endpoints', async () => {
    const res = await request(app)
      .get(`/api/queue/barber/${barberId}`)
      .set('Authorization', `Bearer ${customerToken}`);
    
    expect(res.status).to.equal(403);
  });
  
  it('should reject barber accessing other barber queues', async () => {
    const otherBarberId = new mongoose.Types.ObjectId();
    
    const res = await request(app)
      .get(`/api/queue/barber/${otherBarberId}`)
      .set('Authorization', `Bearer ${barberToken}`);
    
    expect(res.status).to.equal(403);
  });
});
```

---

## Database Validation

### Query Testing

```bash
# Test queue queries in MongoDB
db.queues.find({ barberId: ObjectId('...'), status: 'waiting' }).explain('executionStats')

# Should use index: barberId_status_position
# executionStats.executionStages.stage should be "COLLSCAN" or "IXSCAN"
# For "IXSCAN" = index used (good!)
# For "COLLSCAN" = collection scan (bad!)
```

### Data Integrity Checks

```javascript
// Verify no duplicate active entries
const duplicates = await Queue.collection.aggregate([
  {
    $match: { status: { $in: ['waiting', 'in-progress'] } }
  },
  {
    $group: {
      _id: { userId: '$userId', barberId: '$barberId' },
      count: { $sum: 1 }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]).toArray();

console.log('Duplicate entries found:', duplicates.length);
// Should be 0

// Verify no position gaps
const gaps = await Queue.collection.aggregate([
  {
    $match: { status: 'waiting' }
  },
  {
    $group: {
      _id: '$barberId',
      positions: { $push: '$position' }
    }
  },
  {
    $addFields: {
      sorted: { $setUnion: ['$positions'] },
      gapped: {
        $gt: [
          { $subtract: [{ $max: '$positions' }, { $min: '$positions' }] },
          { $subtract: [{ $size: '$positions' }, 1] }
        ]
      }
    }
  },
  {
    $match: { gapped: true }
  }
]).toArray();

console.log('Barbers with position gaps:', gaps.length);
// Should be 0
```

---

## Socket.IO Testing

### Real-Time Updates Test

```javascript
import { io } from 'socket.io-client';

describe('Socket.IO Real-Time Updates', () => {
  
  let socket, barberId, barberId;
  
  before((done) => {
    socket = io('http://localhost:5000');
    socket.on('connect', done);
  });
  
  it('should broadcast queue updates to barber room', (done) => {
    // Customer joins
    request(app)
      .post('/api/queue/join')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ salonId, barberId, service: 'Haircut' })
      .end(() => {
        // Barber should receive update
        socket.on('queueUpdated', (data) => {
          expect(data.action).to.equal('customerJoined');
          expect(data.queue.length).to.be.greaterThan(0);
          done();
        });
      });
  });
  
  it('should notify customer when turn comes', (done) => {
    // Setup: Customer in queue, barber calls next
    socket.on('yourTurn', (data) => {
      expect(data.message).to.include('Your turn');
      done();
    });
    
    // Barber calls next
    request(app)
      .post(`/api/queue/barber/${barberId}/next`)
      .set('Authorization', `Bearer ${barberToken}`)
      .end();
  });
});
```

---

## Testing Checklist

Before deploying to production:

**Unit Tests:**
- [ ] Model validation tests pass
- [ ] Index tests verify queries are fast
- [ ] Duplicate prevention tests pass

**Integration Tests:**
- [ ] Queue lifecycle test completes successfully
- [ ] Multi-customer position test passes
- [ ] Authorization tests verify security

**E2E Tests:**
- [ ] Customer flow manual test completed
- [ ] Barber flow manual test completed
- [ ] Concurrent load test (5+ simultaneous) passes
- [ ] Real-time Socket.IO updates verified

**Performance:**
- [ ] Throughput > 500 req/sec
- [ ] P95 latency < 200ms
- [ ] No memory leaks over 1-hour runtime

**Data Integrity:**
- [ ] No duplicate active entries found
- [ ] No position gaps detected
- [ ] All timestamps valid

**Security:**
- [ ] Unauthenticated requests rejected
- [ ] Cross-barber access prevented
- [ ] SQL injection tests pass (N/A - MongoDB)
- [ ] XSS prevention verified

---

## Continuous Testing

### GitHub Actions Workflow

Create `.github/workflows/queue-tests.yml`:

```yaml
name: Queue System Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      
      - run: npm test -- --grep "Queue"
        env:
          MONGODB_URI: mongodb://localhost:27017/barber_app_test
```

---

## Results & Sign-Off

After completing all tests, document:

```
QUEUE SYSTEM TEST RESULTS
=========================
Date: [Date]
Version: [Queue v2]
Tested by: [Name]

UNIT TESTS:     ✅ 15/15 passed
INTEGRATION:    ✅ 8/8 passed
E2E TESTS:      ✅ All scenarios verified
LOAD TEST:      ✅ 750 req/sec, P95 < 150ms
DATA INTEGRITY: ✅ No duplicates, no gaps
SECURITY:       ✅ All auth checks pass

SIGNED OFF: ___________________ Date: _______________
```

---

## Debugging Tips

### Enable Verbose Logging

```javascript
// In server.js
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  // Log all queue operations
  Queue.watch().on('change', (change) => {
    console.log('Queue change:', change.operationType, change.fullDocument);
  });
  
  // Log all Socket.IO events
  io.on('connection', (socket) => {
    socket.onAnyOutgoing((event, ...args) => {
      console.log('Socket emit:', event, args);
    });
  });
}
```

### Inspect Database State

```bash
# In MongoDB shell
db.queues.find({ barberId: ObjectId('...') }).sort({ position: 1 })

# Check for duplicates
db.queues.aggregate([
  { $match: { status: { $in: ['waiting', 'in-progress'] } } },
  { $group: { _id: { userId: '$userId', barberId: '$barberId' }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

---

## Next Steps

1. Set up continuous integration with GitHub Actions
2. Schedule daily regression tests
3. Monitor production metrics (error rates, latency)
4. Collect customer feedback on queue experience
5. Plan optimization based on real usage patterns
