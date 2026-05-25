# Queue Cleanup & Maintenance Setup

## Overview
The queue system requires periodic cleanup to maintain performance and data integrity. This guide shows how to set up automated cleanup jobs.

---

## Setup Options

### Option 1: Node-Cron (Recommended for Development)

Install the package:
```bash
cd server
npm install node-cron
```

Create `server/jobs/queueCleanup.js`:
```javascript
import cron from 'node-cron';
import axios from 'axios';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.ADMIN_CLEANUP_TOKEN; // Set in .env

/**
 * Cleanup completed queue entries (older than 24 hours)
 * Schedule: Daily at 2 AM
 */
export const scheduleCleanupCompleted = () => {
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🧹 Starting cleanup of completed entries...');
      const response = await axios.post(
        `${API_BASE}/queue/admin/cleanup-completed`,
        {},
        {
          headers: {
            Authorization: `Bearer ${ADMIN_TOKEN}`
          }
        }
      );
      console.log('✅ Cleanup completed:', response.data.message);
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  });
};

/**
 * Cleanup stale waiting entries (older than 2 hours)
 * Schedule: Every 30 minutes during business hours (8 AM - 8 PM)
 */
export const scheduleCleanupStale = () => {
  // Run every 30 minutes, but only between 8 AM and 8 PM
  cron.schedule('*/30 8-20 * * *', async () => {
    try {
      console.log('🧹 Starting cleanup of stale entries...');
      const response = await axios.post(
        `${API_BASE}/queue/admin/cleanup-stale`,
        {},
        {
          headers: {
            Authorization: `Bearer ${ADMIN_TOKEN}`
          }
        }
      );
      console.log('✅ Stale cleanup completed:', response.data.message);
    } catch (error) {
      console.error('❌ Stale cleanup error:', error.message);
    }
  });
};

/**
 * Initialize all cleanup jobs
 */
export const initializeCleanupJobs = () => {
  if (!ADMIN_TOKEN) {
    console.warn('⚠️ ADMIN_CLEANUP_TOKEN not set. Cleanup jobs disabled.');
    return;
  }
  
  console.log('⏰ Initializing cleanup jobs...');
  scheduleCleanupCompleted();
  scheduleCleanupStale();
  console.log('✅ Cleanup jobs initialized');
};
```

Update `server/server.js`:
```javascript
import { initializeCleanupJobs } from './jobs/queueCleanup.js';

// ... existing setup ...

// Initialize cleanup jobs
initializeCleanupJobs();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

Add to `.env`:
```env
ADMIN_CLEANUP_TOKEN=<strong-secret-token>
API_BASE_URL=http://localhost:5000/api
```

---

### Option 2: AWS Lambda + CloudWatch (Production)

Create Lambda function (Node.js 18):
```javascript
import axios from 'axios';

const API_BASE = process.env.API_BASE_URL;
const ADMIN_TOKEN = process.env.ADMIN_CLEANUP_TOKEN;

export const handler = async (event) => {
  try {
    const scheduleType = event.scheduleType; // 'completed' or 'stale'
    
    if (scheduleType === 'completed') {
      const response = await axios.post(
        `${API_BASE}/queue/admin/cleanup-completed`,
        {},
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      );
      return {
        statusCode: 200,
        body: JSON.stringify(response.data)
      };
    } else if (scheduleType === 'stale') {
      const response = await axios.post(
        `${API_BASE}/queue/admin/cleanup-stale`,
        {},
        { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } }
      );
      return {
        statusCode: 200,
        body: JSON.stringify(response.data)
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

CloudWatch Events:
1. Create EventBridge rule: "Queue Cleanup - Completed"
   - Schedule: `cron(0 2 * * ? *)` (2 AM UTC daily)
   - Target: Lambda function
   - Input: `{ "scheduleType": "completed" }`

2. Create EventBridge rule: "Queue Cleanup - Stale"
   - Schedule: `cron(*/30 8-20 * * ? *)` (Every 30 mins, 8 AM-8 PM)
   - Target: Lambda function
   - Input: `{ "scheduleType": "stale" }`

---

### Option 3: Manual Trigger via Admin Dashboard

Add button to admin panel:
```javascript
// In admin dashboard component
import { bookingAPI } from '../../services/api';

const triggerCleanup = async (type) => {
  try {
    if (type === 'completed') {
      const response = await axios.post(
        '/api/queue/admin/cleanup-completed',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Cleaned:', response.data.message);
    } else if (type === 'stale') {
      const response = await axios.post(
        '/api/queue/admin/cleanup-stale',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ Cleaned:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

return (
  <div className="admin-controls">
    <button onClick={() => triggerCleanup('completed')}>
      Clean Completed (24h+)
    </button>
    <button onClick={() => triggerCleanup('stale')}>
      Clean Stale (2h+)
    </button>
  </div>
);
```

---

## Cleanup Job Details

### cleanupCompletedEntries

**Purpose:** Remove old completed entries to prevent database bloat

**What it does:**
- Finds all entries with status: "completed" AND completedAt > 24 hours ago
- Soft delete or hard delete (configurable)
- Returns count of deleted entries

**Recommended frequency:** Daily (2 AM)

**Database impact:** Removes 10-50 entries daily per salon

### cleanupStaleEntries

**Purpose:** Cancel entries for no-shows (customers who didn't show up)

**What it does:**
- Finds entries with status: "waiting" AND joinedAt > 2 hours ago
- Updates status to "cancelled"
- Sets cancelReason: "no-show"
- Returns count of cancelled entries

**Recommended frequency:** Every 30 minutes during business hours

**Database impact:** Cancels 0-10 entries per check

---

## Monitoring Cleanup Jobs

### Health Check Endpoint

Add to `server/routes/healthRoutes.js`:
```javascript
router.get('/queue-cleanup-status', async (req, res) => {
  try {
    // Check last cleanup run times
    const cleanupLog = await CleanupLog.findOne().sort({ createdAt: -1 });
    
    const status = {
      lastCompleted: cleanupLog?.completedAt || null,
      lastStale: cleanupLog?.staleAt || null,
      completedCount: cleanupLog?.completedCount || 0,
      staleCount: cleanupLog?.staleCount || 0,
      health: cleanupLog ? 'healthy' : 'no runs yet'
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Logging Cleanup Results

Update controller functions:
```javascript
import CleanupLog from '../models/CleanupLog.js';

export const cleanupCompletedEntries = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find and delete/archive
    const result = await Queue.deleteMany(
      { status: 'completed', completedAt: { $lt: new Date(Date.now() - 24*60*60*1000) } },
      { session }
    );
    
    // Log the cleanup
    await CleanupLog.create([{
      type: 'completed',
      count: result.deletedCount,
      timestamp: new Date()
    }], { session });
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: `Cleaned ${result.deletedCount} completed entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
```

---

## Troubleshooting

### Jobs not running
1. Check ADMIN_CLEANUP_TOKEN is set
2. Verify network connectivity from job runner to API
3. Check logs for error messages
4. Verify cron schedule syntax

### Too many entries being deleted
1. Adjust time thresholds (24h, 2h)
2. Add safety checks (max entries per run)
3. Implement soft deletes instead of hard deletes

### Performance impact
1. Run cleanup during off-peak hours
2. Batch deletions in chunks
3. Use background jobs with lower priority

---

## Safety Measures

**Before deploying cleanup jobs:**

✓ Backup database
✓ Test cleanup functions on staging environment
✓ Verify deletion queries with dry-run first
✓ Set up monitoring and alerting
✓ Have rollback plan if issues occur

**In cleanup functions:**
```javascript
// Always verify deletion criteria
const dryRun = true;
if (dryRun) {
  const entries = await Queue.find(deletionCriteria);
  console.log('Would delete:', entries.length, 'entries');
  return;
}
```

---

## Implementation Checklist

For Option 1 (Node-Cron):
- [ ] Install node-cron package
- [ ] Create queueCleanup.js file
- [ ] Update server.js with cleanup initialization
- [ ] Add ADMIN_CLEANUP_TOKEN to .env
- [ ] Test cleanup functions manually
- [ ] Monitor logs during first week
- [ ] Adjust schedules if needed

For Option 2 (AWS Lambda):
- [ ] Create Lambda function
- [ ] Configure environment variables
- [ ] Create EventBridge rules
- [ ] Test Lambda execution
- [ ] Set up CloudWatch alarms
- [ ] Configure logging and retention

For Option 3 (Manual):
- [ ] Add admin dashboard section
- [ ] Add cleanup trigger buttons
- [ ] Test manual cleanup
- [ ] Document for admin users

---

## Expected Results

After cleanup jobs are running:

**Database Health:**
- Completed entries < 1000 (maintained at clean level)
- Stale entries < 10 (quick removal)
- Active queue stays at ~100 entries per barber

**Performance:**
- Queue queries faster (smaller dataset)
- Indexes more efficient
- Backup sizes manageable

**Data Quality:**
- No orphaned entries
- Clean audit trail
- Accurate queue statistics
