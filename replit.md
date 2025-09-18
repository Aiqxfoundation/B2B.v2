# BIT2BLOCK Mining Platform

## Overview

A full-stack Bitcoin mining simulation platform built with React, Express, and PostgreSQL. The application allows users to simulate cryptocurrency mining operations with features like deposit management, hash power purchasing, mining rewards distribution, and administrative controls. The platform includes a sophisticated mining simulation system that automatically generates blocks and distributes rewards based on user hash power contributions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **Wouter**: Lightweight client-side routing for navigation
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **Shadcn/ui**: Component library built on Radix UI primitives with Tailwind CSS styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Styling**: Tailwind CSS with custom design tokens and dark theme support

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript support
- **Session-based Authentication**: Passport.js with local strategy and secure password hashing using scrypt
- **Middleware Pattern**: Request logging, error handling, and authentication middleware
- **Mining Simulation**: Cron job-based system for automated block generation and reward distribution
- **Storage Layer**: Abstracted database operations through a storage interface

### Database Design
- **PostgreSQL**: Primary database with Drizzle ORM for type-safe database operations
- **Schema Structure**:
  - Users table with balance tracking (USDT, hash power, GBTC, unclaimed rewards)
  - Deposits/withdrawals with approval workflow and transaction tracking
  - Mining blocks with reward distribution history
  - System settings for configurable parameters
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple

### Authentication & Authorization
- **Session Management**: Secure session handling with HttpOnly cookies
- **Role-based Access**: Admin and regular user roles with protected routes
- **Password Security**: Async scrypt hashing with salt for secure password storage
- **Protected Routes**: Client-side route protection with loading states and redirects

### Mining System Architecture
- **Automated Block Generation**: Cron jobs generate new blocks every 10 minutes
- **Reward Distribution**: Proportional reward distribution based on user hash power
- **System Settings**: Configurable block rewards and mining parameters
- **Real-time Updates**: Automatic balance updates and unclaimed reward tracking

### Build & Development
- **Vite**: Fast development server and optimized production builds
- **TypeScript**: Full type safety across frontend, backend, and shared schemas
- **Path Aliases**: Organized imports with @ and @shared path mapping
- **Hot Reload**: Development environment with HMR and error overlays

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Database Migrations**: Drizzle Kit for schema management and migrations

### UI & Styling
- **Radix UI**: Accessible component primitives for complex UI components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide Icons**: Consistent icon library for UI elements
- **Font Assets**: Google Fonts integration for typography

### Backend Services
- **Session Management**: PostgreSQL session store for scalable session handling
- **Cron Jobs**: Node-cron for scheduled mining operations
- **Password Security**: Built-in Node.js crypto module for secure hashing

### Development Tools
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **TypeScript**: Type checking and compilation across the entire stack
- **Replit Integration**: Development environment optimizations and debugging tools