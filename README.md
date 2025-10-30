# 🚀 PMPRG - Project Management & Resource Planning System

A comprehensive project management and resource planning system built for Progressio Solutions.

## 🔐 Authentication

The application includes a simple authentication system:

- **Username**: `admin`
- **Password**: `pmprg2024`

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pmprg
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npx prisma migrate dev
   
   # Seed the database
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🌐 Vercel Deployment

### Step 1: Database Setup

1. **Create a PostgreSQL Database**
   - Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (recommended)
   - Or any cloud PostgreSQL provider (AWS RDS, Google Cloud SQL, etc.)

2. **Get your connection string** in the format:
   ```
   postgresql://username:password@hostname:port/database_name
   ```

### Step 2: Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select "Next.js" framework preset

3. **Environment Variables**
   Set these in Vercel dashboard:
   ```
   DATABASE_URL=your_postgresql_connection_string
   NEXTAUTH_SECRET=generate_a_secure_random_string
   NEXTAUTH_URL=https://your-app-name.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your application

### Step 3: Database Migration

After deployment, run migrations:

```bash
# Option 1: Using Vercel CLI
npx vercel env pull .env.local
npx prisma migrate deploy

# Option 2: Using your local machine with production DATABASE_URL
DATABASE_URL="your_production_url" npx prisma migrate deploy
DATABASE_URL="your_production_url" npx prisma db seed
```

## 📋 Features

### ✅ Implemented Features

- **🔐 Authentication System** - Simple login with static credentials
- **⚙️ Master Data Management** - Project Types, Tiers, Blocks, Deliverables, Resources, Skills
- **🏗️ Project Creation Wizard** - 6-step guided project creation with auto-planning
- **📅 Scheduling Engine** - Strict start and priority fit modes
- **👥 Resource Management** - Allocation tracking and utilization analytics
- **💰 Budget & Cost Tracking** - Variance analysis and financial reporting
- **📊 KPI Dashboard** - Real-time performance metrics and analytics
- **📈 Timeline Visualization** - Interactive Gantt charts and project timelines

### 🔧 System Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Authentication**: Custom implementation with localStorage
- **Validation**: Zod schemas

## 🚦 API Endpoints

### Master Data
- `GET/POST /api/master-data/project-types`
- `GET/POST /api/master-data/tiers`
- `GET/POST /api/master-data/blocks`
- `GET/POST /api/master-data/deliverables`
- `GET/POST /api/master-data/skills`

### Projects
- `GET/POST /api/projects`
- `POST /api/projects/preview`

### Resources
- `GET/POST /api/resources`
- `GET /api/resources/capacity`
- `GET/POST /api/resources/allocations`
- `GET /api/resources/availability`

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with sample data
npm run db:studio        # Open Prisma Studio

# Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checks
npm run quality:gates    # Run all quality checks
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── master-data/    # Master data management
│   ├── projects/       # Project management
│   ├── resources/      # Resource management
│   ├── schedule/       # Timeline and scheduling
│   ├── budget/         # Budget tracking
│   └── dashboard/      # Analytics dashboard
├── components/         # React components
│   ├── auth/          # Authentication components
│   ├── ui/            # UI component library
│   └── [modules]/     # Feature-specific components
├── lib/               # Utilities and configurations
└── types/             # TypeScript type definitions
```

## 🎯 Login Credentials

For demonstration purposes, use these credentials:

- **Username**: `admin`
- **Password**: `pmprg2024`

## 📞 Support

For support or questions about deployment, please contact the development team.

---

**© 2024 Progressio Solutions. All rights reserved.**