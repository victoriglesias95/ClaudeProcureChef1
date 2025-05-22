# ProcureChef - Restaurant Procurement Management System

ProcureChef is a React TypeScript restaurant procurement management system that streamlines the entire procurement workflow from inventory tracking to order management, using Supabase as the backend.

## 🚀 Current Project Status (Updated May 2025)

### ✅ **Fully Functional Features**
- **User Authentication** - Login/logout with role-based access (chef, purchasing, admin)
- **Inventory Management** - Product browsing, stock tracking, physical counting
- **Request Creation** - Cart-based ingredient requests from inventory
- **Quote Management** - Basic quote comparison and selection
- **Order Creation** - Generate orders from selected quotes
- **Supplier Management** - Basic supplier CRUD operations
- **Admin Tools** - Database setup, user management, connection testing

### ⚠️ **Known Issues & Limitations**
- **Security Issue**: All new users default to admin role (needs immediate fix)
- **Missing Components**: `ReceiveOrderForm.tsx` and `ChefRequestForm.tsx` are empty
- **Service Architecture**: Circular dependencies in quotes service
- **Performance**: Aggressive polling in quotes page (5-second intervals)
- **Request Approval**: UI exists but backend integration incomplete

## 🏗️ **Technology Stack**

- **Frontend**: React 18 + TypeScript, Tailwind CSS, React Router v6
- **Backend**: Supabase (PostgreSQL + Authentication)
- **State Management**: React Context API + React Query
- **UI Components**: Custom component library with Tailwind
- **Notifications**: Sonner for toast messages

## 🛠️ **Setup Instructions**

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Supabase project (create at [supabase.com](https://supabase.com))

### **Installation**

1. **Clone and install dependencies:**
```bash
git clone [repository-url]
cd procure-chef
npm install
```

2. **Environment setup:**
Create `.env` file:
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. **Database setup:**
```bash
npm run dev
# Navigate to /admin
# Click "Check Connection" to verify
# Click "Setup Database" to initialize tables
```

4. **Create test user:**
```bash
# In /admin page, use "Create Test User" form
# Email: test@procurechef.com
# Password: [your-choice]
# Role: admin
```

## 📊 **Database Schema**

```sql
-- Core entities
users (id, email, role, name)
products (id, name, description, category, default_unit)
inventory (product_id, current_stock, stock_level, last_updated)
suppliers (id, name, contact, email, phone, address, payment_terms)

-- Procurement workflow
requests (id, title, created_by, status, priority, needed_by)
request_items (id, request_id, product_id, quantity, unit)
quote_requests (id, request_id, supplier_id, status, sent_at)
quotes (id, supplier_id, request_id, status, expiry_date, total_amount)
quote_items (id, quote_id, product_id, quantity, price_per_unit)
orders (id, number, supplier_id, status, total, delivery_date)
order_items (id, order_id, product_id, quantity, price, total)

-- Relationships
supplier_products (supplier_id, product_id, price, supplier_product_code)
```

## 🚨 **Critical Architecture Issues (MUST FIX)**

### **1. Security Vulnerability**
**File**: `src/contexts/AuthContext.tsx`  
**Issue**: Line 42 - All users get admin role by default  
**Impact**: Complete security bypass  

### **2. Service Circular Dependency**
**File**: `src/services/quotes.ts`  
**Issue**: Line 10 - `export { getRequests, getRequestById } from './requests'`  
**Impact**: Import conflicts and maintenance issues  

### **3. Empty Critical Components**
**Files**: 
- `src/components/receiver/ReceiveOrderForm.tsx` (empty)
- `src/components/chef/ChefRequestForm.tsx` (empty)
**Impact**: Incomplete order workflow

## 🎯 **Immediate Development Priorities**

### **Phase 1: Security & Critical Fixes (1-2 hours)**
1. **Fix authentication role assignment** (CRITICAL)
2. **Remove service circular dependency**
3. **Fix database connection syntax** (if needed)

### **Phase 2: Complete Core Workflow (2-4 hours)**
1. **Implement ReceiveOrderForm.tsx** - Order receiving UI
2. **Fix request approval backend integration**
3. **Remove performance polling in quotes**

### **Phase 3: Code Cleanup (1-2 hours)**
1. **Delete empty files**: `useFormSubmit.ts`, `useService.ts`, `api.ts`
2. **Fix remaining 'any' types**
3. **Consolidate duplicate mock data**

### **Phase 4: Enhanced Features (1+ weeks)**
1. **Complete ChefRequestForm.tsx**
2. **Email notifications**
3. **Advanced reporting**
4. **Mobile optimization**

## 📁 **Project Structure**

```
src/
├── components/           # Reusable UI components
│   ├── layout/          # MainLayout, ProtectedRoute
│   ├── quotes/          # Quote-related components
│   ├── requests/        # Request management
│   ├── inventory/       # Inventory components
│   └── ui/              # Basic UI components
├── pages/               # Main application pages
├── services/            # API/Database layer
│   ├── products.ts      # Product & inventory operations
│   ├── requests.ts      # Request management
│   ├── quotes.ts        # Quote operations (needs refactoring)
│   └── supabase.ts      # Database connection
├── contexts/            # React Context providers
├── types/               # TypeScript type definitions
├── mocks/               # Mock data (legacy, being phased out)
└── utils/               # Utility functions
```

## 🧪 **Testing Current Functionality**

### **Complete Workflow Test:**
1. **Login** as admin user
2. **Inventory** → Select products → Create request
3. **Requests** → View request → Generate quote (if approved)
4. **Quotes** → Compare prices → Create order
5. **Orders** → View order details

### **Known Working Paths:**
- ✅ User registration/login
- ✅ Inventory browsing and counting
- ✅ Request creation and viewing
- ✅ Quote comparison (basic)
- ✅ Order generation

### **Known Broken Paths:**
- ❌ Request approval (UI only)
- ❌ Order receiving (no UI)
- ❌ Enhanced chef workflows (empty component)

## 🔧 **Development Commands**

```bash
# Development
npm run dev              # Start development server

# Database
# Use /admin page for:    # Database setup and management
# - Connection testing
# - Database initialization  
# - User creation

# Debugging
# Browser console shows:  # Authentication state changes
# - Service layer errors
# - Component lifecycle
```

## ⚠️ **Known Quirks & Workarounds**

1. **Mock Data**: Set to `USE_MOCK_DATA = false` in services, but fallbacks exist
2. **Polling**: Quotes page refreshes every 5 seconds (remove for production)
3. **Error Handling**: Inconsistent patterns across services
4. **Type Safety**: Some 'any' types remain in quote comparisons

## 🤝 **Contributing**

**Before adding features:**
1. Fix critical security issues first
2. Complete empty components
3. Follow existing patterns in `/components/ui/`
4. Use proper TypeScript typing
5. Test complete workflows, not just individual features

## 📋 **Deployment Checklist**

**Before production:**
- [ ] Fix authentication security vulnerability
- [ ] Remove aggressive polling
- [ ] Complete order receiving workflow
- [ ] Add proper error boundaries
- [ ] Remove debug logging
- [ ] Set up proper environment variables
- [ ] Configure Row Level Security in Supabase

---

## 🆘 **Need Help?**

**Architecture Issues**: Check this README's "Critical Issues" section  
**Database Problems**: Use `/admin` page tools for debugging  
**Authentication Issues**: Verify Supabase credentials and user table  
**Missing Features**: Check empty component files listed above  

**Last Updated**: May 2025 - After comprehensive architecture analysis