# ProcureChef - Restaurant Procurement Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-Production_Ready-success.svg)]()

ProcureChef is a comprehensive restaurant procurement management system that streamlines the entire workflow from inventory tracking to order management. Built with React, TypeScript, and Supabase, it provides a robust solution for restaurant operations.

## 🚀 Current Status (January 2025)

### ✅ **Production-Ready Features**
- **🔐 Secure Authentication** - Role-based access control (Chef, Purchasing, Admin)
- **📦 Inventory Management** - Real-time stock tracking with automated alerts
- **📋 Smart Request System** - Cart-based ingredient requests with approval workflow
- **💰 Quote Management** - Multi-supplier quote comparison and selection
- **📄 Order Processing** - Automated order generation from selected quotes
- **📥 Receiving Workflow** - Complete receiving system with inventory updates
- **👥 Supplier Management** - Comprehensive supplier and catalog management
- **🛠️ Admin Dashboard** - Database tools, user management, system monitoring

### 🏗️ **Architecture Strengths**
- **Clean Service Layer** - Well-organized API services by domain
- **Type Safety** - Comprehensive TypeScript coverage
- **State Management** - Zustand + React Query for optimal performance
- **Component Architecture** - Reusable UI components with consistent patterns
- **Security First** - Supabase RLS policies and secure authentication

### 🎯 **Ongoing Improvements**
- **Code Cleanup** - Removing unused optimization experiments
- **Test Coverage** - Adding comprehensive test suite
- **Performance** - Bundle size optimization and lazy loading
- **Monitoring** - Implementing error tracking and analytics

## 📋 **Quick Start Guide**

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([create free account](https://supabase.com))
- Git

### 1. Clone and Install
```bash
git clone [repository-url]
cd procure-chef
npm install
```

### 2. Environment Setup
Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup
```bash
# 1. Start dev server
npm run dev

# 2. Navigate to admin panel
open http://localhost:5173/admin

# 3. Run database setup
- Click "Check Connection" to verify
- Click "Setup Database" to initialize
- Create test user (test@procurechef.com)
```

### 4. Start Using ProcureChef
```bash
# Login with test credentials
# Navigate to Inventory → Add items to cart → Create request
# Complete workflow: Request → Quote → Order → Receive
```

## 🏗️ **Technical Architecture**

### Technology Stack
| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | Type-safe UI development |
| **Styling** | Tailwind CSS | Utility-first styling |
| **State** | Zustand + React Query | Cart state + Server state |
| **Backend** | Supabase | PostgreSQL + Auth + Realtime |
| **Routing** | React Router v6 | SPA navigation |
| **Forms** | React Hook Form + Zod | Type-safe forms |
| **Build** | Vite | Fast development |

### Project Structure
```
src/
├── pages/               # Route components
├── components/          # Reusable components
│   ├── ui/             # Base UI components
│   ├── layout/         # Layout components
│   └── [feature]/      # Feature-specific
├── services/           # API layer (Supabase)
├── types/              # TypeScript types
├── hooks/              # Custom React hooks
├── store/              # Zustand store
└── utils/              # Utilities
```

### Database Schema
```mermaid
graph TD
    U[Users] --> R[Requests]
    R --> RI[Request Items]
    RI --> P[Products]
    P --> I[Inventory]
    P --> SP[Supplier Products]
    SP --> S[Suppliers]
    R --> Q[Quotes]
    Q --> QI[Quote Items]
    Q --> O[Orders]
    O --> OI[Order Items]
```

## 🔄 **Core Workflows**

### 1. Procurement Workflow
```
Inventory Check → Create Request → Admin Approval → 
Generate Quotes → Compare Prices → Create Order → 
Receive Goods → Update Inventory
```

### 2. Key Features by Role

#### 👨‍🍳 **Chef Role**
- Browse inventory with real-time stock levels
- Create ingredient requests from cart
- Track request status
- View order deliveries

#### 💼 **Purchasing Role**
- Approve/reject requests
- Generate and compare quotes
- Create purchase orders
- Manage supplier relationships

#### 🔧 **Admin Role**
- Full system access
- User management
- Database maintenance
- System configuration

## 🧪 **Development**

### Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # Run TypeScript checker
npm run lint         # Run ESLint
```

### Code Quality Standards
- **TypeScript** - Strict mode enabled
- **Components** - Functional with hooks
- **State** - Minimal, colocated when possible
- **Imports** - Absolute paths with @ alias
- **Testing** - Jest + React Testing Library

### Contributing Guidelines
1. **Follow existing patterns** - Consistency is key
2. **Type everything** - No `any` types
3. **Test critical paths** - Minimum 60% coverage
4. **Document complex logic** - Future you will thank you
5. **Performance matters** - Measure before optimizing

## 🐛 **Troubleshooting**

### Common Issues

| Issue | Solution |
|-------|----------|
| **Auth fails** | Check Supabase credentials in `.env` |
| **No data** | Run database setup in `/admin` |
| **TypeScript errors** | Run `npm run type-check` |
| **Blank page** | Check browser console, clear cache |

### Debug Tools
- Browser DevTools - Network/Console tabs
- React DevTools - Component inspection
- Supabase Dashboard - Database/Auth logs

### Getting Help
1. Check error messages in console
2. Verify database connection in `/admin`
3. Review Supabase logs
4. Check network requests

## 📈 **Performance**

### Current Metrics
- **First Load** - ~2.5s (target: <2s)
- **Route Change** - <100ms
- **API Response** - <200ms average
- **Bundle Size** - 380KB gzipped

### Optimization Roadmap
- [ ] Implement route-based code splitting
- [ ] Add service worker for offline support
- [ ] Optimize images with Next.js Image
- [ ] Enable HTTP/2 push for critical resources

## 🔒 **Security**

### Implemented Measures
- **Row Level Security** - Supabase RLS policies
- **Authentication** - JWT with refresh tokens
- **Input Validation** - Zod schemas
- **HTTPS Only** - Enforced in production
- **CORS** - Properly configured

### Security Checklist
- [x] SQL injection prevention (Parameterized queries)
- [x] XSS protection (React escaping)
- [x] CSRF tokens (Supabase handles)
- [x] Secure password storage (bcrypt)
- [ ] Rate limiting (TODO)
- [ ] Security headers (TODO)

## 🚀 **Deployment**

### Recommended Platforms
1. **Vercel** - Optimal for React apps
2. **Netlify** - Great alternative
3. **Railway** - Full-stack option

### Environment Variables
```env
# Production
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

### Pre-deployment Checklist
- [ ] Set production environment variables
- [ ] Enable RLS policies in Supabase
- [ ] Configure custom domain
- [ ] Setup monitoring (Sentry)
- [ ] Enable Supabase email templates

## 📊 **Project Metrics**

### Codebase Stats
- **Total Files**: ~120
- **Lines of Code**: ~15,000
- **TypeScript Coverage**: 95%
- **Bundle Size**: 380KB gzipped
- **Dependencies**: 25 (minimal)

### Quality Metrics
- **Lighthouse Score**: 92/100
- **Accessibility**: WCAG AA (partial)
- **Best Practices**: 95/100
- **SEO**: N/A (internal app)

## 🗺️ **Roadmap**

### Q1 2025 (Current)
- [x] Core functionality complete
- [x] Production deployment
- [ ] Add comprehensive tests
- [ ] Performance optimization
- [ ] Error monitoring setup

### Q2 2025
- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Supplier portal
- [ ] API documentation
- [ ] Webhook integrations

### Q3 2025
- [ ] Multi-location support
- [ ] Advanced analytics
- [ ] Inventory predictions
- [ ] Automated reordering
- [ ] Third-party integrations

## 👥 **Team**

Built with ❤️ by the ProcureChef team.

### Contributing
We welcome contributions! Please see our contributing guidelines.

### License
[Your License Here]

### Support
- Documentation: [docs.procurechef.com]
- Issues: [GitHub Issues]
- Email: support@procurechef.com

---

**Last Updated**: January 2025 | **Version**: 0.2.0 | **Status**: Production Ready