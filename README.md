# ProcureChef - Restaurant Procurement Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)

ProcureChef is a React TypeScript restaurant procurement management system that streamlines the entire procurement workflow from inventory tracking to order management, using Supabase as the backend.

## 🚀 Current Status (January 2025)

### ✅ **Working Features**
- **User Authentication** - Secure login/logout with role-based access
- **Inventory Management** - Product browsing, stock tracking, cart system
- **Request Creation** - Cart-based ingredient requests with form validation
- **Quote Management** - Quote comparison and supplier selection
- **Order Creation** - Generate orders from selected quotes
- **Order Receiving** - Complete receiving workflow with inventory updates
- **Supplier Management** - CRUD operations for suppliers and catalogs
- **Admin Tools** - Database setup, user management, connection testing

### ⚠️ **Known Issues**
- **Codebase Complexity** - Over-engineered with too many abstraction layers
- **Inconsistent Patterns** - Mixed approaches across components
- **Performance** - Heavy bundle size due to complexity
- **Maintainability** - Difficult to modify due to tight coupling

### 🔧 **Active Development**
- **Simplification Roadmap** - Major refactoring in progress
- **Architecture Cleanup** - Consolidating services and components
- **Performance Optimization** - Reducing bundle size and complexity

## 📋 **Immediate To-Do List**

### Critical Fixes (This Week)
- [x] Fix TypeScript errors in Inventory.tsx
- [ ] Consolidate service layer (15 files → 4 files)
- [ ] Simplify type definitions (6 files → 3 files)
- [ ] Remove unused dependencies and utilities

### Next Sprint Goals
- [ ] Implement unified state management
- [ ] Simplify component architecture
- [ ] Remove complex abstractions
- [ ] Improve performance metrics

## 🏗️ **Technology Stack**

### Core Technologies
- **Frontend**: React 18 + TypeScript, Tailwind CSS, React Router v6
- **Backend**: Supabase (PostgreSQL + Authentication)
- **State Management**: Zustand (planning to consolidate)
- **Forms**: React Hook Form + Zod (planning to simplify)
- **Notifications**: Sonner

### Development Tools
- **Build Tool**: Vite
- **Package Manager**: npm
- **Linting**: ESLint + TypeScript
- **Database**: Supabase PostgreSQL

## 🛠️ **Setup Instructions**

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project ([create at supabase.com](https://supabase.com))

### Installation

1. **Clone and install dependencies:**
```bash
git clone [repository-url]
cd procure-chef
npm install
```

2. **Environment setup:**
Create `.env` file in root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Database setup:**
```bash
npm run dev
# Navigate to http://localhost:5173/admin
# Click "Check Connection" to verify Supabase connection
# Click "Setup Database" to initialize tables and sample data
```

4. **Create test user:**
```bash
# In admin panel (/admin):
# Use "Create Test User" form
# Email: test@procurechef.com
# Password: [your-choice]
# Role: admin (for full access)
```

## 📊 **Database Schema**

### Core Tables
```sql
-- User Management
users (id, email, role, name, created_at)

-- Product Catalog
products (id, name, description, category, default_unit, sku, created_at)
inventory (product_id, current_stock, stock_level, last_updated)

-- Supplier Management
suppliers (id, name, contact, email, phone, address, payment_terms, notes)
supplier_products (supplier_id, product_id, price, available, supplier_product_code)

-- Procurement Workflow
requests (id, title, created_by, status, priority, needed_by, total_amount)
request_items (id, request_id, product_id, quantity, unit, price_per_unit)
quotes (id, supplier_id, request_id, status, total_amount, expiry_date)
quote_items (id, quote_id, product_id, quantity, price_per_unit, in_stock)
orders (id, number, supplier_id, status, total, delivery_date)
order_items (id, order_id, product_id, quantity, price, total)
```

## 🎯 **Development Roadmap**

### Phase 1: Architecture Cleanup (Current)
- [ ] **Service Consolidation** - Merge 15 service files into 4
- [ ] **Type Simplification** - Reduce type complexity
- [ ] **Component Cleanup** - Remove redundant abstractions
- [ ] **Dependency Audit** - Remove unused packages

### Phase 2: State Management (Next)
- [ ] **Unified Store** - Single state management pattern
- [ ] **Context Cleanup** - Remove redundant contexts
- [ ] **Loading States** - Consistent loading patterns
- [ ] **Error Handling** - Simplified error management

### Phase 3: UI Simplification (Future)
- [ ] **Component Merge** - Reduce component count by 40%
- [ ] **Form Simplification** - Replace complex forms with simple ones
- [ ] **Mobile Optimization** - Remove premature optimizations
- [ ] **Performance** - Bundle size reduction

## 🧪 **Testing Current Functionality**

### Complete Workflow Test
1. **Login** - Use test credentials
2. **Inventory** - Browse products, add to cart
3. **Request Creation** - Submit ingredient request
4. **Admin Approval** - Approve request in admin panel
5. **Quote Generation** - Generate quotes from approved requests
6. **Quote Comparison** - Compare prices, select suppliers
7. **Order Creation** - Create purchase orders
8. **Order Receiving** - Mark orders as received, update stock

### Key Test Paths
- ✅ Authentication flow
- ✅ Cart functionality
- ✅ Request submission
- ✅ Quote comparison
- ✅ Order management
- ✅ Inventory updates
- ✅ Admin functions

## 🔧 **Development Commands**

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Build for production
npm run preview          # Preview production build

# Linting & Type Checking
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler

# Database Management
# Use /admin page in browser for:
# - Connection testing
# - Database initialization
# - User creation
# - Verification tools
```

## ⚠️ **Troubleshooting Guide**

### Common Issues

**TypeScript Errors**
- Run `npm run type-check` to see all errors
- Most errors are due to missing type definitions
- Check import paths (use relative imports)

**Authentication Issues**
- Verify Supabase credentials in `.env`
- Run database setup via `/admin` page
- Check browser console for specific error codes

**Database Connection**
- Use `/admin` page "Check Connection" tool
- Verify Supabase URL and API key
- Ensure database tables exist

**Build Errors**
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Restart dev server: `npm run dev`

### Error Codes Reference
- **SETUP_REQUIRED** - Database tables missing
- **PERMISSION_DENIED** - Check Supabase RLS policies
- **TIMEOUT** - Database connection timeout
- **USER_CREATION_FAILED** - User table permissions issue

## 📁 **Current Project Structure**

```
src/
├── components/          # React components (needs cleanup)
│   ├── ui/              # Basic UI components
│   ├── layout/          # Layout components
│   ├── quotes/          # Quote-related components
│   ├── requests/        # Request components
│   ├── inventory/       # Inventory components
│   ├── chef/            # Chef-specific components (to be merged)
│   └── receiver/        # Order receiving (to be simplified)
├── pages/               # Main application pages
├── services/            # API/Database layer (needs consolidation)
├── types/               # TypeScript type definitions (needs simplification)
├── hooks/               # Custom React hooks (needs cleanup)
├── utils/               # Utility functions (needs audit)
├── store/               # State management
└── styles/              # CSS files
```

## 🎯 **Contribution Guidelines**

### Before Making Changes
1. **Review the Simplification Roadmap** - Understand current refactoring goals
2. **Follow Existing Patterns** - Don't add new patterns while simplifying
3. **Test Thoroughly** - Ensure core workflows still work
4. **Document Changes** - Update this README if needed

### Development Principles
- **Simplicity over Complexity** - Choose simple solutions
- **Consistency** - Follow established patterns
- **Performance** - Consider bundle size impact
- **Maintainability** - Write code that's easy to understand

### Code Style
- Use TypeScript strictly
- Prefer function components over classes
- Use relative imports
- Keep components small and focused
- Avoid over-abstraction

## 📞 **Need Help?**

### Quick Fixes
- **TypeScript Errors**: Check import paths and type definitions
- **Database Issues**: Use `/admin` page diagnostic tools
- **Authentication**: Verify Supabase credentials and setup
- **Build Problems**: Clear cache and reinstall dependencies

### Development Support
- Check the Simplification Roadmap for current priorities
- Review existing component patterns before creating new ones
- Test core workflows after any changes
- Use browser dev tools for debugging

## 🎉 **Recent Achievements**

- ✅ **Fixed Critical Bugs** - Resolved TypeScript errors
- ✅ **Simplified Inventory** - Removed over-engineering
- ✅ **Created Roadmap** - Clear path for future development
- ✅ **Documented Issues** - Transparent about current state
- ✅ **Improved Developer Experience** - Better setup instructions

## 📝 **Version History**

### Current Version (v0.2.0)
- Fixed immediate TypeScript errors
- Created simplification roadmap
- Updated documentation
- Identified technical debt

### Previous Version (v0.1.0)
- Full procurement workflow
- Authentication system
- Database integration
- Admin tools

---

**Last Updated**: January 2025 - Post-Simplification Analysis

**Next Review**: After Phase 1 completion (Service Consolidation)