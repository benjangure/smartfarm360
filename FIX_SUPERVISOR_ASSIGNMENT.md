# Fix Supervisor Assignment Issue

## Problem
When logging in as a supervisor, you see: "You have not been assigned to a farm yet. Please contact your administrator."

## Why This Happens
Supervisors must be assigned to a farm before they can use the system. This is by design - supervisors manage workers and tasks for a specific farm.

## Solution Options

### Option 1: Assign Supervisor via Farm Owner (Recommended)

This is the proper workflow:

1. **Login as Farm Owner**
2. **Go to "Supervisor Assignments"** (in the sidebar)
3. **Select a farm** from your farms
4. **Assign the supervisor** to that farm
5. **Supervisor can now login** and access the system

### Option 2: Assign Supervisor via Database (Quick Fix)

If you need to quickly assign a supervisor for testing:

#### Step 1: Check Current Status
Run this SQL query:
```sql
-- Check all supervisors
SELECT 
    u.id,
    u.username,
    u.first_name,
    u.last_name,
    u.assigned_farm_id,
    f.name as farm_name
FROM users u
LEFT JOIN farms f ON u.assigned_farm_id = f.id
WHERE u.role = 'SUPERVISOR';
```

#### Step 2: Check Available Farms
```sql
-- Check all farms
SELECT 
    f.id,
    f.name,
    f.location,
    u.username as owner_username
FROM farms f
LEFT JOIN users u ON f.owner_id = u.id;
```

#### Step 3: Assign Supervisor to Farm
```sql
-- Replace [SUPERVISOR_ID] with the supervisor's ID
-- Replace [FARM_ID] with the farm's ID
UPDATE users 
SET assigned_farm_id = [FARM_ID] 
WHERE id = [SUPERVISOR_ID];

-- Example:
-- UPDATE users SET assigned_farm_id = 1 WHERE id = 2;
```

#### Step 4: Also Add to Junction Table (Important!)
```sql
-- Add to supervisor_farms junction table
INSERT INTO supervisor_farms (supervisor_id, farm_id)
VALUES ([SUPERVISOR_ID], [FARM_ID]);

-- Example:
-- INSERT INTO supervisor_farms (supervisor_id, farm_id) VALUES (2, 1);
```

### Option 3: Create Test Data with Proper Assignment

If you're setting up test data, here's a complete script:

```sql
-- 1. Create a farm owner
INSERT INTO users (username, email, password, first_name, last_name, phone_number, role, is_active, must_change_password, created_at, updated_at)
VALUES ('john.owner', 'owner@test.com', '$2a$10$...', 'John', 'Owner', '1234567890', 'FARM_OWNER', true, false, NOW(), NOW());

SET @owner_id = LAST_INSERT_ID();

-- 2. Create a farm
INSERT INTO farms (name, location, size, type, owner_id, created_at, updated_at)
VALUES ('Test Farm', 'Test Location', '100 acres', 'Mixed', @owner_id, NOW(), NOW());

SET @farm_id = LAST_INSERT_ID();

-- 3. Create a supervisor
INSERT INTO users (username, email, password, first_name, last_name, phone_number, role, is_active, must_change_password, assigned_farm_id, created_at, updated_at)
VALUES ('jane.supervisor', 'supervisor@test.com', '$2a$10$...', 'Jane', 'Supervisor', '0987654321', 'SUPERVISOR', true, false, @farm_id, NOW(), NOW());

SET @supervisor_id = LAST_INSERT_ID();

-- 4. Add to junction table
INSERT INTO supervisor_farms (supervisor_id, farm_id)
VALUES (@supervisor_id, @farm_id);

-- 5. Create a worker
INSERT INTO users (username, email, password, first_name, last_name, phone_number, role, is_active, must_change_password, assigned_farm_id, created_at, updated_at)
VALUES ('bob.worker', 'worker@test.com', '$2a$10$...', 'Bob', 'Worker', '1122334455', 'WORKER', true, false, @farm_id, NOW(), NOW());
```

## Verification

After assigning the supervisor, verify with:

```sql
-- Check the assignment
SELECT 
    u.id,
    u.username,
    u.role,
    u.assigned_farm_id,
    f.name as farm_name,
    f.location
FROM users u
LEFT JOIN farms f ON u.assigned_farm_id = f.id
WHERE u.username = 'your_supervisor_username';
```

You should see:
- `assigned_farm_id`: Should have a value (not NULL)
- `farm_name`: Should show the farm name
- `farm_location`: Should show the farm location

## Common Issues

### Issue 1: Supervisor has assigned_farm_id but still sees error
**Solution:** Check if the farm exists and is active
```sql
SELECT * FROM farms WHERE id = [FARM_ID];
```

### Issue 2: Supervisor assigned but can't see workers
**Solution:** Make sure workers are also assigned to the same farm
```sql
UPDATE users 
SET assigned_farm_id = [FARM_ID] 
WHERE role = 'WORKER' AND id = [WORKER_ID];
```

### Issue 3: Assignment doesn't persist after login
**Solution:** Clear browser cache and JWT token, then login again

## Proper Workflow (Production)

1. **Farm Owner creates account** (via application or system admin)
2. **Farm Owner creates farms** (via "My Farms" page)
3. **Farm Owner creates supervisors** (via "Add Supervisor" page)
4. **Farm Owner assigns supervisors to farms** (via "Supervisor Assignments" page)
5. **Supervisor logs in** and can now access the system
6. **Supervisor creates workers** (via "Add Worker" page)
7. **Workers are automatically assigned** to the supervisor's farm

## Quick Test Script

Run this to quickly set up a complete test environment:

```sql
-- Use the check-supervisor-assignment.sql file to see current status
-- Then use the appropriate UPDATE or INSERT statements above
```

## Need Help?

If you're still seeing the error after assignment:
1. Check the browser console for errors
2. Verify the JWT token contains the farm information
3. Check backend logs for authentication issues
4. Ensure the database connection is working
5. Try logging out and logging in again

## Summary

The message "You have not been assigned to a farm yet" is **correct behavior** when a supervisor hasn't been assigned. To fix:

1. **Best way:** Use the Farm Owner's "Supervisor Assignments" page
2. **Quick way:** Run SQL UPDATE to assign the supervisor to a farm
3. **Remember:** Also add to `supervisor_farms` junction table

Once assigned, the supervisor will have full access to manage workers and tasks for that farm.
