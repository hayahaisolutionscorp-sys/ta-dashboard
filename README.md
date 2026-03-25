# TA Dashboard

A modern Travel Agency Dashboard for the Ayahay maritime booking system. This dashboard provides travel agencies with tools to manage ferry bookings, routes, passengers, and revenue.

## Features

- 🔐 **Secure Authentication** - Login system with JWT tokens and session management
- 📊 **Dashboard Overview** - Real-time statistics on bookings, routes, passengers, and revenue
- 🚢 **Trip Booking** - Manage ferry trip bookings
- 🗺️ **Route Selection** - View and manage available routes
- 🎫 **Ticket Management** - Handle ticket operations
- 📱 **Responsive Design** - Mobile-friendly interface with sidebar navigation

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Tabler Icons

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- pnpm (recommended package manager)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_AYAHAY_API_URL=your_api_url_here
```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3003](http://localhost:3003) with your browser to see the application.

### Build

Build the application for production:

```bash
pnpm build
```

### Production

Start the production server:

```bash
pnpm start
```

The application will run on [http://localhost:3003](http://localhost:3003).

## Project Structure

```
ta-dashboard/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages (login)
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components (sidebar, header)
│   └── ui/               # UI components (shadcn/ui)
├── constants/            # API configuration and constants
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and helpers
│   ├── stores/          # Zustand state stores
│   └── validators/      # Zod validation schemas
├── services/             # API service layer
└── public/               # Static assets
```

## Available Scripts

- `pnpm dev` - Start development server on port 3003
- `pnpm build` - Build for production
- `pnpm start` - Start production server on port 3003
- `pnpm lint` - Run ESLint

## License

Private project - All rights reserved.
