ProcureChef - Restaurant Procurement Management System
ProcureChef is a comprehensive restaurant procurement management system designed to streamline the entire procurement workflow from inventory tracking to order management.
Project Status (May 2025)
ProcureChef is in active development with a functioning procurement workflow. The application now features a robust authentication system with role-based access control and race condition protection.
Completed Features
Core Functionality
✅ Secure authentication with role-based access control
✅ Inventory management with stock counting
✅ Request creation and approval workflow
✅ Quote management with supplier selection
✅ Quote validity tracking and status indicators
✅ Quote detail views for individual quotes
✅ Product price comparison across suppliers
✅ Order generation from selected quotes
✅ Supplier management and profiles
Enhanced Functionality
✅ Race-condition protected authentication with error recovery
✅ Quote validity system with expiry dates and visual indicators
✅ Blanket quote support for long-term pricing agreements
✅ Smart quote reuse to avoid unnecessary requests
✅ Quote request workflow with status tracking
✅ Enhanced UI with proper navigation and visual feedback
Current Workflow
Authentication & Access Control

Role-based user authentication (chef, purchasing, admin)
Protected routes with role enforcement
Session persistence across page refreshes
Graceful authentication error handling

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
Database: Supabase (PostgreSQL + Authentication)
State Management: React Context API
API Handling: Service layer with data access pattern
Build Tool: Vite with HMR support

Next Steps
Immediate Priorities

Performance optimizations for database operations
Implement proper error boundaries for component failures
Refactor authentication context for better HMR support

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
A Supabase account and project

Installation

Clone the repository
Install dependencies:
bashnpm install

Create a .env file with Supabase credentials:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

Start the development server:
bashnpm run dev


Database Setup

Navigate to the Admin page /admin in the application
Click "Check Connection" to verify Supabase connectivity
Click "Setup Database" to populate initial data
Create a test user with the form provided

File Structure
src/
├── components/
│   ├── layout/
│   ├── quotes/
│   ├── requests/
│   ├── inventory/
│   └── ui/
├── contexts/
│   └── auth/           # Authentication context and provider
├── pages/
│   ├── Dashboard.tsx
│   ├── Inventory.tsx
│   ├── Requests.tsx
│   └── ...
├── services/
│   ├── quotes.ts
│   ├── products.ts
│   └── ...
├── types/
│   ├── quote.ts
│   ├── product.ts
│   └── ...
└── utils/
    ├── quoteUtils.ts
    └── ...
Authentication System
ProcureChef implements a robust authentication system using Supabase Auth with several key features:

Role-based Access Control: Different permissions for chefs, purchasing staff, and admins
Protected Routes: Route guards based on authentication status and user roles
Session Persistence: Maintains login state across page refreshes
Race Condition Protection: Prevents state conflicts between initialization and auth events
Error Recovery: Graceful handling of timeouts and network issues
Fallback Mechanisms: Ensures a smooth user experience even when authentication faces issues

typescript// Example of using authentication in a component
import { useAuth } from '../contexts/auth';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }
  
  return (
    <div>Welcome, {user.email}! Your role: {user.role}</div>
  );
}
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

Troubleshooting
Authentication Issues
If you experience authentication issues:

Auth Loading Loop: If authentication gets stuck in "Loading...", check:

If database connections are timing out (visible in console)
If race conditions between getSession() and onAuthStateChange are occurring
Check the browser console for auth state transitions


Fast Refresh Issues: If you see "Could not Fast Refresh" errors:

Ensure all context components use named exports instead of default exports
Consider splitting large context providers into separate files
Avoid circular dependencies


Database Connection Timeouts:

Check for slow response times in the Network tab
Consider increasing timeout values in the auth context
Verify Supabase project is on an appropriate plan for your usage


Authentication Debugging:

Use the AuthDebugger component (visible in non-production environments)
Check localStorage for auth-related items
Monitor auth state transitions in the console logs



Testing Credentials
For testing purposes, you can use:

Email: test@procurechef.com
Password: testpassword

Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
License
This project is proprietary software.