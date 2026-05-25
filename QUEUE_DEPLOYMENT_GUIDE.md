# Queue System Migration & Deployment Guide

## Overview

This guide covers migrating from the old queue system to the new production-grade queue system with minimal downtime and zero data loss.

---

## Pre-Deployment Checklist

### 1. Backup Current System

```bash
# Backup MongoDB
mongodump --uri="mongodb+srv://..." --out=./backups/pre-migration-$(date +%Y%m%d)

# Verify backup
ls -lh ./backups/pre-migration-*/
```

### 2. Review Changes

**Files Modified:**
- `server/models/Queue.js` (schema added fields)
- `server/controllers/queueController.js` (complete rewrite)
- `server/routes/queueRoutes.js` (new endpoints)
- `client/src/services/api.js` (updated endpoints)

**New Dependencies:**
- `node-cron` (optional, for scheduled cleanup)

**Breaking Changes:**
- API endpoint paths slightly changed (`/booking/queue/` → `/queue/`)
- Queue response structure includes new fields
- Position numbering may change (if recalculation needed)

### 3. Test on Staging

```bash
# Deploy to staging environment
git checkout production
git pull origin main

# Run full test suite
npm test

# Load test
npm run load-test

# Manual verification (all test scenarios)
```

---

## Deployment Strategy

### Option 1: Zero-Downtime Blue-Green Deployment (Recommended)

**Phase 1: Prepare Blue Environment (New)**
```bash
# Deploy new version alongside old
docker run -d --name barber-app-blue \
  -p 5000:5000 \
  -e NODE_ENV=production \
  barber-app:v2-queue

# Test new environment
curl http://localhost:5000/api/queue/barber/{id}/public

# Verify all endpoints working
npm run test:integration
```

**Phase 2: Data Migration**
```bash
# Add new fields to existing queue entries
db.queues.updateMany(
  {},
  {
    $set: {
      serviceDuration: 30,
      joinedAt: new Date(),
      startedAt: null,
      completedAt: null,
      actualDuration: null,
      cancelReason: null
    }
  }
)

# Verify update
db.queues.findOne() # Should show new fields
```

**Phase 3: Create Indexes**
```bash
# Create unique partial index
db.queues.createIndex(
  { userId: 1, barberId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['waiting', 'in-progress'] } 
    }
  }
)

# Create efficiency indexes
db.queues.createIndex({ barberId: 1, status: 1, position: 1 })
db.queues.createIndex({ status: 1, completedAt: 1 })

# Verify indexes
db.queues.getIndexes()
```

**Phase 4: Switch Traffic**
```bash
# Update load balancer to point to new version
# Or use DNS switch:
nslookup barber-app.com
# Points to: 192.168.1.100 (blue - new version)

# Verify serving with new code
curl -i http://barber-app.com/api/queue/barber/test/public
# Check response has new fields
```

**Phase 5: Monitor**
```bash
# Watch logs for errors
docker logs -f barber-app-blue

# Monitor error rates
curl http://localhost:5000/health

# Check database performance
mongostat --uri="mongodb+srv://..." 1

# Wait 30 minutes minimum for stabilization
```

**Phase 6: Keep Green for Rollback**
```bash
# Keep old version running for 24 hours
docker run -d --name barber-app-green \
  -e NODE_ENV=production \
  barber-app:v1-queue

# Rollback command (if needed):
# Update load balancer to point back to green
```

---

### Option 2: Rolling Deployment (For Multiple Servers)

```bash
# Deploy to server 1 (25% of traffic)
docker pull barber-app:v2-queue
docker stop barber-app-1
docker run -d --name barber-app-1 \
  barber-app:v2-queue

# Monitor for 10 minutes
# If errors detected, rollback: docker run -d barber-app:v1-queue

# Deploy to server 2 (50% of traffic)
# ... repeat ...

# Deploy to server 3 (75% of traffic)
# ... repeat ...

# Deploy to server 4 (100% of traffic)
# ... repeat ...
```

---

### Option 3: Scheduled Maintenance (Simplest, but with downtime)

```bash
# 1. Notify users
# "Scheduled maintenance Saturday 2-3 AM. Queue system will be offline."

# 2. Stop all queue operations
docker stop barber-app

# 3. Backup database
mongodump --out=./backups/pre-migration-final

# 4. Add fields to existing entries
# (migration script)

# 5. Create indexes
# (index creation)

# 6. Deploy new version
docker run -d --name barber-app \
  barber-app:v2-queue

# 7. Verify
curl http://localhost:5000/api/queue/barber/test/public

# 8. Notify users it's back online
```

---

## Database Migration Script

Create `server/scripts/migrate-queue-v1-to-v2.js`:

```javascript
import mongoose from 'mongoose';
import Queue from '../models/Queue.js';

async function migrateQueue() {
  try {
    console.log('🔄 Starting Queue migration from v1 to v2...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Step 1: Add missing fields to all entries
    console.log('📝 Step 1: Adding missing fields...');
    const result = await Queue.updateMany(
      {},
      {
        $set: {
          serviceDuration: 30, // Default to 30 minutes
          joinedAt: new Date(),
          startedAt: null,
          completedAt: null,
          actualDuration: null,
          cancelReason: null
        }
      }
    );
    console.log(`✅ Updated ${result.modifiedCount} documents`);
    
    // Step 2: Convert old status values (if any differ)
    console.log('📝 Step 2: Normalizing status values...');
    const statusMap = {
      'pending': 'waiting',
      'serving': 'in-progress',
      'done': 'completed'
    };
    
    for (const [old, newVal] of Object.entries(statusMap)) {
      const result = await Queue.updateMany(
        { status: old },
        { $set: { status: newVal } }
      );
      if (result.modifiedCount > 0) {
        console.log(`✅ Converted ${result.modifiedCount} entries: ${old} → ${newVal}`);
      }
    }
    
    // Step 3: Recalculate positions for each barber
    console.log('📝 Step 3: Recalculating positions...');
    const barbers = await Queue.distinct('barberId');
    
    for (const barberId of barbers) {
      // Get all waiting/in-progress entries for this barber
      const entries = await Queue.find({
        barberId,
        status: { $in: ['waiting', 'in-progress'] }
      }).sort('position');
      
      // Recalculate positions
      for (let i = 0; i < entries.length; i++) {
        if (entries[i].position !== i + 1) {
          await Queue.updateOne(
            { _id: entries[i]._id },
            { $set: { position: i + 1 } }
          );
        }
      }
      
      console.log(`✅ Recalculated positions for barber ${barberId}`);
    }
    
    // Step 4: Verify data integrity
    console.log('📝 Step 4: Verifying data integrity...');
    
    // Check for duplicates
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
    
    if (duplicates.length > 0) {
      console.warn(`⚠️ Found ${duplicates.length} duplicate entries!`);
      console.warn('Duplicates:', duplicates);
    } else {
      console.log('✅ No duplicate entries found');
    }
    
    // Check for position gaps
    const gaps = await Queue.collection.aggregate([
      {
        $match: { status: 'waiting' }
      },
      {
        $group: {
          _id: '$barberId',
          count: { $sum: 1 },
          maxPos: { $max: '$position' }
        }
      },
      {
        $match: {
          $expr: { $ne: ['$count', '$maxPos'] }
        }
      }
    ]).toArray();
    
    if (gaps.length > 0) {
      console.warn(`⚠️ Found ${gaps.length} barbers with position gaps!`);
    } else {
      console.log('✅ No position gaps found');
    }
    
    // Get migration stats
    const stats = await Queue.collection.stats();
    console.log(`\n📊 Migration Stats:`);
    console.log(`   Total entries: ${stats.count}`);
    console.log(`   Data size: ${Math.round(stats.size / 1024 / 1024)} MB`);
    
    const byStatus = await Queue.collection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    for (const status of byStatus) {
      console.log(`   ${status._id}: ${status.count}`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Run migration
migrateQueue();
```

Run migration:
```bash
node server/scripts/migrate-queue-v1-to-v2.js
```

---

## Index Creation Script

Create `server/scripts/create-queue-indexes.js`:

```javascript
import mongoose from 'mongoose';

async function createIndexes() {
  try {
    console.log('🔄 Creating Queue indexes...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('queues');
    
    // Index 1: Unique partial index for duplicate prevention
    console.log('📝 Creating unique partial index...');
    await collection.createIndex(
      { userId: 1, barberId: 1, status: 1 },
      {
        unique: true,
        partialFilterExpression: {
          status: { $in: ['waiting', 'in-progress'] }
        },
        name: 'unique_active_queue'
      }
    );
    console.log('✅ Unique partial index created');
    
    // Index 2: Barber queue efficiency
    console.log('📝 Creating barber queue index...');
    await collection.createIndex(
      { barberId: 1, status: 1, position: 1 },
      { name: 'barber_queue_efficiency' }
    );
    console.log('✅ Barber queue index created');
    
    // Index 3: Cleanup efficiency
    console.log('📝 Creating cleanup index...');
    await collection.createIndex(
      { status: 1, completedAt: 1 },
      { name: 'cleanup_efficiency' }
    );
    console.log('✅ Cleanup index created');
    
    // Index 4: Salon queries
    console.log('📝 Creating salon index...');
    await collection.createIndex(
      { salonId: 1, barberId: 1, status: 1 },
      { name: 'salon_barber_status' }
    );
    console.log('✅ Salon index created');
    
    // Index 5: User queries
    console.log('📝 Creating user index...');
    await collection.createIndex(
      { userId: 1, status: 1 },
      { name: 'user_status' }
    );
    console.log('✅ User index created');
    
    // Verify indexes
    console.log('\n📊 Created indexes:');
    const indexes = await collection.getIndexes();
    for (const [name, spec] of Object.entries(indexes)) {
      console.log(`   ${name}: ${JSON.stringify(spec.key)}`);
    }
    
    console.log('\n✅ All indexes created successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Index creation failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

createIndexes();
```

Run index creation:
```bash
node server/scripts/create-queue-indexes.js
```

---

## Rollback Procedure

If issues occur after deployment:

### Immediate Rollback (< 5 minutes)

```bash
# 1. Redirect traffic back to old version
docker stop barber-app-new
docker start barber-app-old

# 2. Verify old system is working
curl http://localhost:5000/api/queue/barber/test/public

# 3. Notify team
# "Rolled back to previous version. Investigation ongoing."
```

### Database Rollback (if data corrupted)

```bash
# 1. Stop application
docker stop barber-app

# 2. Restore from backup
mongorestore --uri="mongodb+srv://..." \
  ./backups/pre-migration-20240115

# 3. Verify data
db.queues.count()

# 4. Restart with old version
docker run -d --name barber-app \
  barber-app:v1-queue
```

### Partial Rollback (keep data, revert code)

```bash
# 1. Keep new database schema (has backward compatibility)
# 2. Deploy old code
docker run -d --name barber-app \
  barber-app:v1-queue

# 3. Verify it works with new schema
# (New fields are ignored by old code)
```

---

## Post-Deployment Verification

### Immediate Checks (5 minutes)

```bash
✓ Health endpoint responds
✓ Public queue endpoint working
✓ No 500 errors in logs
✓ Database connection active
✓ Socket.IO connected
```

### Short-term Monitoring (1 hour)

```bash
# Monitor error rates
curl http://localhost:5000/metrics

# Check database queries
mongostat --uri="..." 5

# Monitor memory usage
docker stats barber-app

# Watch logs for warnings
docker logs -f --tail=100 barber-app
```

### Functional Verification (1 day)

```javascript
// Test each critical flow
1. Customer joins queue ✓
2. Customer gets position ✓
3. Customer leaves queue ✓
4. Barber views queue ✓
5. Barber calls next ✓
6. Barber completes service ✓
7. Socket.IO updates work ✓
8. No duplicate entries ✓
9. Positions correct ✓
10. Wait times calculated ✓
```

---

## Deployment Checklist

Pre-Deployment:
- [ ] All tests passing locally
- [ ] Database backed up
- [ ] Staging environment tested
- [ ] Team notified of maintenance window
- [ ] Rollback plan reviewed

Deployment:
- [ ] Old version backed up
- [ ] New version deployed
- [ ] Migration script run successfully
- [ ] Indexes created successfully
- [ ] Data integrity verified
- [ ] No duplicate entries found
- [ ] No position gaps found
- [ ] Traffic switched to new version

Post-Deployment:
- [ ] Health checks passing
- [ ] Logs monitored (no errors)
- [ ] API endpoints tested
- [ ] Socket.IO events working
- [ ] Customer queue joins work
- [ ] Barber operations work
- [ ] Database queries fast
- [ ] Error rate < 0.1%
- [ ] Monitoring configured
- [ ] Team notified deployment successful

---

## Communication Template

### Pre-Deployment Announcement

```
Subject: Scheduled Maintenance - Queue System Upgrade

Dear Users,

We'll be upgrading our queue management system on [DATE] from [TIME] to [TIME] UTC.

During this time:
- Queue joining may be unavailable
- Barbers cannot call next customers
- Real-time position updates will not work

We apologize for the inconvenience. The upgrade will provide:
✓ More reliable queue management
✓ Accurate position tracking
✓ Better real-time updates
✓ Improved stability

Thank you for your patience!
```

### Post-Deployment Announcement

```
Subject: Queue System Upgrade Complete ✅

The queue system has been successfully upgraded!

New features:
✅ Better duplicate prevention
✅ More accurate position tracking
✅ Faster queue operations
✅ Improved real-time updates

Everything is working normally. If you experience any issues, please contact support.
```

---

## Monitoring Dashboards

Set up monitoring for:
- Queue operation latency (target: < 100ms p95)
- Error rate (target: < 0.1%)
- Active queues (count, trend)
- Database query performance
- Socket.IO connection count
- Duplicate entry attempts (should be 0)

---

## Next Steps After Deployment

1. **Week 1:** Monitor closely, respond to issues quickly
2. **Week 2:** Analyze usage patterns, adjust schedules if needed
3. **Week 3:** Collect customer feedback, document lessons learned
4. **Week 4:** Plan next improvements based on real usage
5. **Ongoing:** Monthly review of metrics and optimization opportunities

---

## Support During Deployment

Assign roles:
- **Deployment Lead:** Executes deployment steps
- **Database Manager:** Handles migration and backups
- **Monitoring:** Watches metrics and logs
- **Communications:** Updates team and users
- **Rollback:** Stands by with rollback procedures

Have phone/chat support available during deployment window.

---

## Success Metrics

Deployment considered successful if:
- ✅ No data loss
- ✅ No service interruption > 5 minutes
- ✅ All tests passing
- ✅ Error rate < 0.1%
- ✅ Performance baseline maintained
- ✅ No customer complaints within 24 hours

---

## Conclusion

This deployment guide ensures:
1. **Zero data loss** - Comprehensive backups at every stage
2. **Minimal downtime** - Blue-green deployment option available
3. **Easy rollback** - Clear procedures if issues arise
4. **Full monitoring** - Verification at each step
5. **Team coordination** - Clear roles and communication

Follow this guide carefully, and the deployment will be smooth and successful!
