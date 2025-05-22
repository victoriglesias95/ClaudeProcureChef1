# ProcureChef - Restaurant Procurement Management System

ProcureChef is a React/TypeScript procurement management system designed to streamline restaurant procurement workflows from inventory tracking to order management.

## **Current Project Status (May 2025)**

⚠️ **DEVELOPMENT STATUS: Architecture Refactoring Required**

The project has a solid UI foundation but requires significant backend architecture improvements before production deployment.

### **What's Working**
- ✅ Authentication system with Supabase
- ✅ UI components and layouts
- ✅ Basic navigation and routing
- ✅ Inventory browsing interface
- ✅ Request creation workflow
- ✅ Quote comparison interface
- ✅ Database schema structure

### **Critical Issues Requiring Attention**

#### **1. Service Layer Architecture Problems**
- **quotes.ts is overloaded** (600+ lines, multiple responsibilities)
- **Circular dependencies** between service modules
- **Inconsistent error handling** patterns across services
- **Mixed mock/real data** causing integration issues

#### **2. Database Integration Issues**
- **Schema mismatches** between services and actual database structure
- **Incomplete transition** from mock data to real database
- **Inconsistent query patterns** (some use joins, others separate queries)

#### **3. Type System Issues**
- **Circular type imports** between modules
- **'any' types used** where proper typing is needed
- **Type redundancies** (multiple types for same concepts)

#### **4. Component Redundancies**
- **Multiple quote display patterns** without consistency
- **Duplicated modal patterns** that could be abstracted
- **Empty component files** (`ChefRequestForm.tsx`, `ReceiveOrderForm.tsx`)

## **Technical Architecture**

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Context API
- **Routing**: React Router v6
- **Build Tool**: Vite

### **Database Schema**
```
Core Tables:
├── users (authentication & roles)
├── products (product catalog)
├── inventory (stock levels)
├── suppliers (supplier information)
├── supplier_products (pricing & availability)

Workflow Tables:
├── requests → request_items
├── quote_requests (sent to suppliers)
├── quotes → quote_items (received from suppliers)
├── orders → order_items (purchase orders)
```

### **Current Service Architecture (Needs Refactoring)**
```
services/
├── quotes.ts          # TOO LARGE - handles quotes, suppliers, orders, comparisons
├── products.ts        # Product & inventory management
├── requests.ts        # Request management
├── inventory.ts       # Inventory counting
└── supabase.ts        # Database connection
```

### **Recommended Service Architecture**
```
services/
├── auth.ts           # Authentication only
├── products.ts       # Product catalog
├── inventory.ts      # Stock management
├── requests.ts       # Request lifecycle
├── suppliers.ts      # Supplier management
├── quotes.ts         # Quote operations only
├── quote-requests.ts # Quote request workflow
├── comparisons.ts    # Price comparison logic
├── orders.ts         # Order management
└── supabase.ts       # Database connection
```

## **Current Workflow (Partially Functional)**

### **Inventory Management**
- ✅ View current stock levels
- ✅ Perform inventory counts
- ✅ Monitor low stock items

### **Request Creation**
- ✅ Create requests from inventory interface
- ✅ Add multiple items to cart
- ✅ Submit requests with metadata
- ⚠️ Approval workflow (UI only - no backend logic)

### **Quote Management**
- ⚠️ Send quote requests to suppliers (database integration incomplete)
- ✅ View quote comparisons interface
- ✅ Quote validity tracking UI
- ⚠️ Quote expiration handling (display only)

### **Order Management**
- ✅ Generate orders from quote selections
- ✅ View order history interface
- ❌ Order receiving workflow (empty component)

## **File Structure**
```
src/
├── components/
│   ├── layout/           # MainLayout, ProtectedRoute
│   ├── quotes/           # Quote-related components
│   ├── requests/         # Request workflow components
│   ├── inventory/        # Inventory management
│   └── ui/              # Reusable UI components
├── pages/               # Route components
├── services/            # Data access layer (NEEDS REFACTORING)
├── types/               # TypeScript definitions
├── mocks/               # Mock data (TO BE REMOVED)
├── utils/               # Helper functions
└── contexts/            # React context providers
```

## **Known Issues & Technical Debt**

### **High Priority Issues**
1. **Service Architecture**: quotes.ts needs to be split into multiple focused services
2. **Database Integration**: Complete transition from mock data to Supabase
3. **Type System**: Fix circular dependencies and remove 'any' types
4. **Empty Components**: Implement ChefRequestForm and ReceiveOrderForm

### **Medium Priority Issues**
1. **Error Handling**: Standardize error patterns across services
2. **Performance**: Implement caching strategy and optimize queries
3. **Code Duplication**: Abstract common modal and table patterns

### **Low Priority Issues**
1. **Mobile Responsiveness**: Optimize for mobile devices
2. **Testing**: Add unit and integration tests
3. **Documentation**: Update inline code documentation

## **Development Roadmap**

### **Phase 1: Architecture Refactoring (1-2 weeks)**
1. Split monolithic quotes.ts service
2. Fix circular dependencies
3. Standardize error handling patterns
4. Complete database integration

### **Phase 2: Component Completion (1 week)**
1. Implement missing form components
2. Complete approval workflow backend logic
3. Implement order receiving functionality

### **Phase 3: Production Preparation (1 week)**
1. Remove all mock data dependencies
2. Implement proper error boundaries
3. Add loading states consistency
4. Performance optimization

### **Phase 4: Testing & Polish (1 week)**
1. Add comprehensive testing
2. Mobile optimization
3. Security review
4. Documentation updates

## **Getting Started**

### **Prerequisites**
- Node.js 18+
- Supabase account and project

### **Installation**
```bash
# Clone repository
git clone [repository-url]
cd procurechef

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your Supabase credentials:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_key

# Start development server
npm run dev
```

### **Database Setup**
1. Navigate to `/admin` in the application
2. Click "Check Connection" to verify Supabase connectivity
3. Click "Setup Database" to populate initial data
4. Create test users as needed

## **Contributing**

### **Before Contributing**
1. Review the architecture issues listed above
2. Follow the refactoring roadmap
3. Ensure all new code follows TypeScript best practices
4. Test database integration thoroughly

### **Development Guidelines**
- **Services**: Keep services focused on single responsibilities
- **Types**: Use proper TypeScript types, avoid 'any'
- **Error Handling**: Use consistent error patterns
- **Testing**: Add tests for new functionality

## **Current Limitations**

⚠️ **Not Production Ready** - Requires architecture refactoring
⚠️ **Database Integration Incomplete** - Schema mismatches exist
⚠️ **Service Layer Coupling** - Circular dependencies need resolution
⚠️ **Missing Core Features** - Some workflows incomplete

## **Support**

This project is in active development. Please refer to the issues list for known problems and planned improvements.

---

**Last Updated**: May 2025
**Status**: Development - Architecture Refactoring Phase