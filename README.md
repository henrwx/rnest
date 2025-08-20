# Food Trucks App

## Problem Statement

Build a web application that helps users find food trucks in San Francisco using the city's Mobile Food Facility Permit dataset. Users should be able to search by name, address, and find nearby trucks based on location.

## Overview

This is a full-stack monorepo application built with **Nx**, **NestJS**, **React**, **Prisma**, and **PostgreSQL** that provides comprehensive access to San Francisco's [Mobile Food Facility Permit dataset](https://data.sfgov.org/Economy-and-Community/Mobile-Food-Facility-Permit/rqzj-sfat/about_data). 

The application currently features a fully functional REST API backend that enables users to search for food trucks by name or address, discover the 5 nearest trucks to any location, and retrieve detailed facility information. The proximity search leverages Google's Routes API for accurate distance calculations, ensuring users get precise location-based results.

A key feature is the automated data synchronization tool that keeps the local database current with San Francisco's official dataset, ensuring users always have access to the latest permit and location information. While the React frontend remains as a `TODO`, the robust API foundation is ready to power rich user experiences including interactive maps, real-time search, and location-based discovery features.

For additional technical insights and architectural patterns, refer to the [README](https://github.com/henrwx/anest) of my other **Nx** project.

## Architecture

```
apps/
├── api/                   # NestJS backend with REST endpoints
├── api-e2e/               # End-to-end API tests
└── web/                   # React frontend (planned)
libs/
├── shared/
│   ├── types/             # Common TypeScript interfaces
│   ├── constants/         # Shared constants
│   └── utils/             # Shared utility functions
├── api/
│   ├── database/          # Prisma client and configurations
│   └── external/          # External service integrations, e.g. Google Maps API
└── web/                   # Frontend libraries (planned)
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page-level components
│   └── services/          # Frontend service layer
prisma/
├── schema.prisma          # Database schema definitions
└── migrations/            # Database migration files
tools/
└── data-import/           # SF data synchronization utility
```

## API Endpoints

| Endpoint | Description | Parameters |
|----------|-------------|------------|
| `GET /api/food-trucks/search` | Search by name | `name`, `status`, `limit`, `offset` |
| `GET /api/food-trucks/search-by-address` | Search by address | `address`, `status`, `limit`, `offset` |
| `GET /api/food-trucks/nearby` | Find nearby trucks | `lat`, `long`, `radius`, `status`, `limit` |

## Design Decisions

**Monorepo Architecture**: I chose **Nx** to consolidate development in a single repository, enabling code sharing across backend and frontend while maintaining clear separation of concerns. The `libs` structure supports shared database access, external service integrations, and future UI components—a pattern I'm refining from my previous [henrwx/anest](https://github.com/henrwx/anest) project.

**Modular Data Import**: The data synchronization tool lives in `/tools/data-import`, isolated from the main applications. This separation prevents tight coupling and enables future enhancements like scheduled refreshes, cloud-based processing, or multi-source data ingestion without impacting the core API.

**Technology Stack**: The combination of **NestJS**, **Prisma**, and **PostgreSQL** provides a robust foundation with strong typing, excellent ORM capabilities, and proven scalability. These technologies excel at both rapid development and production readiness.

**Proximity Search Strategy**: The current implementation for finding nearby trucks follows a straightforward approach: query all facilities, calculate distances via Google's Routes API, then filter and sort results. While effective for the current dataset size, this approach has clear optimization opportunities:

- **Geographic indexing**: Implement PostGIS for efficient spatial queries
- **Intelligent pre-filtering**: Use bounding box queries before distance calculations
- **Caching strategies**: Grid-based geographic caching for frequently accessed areas

## Trade-offs & Future Improvements

### Immediate Enhancements

- **Complete Testing**: Add unit and e2e testing for _**search by address**_ and **_nearby_** features, as well as the Google API integration and data importing tool
- **Frontend Development**: Complete the React UI with interactive maps and advanced search filters
- **Performance Optimization**: Replace in-memory distance calculations with PostGIS spatial queries for better scalability
- **Enhanced Search**: Add filters for cuisine and facility type

### Scaling Considerations

**Database Performance**:
- PostGIS extension for optimized geospatial queries
- Read replicas for search-heavy workloads  
- Connection pooling and query optimization
- Indexed searches on name, address, and location fields

**Caching & Performance**:
- Redis-based geographic caching (`nearby:{lat}:{lng}:{radius}`)
- CDN integration for static assets and cacheable API responses
- Application-level caching for popular search terms
- Background job processing for data imports

**Reliability & Security**:
- Rate limiting to prevent API abuse, especially for location-based searches
- Comprehensive input validation and sanitization
- API authentication and usage monitoring
- Circuit breakers for external service dependencies (Google Maps API)

### Security Implementation

**Current Protections**:
- Input validation via class-validator and DTOs
- SQL injection prevention through Prisma ORM
- Type safety across the entire application stack
- CORS configuration for secure frontend integration

**Production Requirements**:
- API rate limiting and authentication mechanisms
- Request logging and security monitoring
- HTTPS enforcement with security headers
- Secure API key management for external services

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm

### Quick Setup

1. **Installation**:
   ```bash
   git clone <repository-url>
   cd rnest
   npm install
   ```

2. **Database Configuration**:
   ```bash
   createdb rnest
   cp .env.example .env

   # Update .env with your database credentials
   ```

3. **Environment Variables** (`.env`):
   ```env
   # Google Maps API
   GOOGLE_MAPS_API_KEY="your-api-key"

   # SF Gov API
   SF_GOV_API_URL="sf-gov-dataset-url"
   SF_GOV_APP_TOKEN="your-sf-gov-app-token"

   # Server
   PORT="your-server-port"
   HOST="your-server-host"
   ```

4. **Database Setup**:
   ```bash
   npx prisma migrate dev
   npx prisma generate

   # Sync SF dataset
   npm run data:import # There are also --dry-run and --analyze flags
   ```

5. **Start Development Server**:
   ```bash
   nx serve api
   # API available at http://localhost:3000/api

   # To also run the client
   nx run-many --target=serve --projects=api,web
   ```

### Testing

```bash
# API unit tests
nx test api

# API end-to-end tests
nx e2e api-e2e
```

### API Usage Examples

```bash
# Search by name
curl -X GET "http://localhost:3000/api/food-trucks/search?name=taco&limit=5"

# Search by address  
curl -X GET "http://localhost:3000/api/food-trucks/search-by-address?address=mission&limit=5"

# Find nearby trucks
curl -X GET "http://localhost:3000/api/food-trucks/nearby?lat=37.7749&long=-122.4194&radius=2&limit=5"
```

## Development Commands

```bash
# Project analysis
nx graph                              # View dependency graph
nx format:write                       # Format entire codebase

# Production build
nx build api                          # Build API for deployment
```

## Technology Stack

**Backend Infrastructure**:
- **Nx**: Monorepo tooling with excellent developer experience and build optimization
- **NestJS**: Enterprise-grade Node.js framework with dependency injection and TypeScript-first design
- **Prisma**: Type-safe database ORM with intuitive schema management and migration tools
- **PostgreSQL**: Production-ready relational database

**Development & Quality**:
- **TypeScript**: End-to-end type safety and enhanced developer productivity
- **Jest**: Comprehensive testing framework with NX integration
- **ESLint/Prettier**: Code quality and formatting consistency

This technology stack prioritizes developer productivity, type safety, and production scalability while maintaining simplicity for rapid iteration and testing.