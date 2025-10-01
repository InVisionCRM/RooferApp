# Camera App Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/camera_app"

# NextAuth (Required)
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Vercel Blob (Required)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

### 3. Set Up Database

#### Option A: Using Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new Postgres database
3. Copy the `DATABASE_URL` and `DATABASE_URL_UNPOOLED`
4. Add them to `.env.local`

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL locally
# macOS: brew install postgresql@15

# Create database
createdb camera_app

# Update .env.local with local connection string
DATABASE_URL="postgresql://localhost:5432/camera_app"
```

### 4. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: Open Prisma Studio to view database
npx prisma studio
```

### 5. Set Up Vercel Blob Storage

1. Go to [Vercel Dashboard > Storage](https://vercel.com/dashboard/stores)
2. Create a new Blob store
3. Copy the `BLOB_READ_WRITE_TOKEN`
4. Add it to `.env.local`

### 6. Generate NextAuth Secret

```bash
# Generate a secure random secret
openssl rand -base64 32

# Add to .env.local as NEXTAUTH_SECRET
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📱 How It Works

### For Contractors (Camera Users)

1. **Login**: Enter phone number (no password needed)
2. **View Jobs**: See all assigned photo jobs
3. **Take Photos**: Click on a job to take photos
4. **Annotate**: Draw on photos, add tags, voice descriptions
5. **Upload**: Photos upload automatically to the lead

### For Admins (CRM Users)

1. **Assign Jobs**: Use the CRM to assign photo jobs to contractors
2. **API Endpoint**: `POST /api/photo-assignments`
   ```json
   {
     "leadId": "lead123",
     "contractorPhone": "5551234567",
     "notes": "Take before photos of the roof"
   }
   ```

---

## 🧪 Testing the App

### 1. Create a Test Lead (using Prisma Studio)

```bash
npx prisma studio
```

- Go to `Lead` model
- Create a new lead with test data
- Copy the lead ID

### 2. Create a Photo Assignment

Use the API or create directly in Prisma Studio:

```bash
# Using curl
curl -X POST http://localhost:3000/api/photo-assignments \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "your-lead-id",
    "contractorPhone": "5551234567",
    "notes": "Test assignment"
  }'
```

### 3. Login as Contractor

1. Go to http://localhost:3000/login
2. Enter phone: `5551234567`
3. You should see your assigned job

### 4. Take a Test Photo

1. Click on the job
2. Click "Take Photo"
3. Allow camera permissions
4. Take a photo
5. Add description/tags
6. Save

---

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset database (warning: deletes all data)
npx prisma db push --force-reset
```

### Authentication Issues

- Make sure `NEXTAUTH_SECRET` is set
- Make sure `NEXTAUTH_URL` matches your domain
- Check browser console for errors

### Photo Upload Issues

- Verify `BLOB_READ_WRITE_TOKEN` is correct
- Check Vercel Blob dashboard for usage/errors
- Ensure file size is under 10MB

### Camera Not Working

- Must use HTTPS in production (or localhost in dev)
- Check browser camera permissions
- Some browsers require user interaction before camera access

---

## 📦 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (use your Vercel domain)
   - `BLOB_READ_WRITE_TOKEN`

### 3. Run Post-Deploy Commands

```bash
# In Vercel project settings, add build command:
npm run build && npx prisma generate
```

---

## 🔐 Security Notes

- Phone-based auth is simple but ensure you validate phone numbers
- Consider adding PIN/code verification for production
- Photo assignments act as access control
- Contractors can only see leads assigned to them
- Use HTTPS in production (Vercel provides this automatically)

---

## 📚 API Documentation

### Photo Assignments

**Create Assignment** (Admin only)
```
POST /api/photo-assignments
Body: { leadId, contractorPhone, notes? }
```

**List All Assignments** (Admin only)
```
GET /api/photo-assignments
```

**Get Contractor's Assignments**
```
GET /api/photo-assignments/[phone]
```

### Leads

**Get Lead Details**
```
GET /api/leads/[leadId]
```

### Photos

Photos are managed via server actions in `actions/photo-actions.ts`:
- `uploadSinglePhoto(leadId, file, description)`
- `uploadPhotos(leadId, files, description)`
- `deletePhoto(photoId)`
- `updatePhoto(photoId, updates)`

---

## 🎯 Next Steps

1. **Customize UI**: Update colors, branding in `app/globals.css`
2. **Add PWA**: Implement service worker for offline support
3. **Add Analytics**: Track photo uploads, usage metrics
4. **Add Notifications**: Notify contractors of new assignments
5. **Add Photo Categories**: Extend photo tagging system

---

## 🆘 Need Help?

- Check browser console for errors
- Check server logs: `npm run dev`
- View database: `npx prisma studio`
- Check Vercel logs (if deployed)

For more details, see [CAMERA_APP_README.md](./CAMERA_APP_README.md)

