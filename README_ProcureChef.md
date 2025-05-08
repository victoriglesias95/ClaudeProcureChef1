# 📘 ProcureChef – System Overview and Goals

## 🌐 What Is ProcureChef?
ProcureChef is a **modular, modern procurement platform** built specifically for the restaurant industry. It enables seamless collaboration between kitchen staff, purchasers, receivers, and administrators by digitizing ingredient requests, quote management, ordering, delivery confirmation, and supplier coordination.

## 🎯 What Does It Aim to Achieve?
### 1. **Streamline Restaurant Procurement**
- Simplify and digitize the end-to-end purchasing flow
- Reduce time spent by chefs and purchasers on manual processes
- Enable real-time visibility of request, quote, and order statuses

### 2. **Improve Accuracy and Efficiency**
- Reduce procurement errors
- Detect missing or late deliveries
- Support real-time updates to inventory and ERPs

### 3. **Remain Lean and Non-ERP**
- Focus on a great user experience for specific workflows
- Avoid ERP bloat by providing targeted integrations
- Ensure seamless handoff to full ERP systems (for accounting, invoicing, etc.)

### 4. **Mobile-First Design**
- Empower chefs and receivers to work from tablets/phones in kitchens or loading docks
- Ensure UI clarity under high-stress, fast-moving conditions

### 5. **Multi-Role, Multi-User System**
- Role-specific interfaces and workflows
- Shared platform with tailored permissions and views

## 🔄 System Flow Summary
1. Chef Inventory & Requests
2. Quote Management & Comparison (Purchasing)
3. Order Creation & Optimization
4. Order Receiving & Inventory Update
5. ERP Sync for Invoice Approval

## 💡 Design Pillars
- Component-based UI: reusable, modular, scalable
- Mock-driven development: enable development before API readiness
- Service-oriented logic: separate UI from data logic
- Visual clarity: use color and hierarchy for quick scanning
- Rapid response: prioritize UX performance

## 📦 Target Users
| Role        | Capabilities                                                    |
|-------------|------------------------------------------------------------------|
| Chef        | View inventory, submit requests, track deliveries               |
| Purchasing  | Match suppliers, compare quotes, place orders                   |
| Receiver    | Confirm arrivals, flag issues, update inventory                 |
| Admin       | Manage users, roles, suppliers, and system settings             |

## 🧩 ERP Integration Points
- Product Catalog: import via API or manual upload
- Inventory Levels: sync or override manually
- Received Orders: confirmed deliveries push to ERP to auto-approve invoices

## 📈 Business Impact
- Reduced food waste via better forecasting
- Improved pricing through quote comparison
- Streamlined invoice approvals
- Faster procurement cycles
- Role clarity = team accountability

ProcureChef is a purpose-built tool focused on impact, speed, and integration — not complexity. It scales with your team, but stays lean by design.


# ⚠️ ProcureChef – Pain Points and Architectural Cautions

This guide outlines operational, technical, and architectural pain points that Claude or future collaborators should be mindful of when generating or modifying code.

## 🔧 Operational Pain Points (Restaurant Context)

### 1. Chefs under time pressure
- Interfaces must load fast, be clear, and work well on tablets.
- Inputs must require minimal typing.

### 2. Frequent inventory surprises
- Inventory levels may be inaccurate.
- Users must be able to quickly adjust real-world mismatches.

### 3. Multi-location complexity
- Different restaurants may have slightly different catalogs, suppliers, or delivery flows.
- System must allow variation across locations.

### 4. Delivery chaos
- Shipments may arrive in parts, be late, missing, or over-delivered.
- The receiving UI must be forgiving, fast, and allow comments, partials, and errors.

## 🖥️ Technical & System Design Cautions

### 1. Not an ERP
- Don’t bloat the system with deep accounting or invoicing logic.
- ERP-related data (products, inventory, orders) must be synced — not duplicated.

### 2. Mock-first, API-later
- Until Supabase and backend services are fully ready, all services must support mock mode.
- Always structure services to return consistent shapes.

### 3. Role Flexibility Needed
- Base roles are a good start, but permission overrides must be possible.
- Interfaces should gracefully degrade based on access.

### 4. Permissions are dynamic
- Don’t hardcode role logic.
- Use a permission engine or map stored in context.
- Design future-proof UI hooks like useHasPermission("canApproveQuotes")

### 5. ERP Integration Risks
- Network failures, bad data, or conflicts from ERP APIs should never crash the app.
- Build integration as separate service layer (/services/erp/)
- Log failures and show UI fallback or retry options.

## ✅ Claude-Specific Development Reminders
- Always look for the current state in /pages/ and /services/
- Respect mock/data layering: don't write UI that breaks without real API
- Include optional comments like // TODO: Add ERP push once order is confirmed
- Use handover-summary.md to stay aware of system scope

By anticipating these friction points, we ensure ProcureChef stays fast, clean, and field-proven — not bloated or rigid.
