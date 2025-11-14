# Delivery Route Management System

A comprehensive full-stack delivery management platform built with Next.js 16, Supabase, and HERE Maps API. This system enables multi-tenant route optimization, driver management, proof of delivery (POD) collection, and real-time dispatch monitoring.

## Features

### Admin Dashboard
- **Order Management**: Import orders via CSV, manual entry, or API
- **Route Optimization**: Automated route planning using HERE Maps Tour Planning API
- **Driver Management**: Assign drivers to routes, track active/inactive status
- **Multi-Tenancy**: Complete data isolation between admin accounts
- **Dispatch Monitor**: Real-time route tracking and driver position monitoring
- **Bulk Operations**: Batch assign drivers, delete routes, manage orders at scale
- **Proof of Delivery**: Email notifications with photos and signatures

### Driver App
- **Route Navigation**: Turn-by-turn directions with HERE Maps
- **Stop Management**: Mark deliveries as complete or failed with notes
- **POD Collection**: Capture signatures and photos for each delivery
- **Real-time Updates**: Live position tracking and status updates
- **Offline Support**: Continue working with cached data when offline

### System Features
- **Geographic Clustering**: Intelligent route grouping by location
- **Flexible Time Constraints**: Optional shift time limits for route planning
- **Driver-Optional Routing**: Create routes without immediate driver assignment
- **Geocoding**: Automatic address validation and coordinate resolution
- **Rate Limiting**: Intelligent API request throttling to avoid service limits
- **Multi-Tenancy**: Complete data isolation with admin-level permissions

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19.2, TypeScript
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth
- **Maps & Routing**: HERE Maps API (Geocoding, Routing, Tour Planning)
- **File Storage**: Vercel Blob
- **Email**: SendGrid
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Deployment**: Vercel

## Prerequisites

Before deploying, ensure you have:

1. **Vercel Account** - For hosting and deployment
2. **Supabase Account** - For database and authentication
3. **HERE Maps API Key** - For geocoding and route optimization
4. **SendGrid API Key** - For POD email notifications (optional)
5. **Node.js 18+** - For local development

## Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <your-repo-url>
cd <project-directory>
npm install
\`\`\`

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Required variables:
- Supabase credentials (URL, keys)
- HERE Maps API key
- Vercel Blob token (for production)
- SendGrid API key (optional)

### 3. Set Up Database

Run the database migrations in order:

\`\`\`bash
# Execute each SQL file in the scripts/ directory in numerical order
# Or use the Supabase SQL editor to run them manually
\`\`\`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
├── app/
│   ├── admin/              # Admin dashboard pages
│   │   ├── dispatch/       # Real-time dispatch monitor
│   │   ├── drivers/        # Driver management
│   │   ├── orders/         # Order management
│   │   └── routes/         # Route planning and optimization
│   ├── driver/             # Driver mobile app
│   ├── auth/               # Authentication pages
│   └── api/                # API routes
├── components/             # Reusable UI components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── here/               # HERE Maps API integrations
│   ├── supabase/           # Supabase clients and utilities
│   └── mail/               # Email sending utilities
├── scripts/                # Database migration scripts
└── public/                 # Static assets
\`\`\`

## Environment Variables

See `.env.example` for a complete list of required environment variables.

### Core Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- `HERE_API_KEY` - HERE Maps API key
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `SENDGRID_API_KEY` - SendGrid API key (optional)

### Feature Flags

- `NEXT_PUBLIC_ENABLE_POD_EMAIL` - Enable/disable POD email notifications
- `NEXT_PUBLIC_ENABLE_ROUTE_METRICS` - Enable/disable route analytics
- `NEXT_PUBLIC_ENABLE_DISPATCH_MAP` - Enable/disable dispatch map view

## Database Schema

The application uses the following main tables:

- **profiles** - User accounts (admins and drivers)
- **orders** - Delivery orders with addresses and status
- **routes** - Optimized delivery routes
- **delivery_stops** - Individual stops on a route
- **driver_positions** - Real-time driver location tracking
- **pod_emails** - Proof of delivery email tracking

All tables have Row Level Security (RLS) enabled with multi-tenancy support.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

\`\`\`bash
vercel --prod
\`\`\`

### Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Run database migrations via `/api/setup-database`
- [ ] Test admin login and signup
- [ ] Test driver login
- [ ] Create test orders and routes
- [ ] Verify HERE Maps integration
- [ ] Test POD email delivery
- [ ] Check dispatch monitor real-time updates

## API Endpoints

### Public APIs
- `POST /api/geocode` - Geocode addresses
- `POST /api/setup-database` - Initialize database (one-time)

### Admin APIs
- `POST /api/run-migration` - Run database migrations

### Driver APIs
- `POST /api/driver/deliver` - Mark delivery as complete
- `POST /api/driver/fail` - Mark delivery as failed
- `POST /api/driver-positions` - Update driver location

## Security

- **Row Level Security** - All database tables have RLS policies
- **Multi-Tenancy** - Complete data isolation between admin accounts
- **Authentication** - Supabase Auth with email/password
- **Authorization** - Role-based access control (admin vs driver)
- **API Security** - Server-side validation and authentication checks

## Performance Optimizations

- **Batch Processing** - Orders and routes processed in batches
- **Rate Limiting** - Intelligent throttling of HERE Maps API calls
- **Caching** - Next.js automatic caching with revalidation
- **Optimistic Updates** - Client-side optimistic UI updates
- **Lazy Loading** - Code splitting and dynamic imports

## Troubleshooting

### Common Issues

**Routes not creating**
- Check HERE Maps API key and rate limits
- Verify orders have valid coordinates
- Check browser console for errors

**Driver can't see routes**
- Verify driver is marked as active
- Check driver is assigned to the route
- Verify driver account is not deleted

**POD emails not sending**
- Check SendGrid API key configuration
- Verify `NEXT_PUBLIC_ENABLE_POD_EMAIL=true`
- Check email addresses are valid

**Dispatch map not loading**
- Verify HERE Maps API key
- Check `NEXT_PUBLIC_ENABLE_DISPATCH_MAP=true`
- Open browser console for errors

## Support & Maintenance

See `MAINTENANCE.md` for detailed maintenance procedures including:
- Database backup and restore
- Performance monitoring
- Scaling guidelines
- Security updates

## Super Admin System

The platform includes a comprehensive super admin system with complete control over all aspects of the application.

### Quick Access

- **Super Admin Dashboard**: `/super-admin`
- **Setup Super Admin**: `/setup-super-admin` (first-time activation)

### Capabilities

As a super admin, you have full "god mode" access to:

1. **Admin Management** - View, suspend, restore, and delete all admin accounts
2. **Driver Management** - Manage all drivers across all admins
3. **Order Management** - View and modify orders system-wide
4. **Route Management** - Reassign routes and manage deliveries globally
5. **Audit Logging** - Track all super admin actions for compliance
6. **System Health** - Monitor database statistics and performance

### Setup Instructions

1. Set environment variable: `NEXT_PUBLIC_SUPER_ADMIN_EMAIL=your@email.com`
2. Create account with that email via signup
3. Navigate to `/setup-super-admin` and click "Activate Super Admin"
4. Access super admin dashboard at `/super-admin`

For detailed documentation, see [SUPER_ADMIN_GUIDE.md](./SUPER_ADMIN_GUIDE.md)

## License

Proprietary - All rights reserved
