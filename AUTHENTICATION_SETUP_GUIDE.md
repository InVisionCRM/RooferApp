# 🔐 Authentication Setup & Testing Guide

## How Authentication Works

The camera app uses **phone-based authentication tied to job assignments**:

1. **Admin** assigns a photo job to a contractor's phone number
2. **Contractor** logs in with their phone number
3. **System** checks if they have active assignments
4. If yes → Login succeeds + show their jobs
5. If no → Login fails with error message

---

## 📋 Step-by-Step Setup

### Step 1: Verify Database Connection

The error you're seeing suggests a database permission issue. Let's test:

```bash
# In terminal, run:
npx prisma db pull
```

If this works, your database connection is fine. If not, check your DATABASE_URL.

### Step 2: Create a Test Lead

**In Prisma Studio** (http://localhost:5555):

1. Go to **`Lead`** table
2. Click **"Add record"**
3. Fill in minimum fields:
   ```
   id: (auto-generated)
   firstName: John
   lastName: Doe
   address: 123 Main St
   claimNumber: CLAIM-001
   status: in_progress
   ```
4. Click **Save**
5. **Copy the `id`** that was generated (you'll need it next)

### Step 3: Create Photo Assignment

Still in Prisma Studio:

1. Go to **`PhotoAssignment`** table
2. Click **"Add record"**
3. Fill in:
   ```
   id: (leave blank - auto-generated)
   leadId: <paste-the-lead-id-from-step-2>
   contractorPhone: 5551234567  ← Just numbers, no formatting
   assignedBy: admin
   notes: Test - take before photos
   completedAt: (leave blank)
   ```
4. Click **Save**

### Step 4: Restart Development Server

Kill the current dev server (Ctrl+C in terminal) and restart:

```bash
npm run dev
```

This ensures the new .env changes are loaded.

### Step 5: Test Login

1. Open **http://localhost:3002** in your browser
2. Should redirect to `/login`
3. Enter phone number: **5551234567** (or type `(555) 123-4567`)
4. Click **"Sign In"**
5. Should authenticate and show your job list!

---

## 🧪 Testing Different Scenarios

### ✅ Successful Login
- Phone: `5551234567` (has assignment)
- Result: Login succeeds → Shows job list

### ❌ Failed Login (No Assignments)
- Phone: `9999999999` (no assignment)
- Result: Error: "No active photo assignments found"

### ❌ Invalid Phone
- Phone: `123` (too short)
- Result: Button disabled (validation)

---

## 🔧 Troubleshooting

### Error: "User was denied access on the database"

**Solution 1: Check Database Permissions**
```bash
# Test Prisma connection
npx prisma studio
# If this works, connection is fine
```

**Solution 2: Use Unpooled Connection**

In `.env`, try the unpooled URL:
```env
DATABASE_URL=postgresql://neondb_owner:npg_Wzb8MkjDI6lB@ep-winter-frost-a5yzczxj.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Then restart:
```bash
npm run dev
```

**Solution 3: Regenerate Prisma Client**
```bash
npx prisma generate
npm run dev
```

### Error: "No active photo assignments found"

This is **expected** if:
- You haven't created a PhotoAssignment yet
- The phone number doesn't match exactly
- The assignment has a `completedAt` date (means it's finished)

**Fix:** Create a PhotoAssignment in Prisma Studio (see Step 3 above)

### Login page loads but nothing happens

Check browser console (F12) for errors. Common issues:
- NEXTAUTH_URL doesn't match your actual URL
- NEXTAUTH_SECRET is missing
- Network error calling `/api/auth/callback/phone`

---

## 📱 Complete Test Flow

### For Admin (You):
1. ✅ Open Prisma Studio → http://localhost:5555
2. ✅ Create a Lead
3. ✅ Create PhotoAssignment linking Lead + Phone
4. ✅ Tell contractor their phone number to use

### For Contractor (Testing):
1. ✅ Open http://localhost:3002
2. ✅ Enter phone number
3. ✅ Click Sign In
4. ✅ See job list
5. ✅ Click on a job
6. ✅ Take photos
7. ✅ Sign out when done

---

## 🔑 Key Files

**Authentication Logic:** `lib/auth.ts`
```typescript
// Checks if contractor has active assignments
const activeAssignments = await prisma.photoAssignment.findFirst({
  where: {
    contractorPhone: normalizedPhone,
    completedAt: null, // Only active assignments
  }
})
```

**Login Page:** `app/login/page.tsx`
```typescript
// Calls NextAuth with phone number
await signIn("phone", {
  phone: phoneDigits,
  redirect: false,
})
```

**Job List:** `app/page.tsx`
```typescript
// Fetches contractor's jobs
fetch(`/api/photo-assignments/${phone}`)
```

---

## 📊 Database Tables

### PhotoAssignment
```
id              (auto)
leadId          → Links to Lead table
contractorPhone → 5551234567 (digits only)
assignedBy      → Who assigned it
notes           → Instructions for contractor
completedAt     → NULL = active, DATE = completed
```

### User (Created Automatically)
```
When contractor logs in, if user doesn't exist:
- Creates User with their phone number
- Sets role = CONTRACTOR
- Creates JWT session
```

---

## ⚡ Quick Reference

**Port:** http://localhost:3002  
**Prisma Studio:** http://localhost:5555  
**Login Path:** `/login`  
**Jobs Path:** `/` (home page)  

**Test Phone:** `5551234567`  
**Format:** System accepts any format, normalizes to digits only  

---

## 🎯 Next Steps After Login Works

1. ✅ Login successful
2. ✅ See job list
3. 🔜 Build job detail page (`/jobs/[leadId]`)
4. 🔜 Integrate camera (already built!)
5. 🔜 Test photo upload end-to-end

---

**Need Help?**
- Check browser console (F12)
- Check terminal for errors
- Verify Prisma Studio shows your test data
- Make sure dev server restarted after .env changes

**The login flow is: Admin assigns → Contractor logs in → See jobs → Take photos!** 📸

