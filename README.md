ProcureChef - Restaurant Procurement Management System
ProcureChef is a comprehensive restaurant procurement management system designed to streamline the entire procurement workflow from inventory tracking to order management.
Project Status (May 2025)
ProcureChef is currently in active development with a functioning procurement workflow using mock data. The application is ready for database integration with Supabase.
Completed Features
Core Functionality

✅ Inventory management with stock counting
✅ Request creation and approval workflow
✅ Quote management with supplier selection
✅ Quote validity tracking and status indicators
✅ Quote detail views for individual quotes
✅ Product price comparison across suppliers
✅ Order generation from selected quotes
✅ Supplier management and profiles

Enhanced Functionality

✅ Quote validity system with expiry dates and visual indicators
✅ Blanket quote support for long-term pricing agreements
✅ Smart quote reuse to avoid unnecessary requests
✅ Quote request workflow with status tracking
✅ Enhanced UI with proper navigation and visual feedback

Current Workflow

Inventory Management

View current stock levels
Perform inventory counts
Monitor low stock items


Request Creation & Approval

Create procurement requests from inventory
Submit requests for approval
Approve/reject requests


Quote Request Management

Select suppliers for quote requests
Send quote requests to suppliers
Track pending quote requests
View received quotes


Quote Comparison & Selection

Compare pricing across suppliers
View quote details and validity periods
Select best quotes for each product


Order Generation & Tracking

Generate orders from selected quotes
Track order status
View order history



Technical Details

Frontend: React 18 with TypeScript
Styling: Tailwind CSS
Routing: React Router v6
Database: Supabase (prepared)
State Management: React Context API
API Handling: Service layer with data access pattern

Next Steps

Immediate Priorities

Complete database integration with Supabase
Implement bulk request selection
Add supplier-specific filtering


Upcoming Features

Order receiving module
Advanced reporting and analytics
Multi-location support
Mobile optimization


Future Enhancements

Email notifications for approvals and quotes
Budget tracking and variance reporting
Integration with accounting systems
Barcode scanning for receiving



Getting Started
Prerequisites

Node.js 18+
npm or yarn

Installation

Clone the repository
Install dependencies: npm install
Create a .env file with Supabase credentials:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

Start the development server: npm run dev

Database Setup

Navigate to /admin in the application
Click "Setup Database" to populate initial data

Documentation
File Structure
src/
├── components/
│   ├── layout/
│   ├── quotes/
│   ├── requests/
│   ├── inventory/
│   └── ui/
├── pages/
│   ├── Dashboard.tsx
│   ├── Inventory.tsx
│   ├── Requests.tsx
│   ├── RequestDetails.tsx
│   ├── Quotes.tsx
│   ├── QuoteDetails.tsx
│   ├── ProductQuoteComparison.tsx
│   ├── Orders.tsx
│   ├── Suppliers.tsx
│   └── Admin.tsx
├── services/
│   ├── quotes.ts
│   ├── products.ts
│   ├── inventory.ts
│   └── supabase.ts
├── mocks/
│   ├── data.ts
│   └── procurement-data.ts
├── types/
│   ├── quote.ts
│   ├── product.ts
│   └── request.ts
└── utils/
    ├── quoteUtils.ts
    └── databaseSetup.ts
Key Features
Inventory Management

Real-time inventory tracking
Inventory count functionality
Low stock alerts and notifications

Request Management

Detailed request creation and tracking
Approval workflow with status updates
Multi-item request support

Quote Management

Quote request tracking with expiry dates
Quote validity monitoring
Quote comparison across suppliers

Order Management

Order generation from selected quotes
Order status tracking
Delivery scheduling

Supplier Management

Supplier profiles and contact information
Supplier performance tracking
Preferred supplier designation

Database Schema
ProcureChef uses a Supabase PostgreSQL database with the following key tables:

users - Authentication and user profiles
products - Product catalog management
inventory - Inventory levels and tracking
suppliers - Supplier information
requests - Procurement requests
request_items - Items within requests
quote_requests - Quote requests sent to suppliers
quotes - Quotes received from suppliers
quote_items - Individual items within quotes
orders - Purchase orders generated
order_items - Items within purchase orders

Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
License
This project is proprietary software.