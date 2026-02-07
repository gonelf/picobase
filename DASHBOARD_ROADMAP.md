# PicoBase Dashboard Implementation Roadmap

## Project Goal
Serve PocketBase access seamlessly from the main dashboard (like Supabase) rather than redirecting to PocketBase login.

**Chosen Strategy:** Option 3 - Hybrid Approach
- Common operations → Dashboard UI
- Advanced features → PocketBase Admin
- Grow based on user demand

---

## ✅ Phase 1: Foundation (COMPLETED)

### Core Infrastructure
- [x] API route: Fetch collections (`/api/instances/[id]/collections`)
- [x] API route: Fetch records with pagination (`/api/instances/[id]/collections/[collectionId]/records`)
- [x] API route: Fetch auth users (`/api/instances/[id]/users`)
- [x] API route: Fetch instance statistics (`/api/instances/[id]/stats`)

### Dashboard Components
- [x] **QuickStats** - Overview dashboard with collection counts and record totals
- [x] **CollectionsList** - Grid view of all collections (user + system separated)
- [x] **DataBrowser** - Paginated table view of records from selected collection
- [x] **DataBrowserSection** - State manager for collections ↔ records navigation
- [x] **AuthUsersPanel** - List of authenticated users with verification status
- [x] **Advanced Settings Button** - Prominent link to PocketBase Admin UI

### User Experience
- [x] View collections and browse records without leaving dashboard
- [x] See auth users and their status
- [x] Quick statistics overview
- [x] Seamless navigation: collections → records → back
- [x] Clear path to advanced features (PocketBase Admin)

**Commit:** `feat: implement hybrid dashboard with data browser, users panel, and stats`
**Branch:** `claude/pocketbase-integration-research-nrRaT`

---

## 🚀 Phase 2: Data Management (PLANNED)

### 2.1 Record Editing
- [ ] API route: Update record (`PUT /api/instances/[id]/collections/[collectionId]/records/[recordId]`)
- [ ] Component: Inline table cell editing
- [ ] Component: Edit record modal with form validation
- [ ] Feature: Field type-aware input controls (text, number, boolean, date, etc.)
- [ ] Feature: Validation feedback for required fields
- [ ] Feature: Optimistic UI updates with rollback on error

### 2.2 Record Creation
- [ ] API route: Create record (`POST /api/instances/[id]/collections/[collectionId]/records`)
- [ ] Component: "New Record" button in DataBrowser
- [ ] Component: Create record modal with schema-based form
- [ ] Feature: Auto-populate default values from schema
- [ ] Feature: Field type validation before submission
- [ ] Feature: Success feedback and automatic refresh

### 2.3 Record Deletion
- [ ] API route: Delete record (`DELETE /api/instances/[id]/collections/[collectionId]/records/[recordId]`)
- [ ] Component: Delete button per record with confirmation
- [ ] Component: Bulk delete with multi-select checkboxes
- [ ] Feature: "Select all" on current page
- [ ] Feature: Undo toast for accidental deletions (if feasible)

### 2.4 Search & Filter
- [ ] Component: Search bar in DataBrowser
- [ ] Feature: Client-side quick filter for current page
- [ ] Feature: Server-side search using PocketBase filter syntax
- [ ] Component: Advanced filter builder (field, operator, value)
- [ ] Feature: Filter by multiple fields with AND/OR logic
- [ ] Feature: Save common filters for reuse

---

## 🔍 Phase 3: Enhanced Browsing (PLANNED)

### 3.1 Schema Viewer
- [ ] Component: Schema tab/section in collection view
- [ ] Feature: Display all fields with types, constraints, defaults
- [ ] Feature: Show required fields, unique fields
- [ ] Feature: Display indexes and options
- [ ] Feature: View relation field targets
- [ ] UI: Collapsible field details with descriptions

### 3.2 Relationship Navigation
- [ ] Feature: Detect relation fields in DataBrowser
- [ ] Component: Clickable relation values
- [ ] Feature: Navigate to related collection with filter applied
- [ ] Feature: Breadcrumb trail for navigation history
- [ ] Feature: "Back to referrer" link
- [ ] UI: Visual distinction for relation fields (link style, icon)

### 3.3 File Previews
- [ ] Feature: Detect file/image fields
- [ ] Component: Thumbnail previews in table cells
- [ ] Component: Lightbox modal for full-size image viewing
- [ ] Feature: Download button for file fields
- [ ] Feature: Support for multiple file uploads
- [ ] UI: File type icons for non-image files (PDF, ZIP, etc.)

### 3.4 Export Data
- [ ] API route: Export collection (`GET /api/instances/[id]/collections/[collectionId]/export`)
- [ ] Component: Export dropdown (CSV, JSON, Excel)
- [ ] Feature: Export current page vs. all records
- [ ] Feature: Export with current filters applied
- [ ] Feature: Column selection for export
- [ ] Feature: Download progress indicator for large datasets

---

## 👥 Phase 4: User Management (PLANNED)

### 4.1 User Actions
- [ ] API route: Update user (`PATCH /api/instances/[id]/users/[userId]`)
- [ ] Component: Enable/Disable user toggle
- [ ] Component: Verify email button
- [ ] Feature: Send password reset email
- [ ] Feature: Delete user with confirmation
- [ ] Feature: Update user role/permissions (if applicable)

### 4.2 User Details Modal
- [ ] Component: User detail modal
- [ ] Feature: Full user profile view (all fields)
- [ ] Feature: User activity log (recent logins, actions)
- [ ] Feature: Edit user profile fields
- [ ] Feature: View user's related records (if relations exist)
- [ ] UI: Tabbed interface (Profile, Activity, Related Data)

---

## ⚡ Phase 5: Performance & UX (PLANNED)

### 5.1 Real-time Updates
- [ ] Feature: WebSocket connection to PocketBase instance
- [ ] Feature: Live updates when records change
- [ ] Feature: Visual indicator for stale data
- [ ] Feature: Manual refresh button
- [ ] Feature: Auto-refresh interval (configurable)
- [ ] UI: "New data available" toast with refresh action

### 5.2 Bulk Operations
- [ ] Component: Checkbox column in DataBrowser
- [ ] Component: Bulk action toolbar (appears when items selected)
- [ ] Feature: Select all on page
- [ ] Feature: Select all matching filter (with limit)
- [ ] Feature: Bulk delete with count confirmation
- [ ] Feature: Bulk update (set field value for all selected)
- [ ] Feature: Bulk export selected records

### 5.3 Advanced Pagination
- [ ] Component: Items per page selector (10, 20, 50, 100)
- [ ] Component: Jump to page input
- [ ] Component: Page range selector (e.g., "1-20 of 1,432")
- [ ] Feature: Remember pagination preferences per collection
- [ ] Feature: "Load more" infinite scroll option
- [ ] UI: Pagination summary (showing X-Y of Z records)

---

## 📊 Implementation Priority

### High Priority (MVP++)
1. **Record Editing** (2.1) - Core functionality users need daily
2. **Record Creation** (2.2) - Complete CRUD operations
3. **Search & Filter** (2.4) - Essential for usability with large datasets
4. **Record Deletion** (2.3) - Complete CRUD operations

### Medium Priority (Quality of Life)
5. **Schema Viewer** (3.1) - Reduces need to open PocketBase Admin
6. **User Actions** (4.1) - Basic user management from dashboard
7. **Advanced Pagination** (5.3) - Better UX for large datasets
8. **Export Data** (3.4) - Frequently requested feature

### Lower Priority (Nice to Have)
9. **File Previews** (3.3) - Visual enhancement
10. **User Details Modal** (4.2) - Detailed user management
11. **Relationship Navigation** (3.2) - Advanced navigation
12. **Bulk Operations** (5.2) - Power user feature
13. **Real-time Updates** (5.1) - Adds complexity, evaluate need

---

## 🎯 Success Metrics

### Phase 1 (Completed)
- ✅ Users can browse collections without PocketBase Admin
- ✅ Users can view records in table format
- ✅ Users can see auth users and verification status
- ✅ Users can access advanced features via clear button

### Phase 2-5 (Planned)
- Users complete 90%+ of daily tasks in dashboard (not PocketBase Admin)
- Reduced support requests for "How do I view my data?"
- Faster record editing workflow vs. PocketBase Admin
- User retention improvement (less friction)

---

## 📝 Technical Notes

### API Design Patterns
- All routes follow `/api/instances/[id]/...` pattern
- Authentication via session (getSession)
- Proxy to Railway service → PocketBase instance
- Error handling with user-friendly messages
- Pagination support via query params (`page`, `perPage`)

### Component Architecture
- Client components for interactivity (`'use client'`)
- Server components for data fetching (instance detail page)
- State management within components (useState, useEffect)
- Loading states and error handling
- Optimistic UI updates where applicable

### Railway Integration
- Continues to work perfectly (no changes needed)
- All features are frontend/API layer
- Proxy architecture handles all PocketBase communication
- No infrastructure changes required

---

## 🚧 Next Steps

1. **Start with Phase 2.1 (Record Editing)** - Most requested feature
2. **Test thoroughly** - Each feature should be tested before moving to next
3. **Gather user feedback** - Validate priorities with actual usage
4. **Iterate** - Adjust roadmap based on user needs
5. **Document** - Add user-facing docs for each feature

**Current Status:** Phase 1 complete, ready to begin Phase 2.1

---

**Last Updated:** 2026-02-07
**Branch:** `claude/pocketbase-integration-research-nrRaT`
