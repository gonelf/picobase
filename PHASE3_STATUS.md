# Phase 3: Auth & Dashboard — Status Report

**Date:** 2026-02-08
**Conclusion:** Phase 3 is **NOT complete**. 2 of 5 deliverables are implemented (one partially), 3 are entirely missing.

---

## Deliverable Status

### 1. Auth Provider Configuration UI — PARTIAL

**Plan:** Separate dashboard pages at `app/dashboard/[instanceId]/settings/auth/` with `page.tsx`, `providers/page.tsx`, `emails/page.tsx`.

**Actual:** A single page at `app/dashboard/projects/[id]/auth/page.tsx` using a tab-based UI (`AuthDashboard.tsx`) with three tabs: Users, Settings, Providers. The functionality is present but the structure differs from the plan (tabs vs. separate routes).

**Key files:**
- `app/dashboard/projects/[id]/auth/page.tsx`
- `components/AuthDashboard.tsx`
- `components/AuthSettingsPanel.tsx`
- `components/AuthProvidersPanel.tsx`
- `components/AuthUsersPanel.tsx`
- `app/api/instances/[id]/auth-settings/route.ts`

---

### 2. OAuth Provider Setup Flow — DONE

Fully implemented in `components/AuthProvidersPanel.tsx`. Supports 6 providers:
- Google, GitHub, Discord, Microsoft, Apple, Twitter

Each provider is configurable with client ID, client secret, auth URL, token URL, and user info URL. Includes enable/disable toggles and save functionality via PocketBase settings API.

---

### 3. Email Template Editor — NOT IMPLEMENTED

No email template editor exists. `AuthSettingsPanel.tsx` handles email/password toggles, email requirement settings, and domain restrictions, but does not include any template editing capability.

**Missing:**
- UI for editing verification email templates
- UI for editing password reset email templates
- UI for editing email change confirmation templates
- API endpoint for managing email templates

---

### 4. Webhook Configuration for Auth Events — NOT IMPLEMENTED

No webhook infrastructure exists. The `onSignUp`, `onSignIn`, and `onPasswordReset` event hooks described in the plan have no implementation.

**Missing:**
- Webhook URL configuration UI
- Event selection UI (which auth events trigger webhooks)
- Webhook testing/validation
- API endpoint to configure webhooks
- Backend logic to fire webhooks on auth events

---

### 5. Pre-built Auth UI Components (`@picobase/react`) — NOT IMPLEMENTED

The `@picobase/react` package does not exist. Only the vanilla TypeScript SDK (`packages/client/`) is implemented.

**Missing:**
- `packages/react/` directory
- `AuthForm` drop-in React component
- `useAuth` React hook
- Any React-specific wrappers or providers

---

## Summary

| Deliverable | Status |
|---|---|
| Auth provider configuration UI | Partial |
| OAuth provider setup flow | Done |
| Email template editor | Missing |
| Webhook configuration for auth events | Missing |
| `@picobase/react` package | Missing |

**Remaining work to complete Phase 3:**
1. Build an email template editor in the dashboard (verification, password reset, email change templates)
2. Implement webhook configuration UI and backend for auth events
3. Create the `@picobase/react` package with `AuthForm` and `useAuth`
