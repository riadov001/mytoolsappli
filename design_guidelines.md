# MyJantes PWA - Design Guidelines

## Design Approach: Material Design System
**Rationale**: Selected Material Design for its robust component library, proven patterns for data-dense applications, and excellent PWA support. The system's emphasis on intuitive interactions and clear hierarchy aligns perfectly with a business management tool requiring efficiency and clarity.

**Key Principles**:
- Clarity over decoration - every element serves a purpose
- Consistent patterns across client and admin experiences
- Responsive data presentation optimized for mobile and desktop
- Visual feedback for all user actions (quotes, approvals, notifications)

---

## Core Design Elements

### A. Color Palette

**Light Mode**:
- Primary: 220 80% 45% (Professional blue for trust and reliability)
- Primary Variant: 220 70% 35% (Darker blue for depth)
- Secondary: 150 60% 45% (Success green for approvals/confirmations)
- Error: 0 70% 50% (Alert red for rejections/warnings)
- Background: 0 0% 98% (Soft white)
- Surface: 0 0% 100% (Pure white for cards)
- Text Primary: 220 15% 20%
- Text Secondary: 220 10% 45%

**Dark Mode**:
- Primary: 220 75% 60%
- Primary Variant: 220 70% 50%
- Secondary: 150 55% 55%
- Error: 0 65% 60%
- Background: 220 15% 10%
- Surface: 220 12% 15%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%

### B. Typography

**Font Families**:
- Primary: Inter (body text, UI elements, data tables)
- Headings: Inter Bold/Semibold (dashboard titles, section headers)
- Monospace: JetBrains Mono (invoice numbers, IDs, timestamps)

**Type Scale**:
- Headings: text-3xl font-bold (Dashboard titles), text-2xl font-semibold (Section headers), text-xl font-semibold (Card titles)
- Body: text-base (Standard content), text-sm (Secondary info, table cells), text-xs (Metadata, timestamps)
- UI Elements: text-sm font-medium (Buttons, labels), text-xs uppercase tracking-wide (Status badges)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistency
- Component padding: p-4 (cards), p-6 (sections), p-8 (containers)
- Gaps: gap-4 (grids), gap-6 (major sections), gap-8 (page layouts)
- Margins: mb-6 (section spacing), mb-8 (major dividers)

**Grid System**:
- Admin Dashboard: 2-column layout (sidebar + main content) on desktop, stacked on mobile
- Client Dashboard: Single column with card-based layout
- Tables: Full-width responsive with horizontal scroll on mobile
- Forms: Single column max-w-2xl for optimal readability

### D. Component Library

**Navigation**:
- Admin: Fixed left sidebar (w-64) with collapsible mobile drawer, icon + text menu items
- Client: Top app bar with minimal navigation, bottom tab bar on mobile
- Both: Notification bell with badge counter, user avatar with dropdown

**Data Display**:
- Quote Cards: Elevated surface with service name, price, status badge, action buttons, timestamp
- Invoice List: Compact table view (desktop), card stack (mobile) with payment status indicators
- Reservation Timeline: Chronological view with status progression indicators
- Status Badges: Pill-shaped with color coding (pending: gray, approved: green, rejected: red, completed: blue)

**Forms & Inputs**:
- Material-style text fields with floating labels
- Outlined variant for all inputs (consistent focus states)
- Dropdowns with search functionality for service selection
- Date/time pickers with calendar overlay
- File upload with drag-and-drop zone for attachments
- Custom form builder: Drag-and-drop interface with field type selector

**Action Elements**:
- Primary Buttons: Filled with primary color (approve, submit, confirm)
- Secondary Buttons: Outlined (cancel, back)
- Icon Buttons: For compact actions (edit, delete, more options)
- FAB: Bottom-right for primary actions (new quote on admin, request quote on client)

**Notifications**:
- Toast notifications: Slide in from top-right, auto-dismiss
- In-app notification center: Dropdown panel with unread indicator
- Types: Success (green), Warning (orange), Info (blue), Error (red)
- Push notifications: PWA-enabled with service worker

**Dashboards**:
- Admin: Stats overview cards (total quotes, pending approvals, revenue), data tables with filters, quick actions toolbar
- Client: Recent activity feed, pending actions cards, services catalog access

### E. Progressive Web App Elements

**App Shell**: Persistent header with app logo, navigation, and user controls
**Offline Indicators**: Banner notification when offline, cached data view
**Install Prompt**: Bottom sheet promoting app installation
**Loading States**: Skeleton screens for data loading, spinner for actions
**Empty States**: Friendly illustrations with actionable CTAs

---

## Images

**Admin Dashboard**: No hero image - focus on data density and functionality
**Client Services Page**: Medium hero section (h-64 lg:h-80) with automotive/wheel imagery showing professional service environment
**Client Dashboard**: Optional small banner (h-32) with branded imagery for personalization
**Empty States**: Inline SVG illustrations (no external images) for empty quote lists, no reservations, etc.

---

## Interaction & Animation

**Use Sparingly**:
- Smooth transitions: 150-200ms for state changes
- Card elevation on hover: Subtle shadow increase
- Ripple effect on buttons (Material Design standard)
- Smooth page transitions: Fade with 200ms duration
- No complex animations - prioritize performance