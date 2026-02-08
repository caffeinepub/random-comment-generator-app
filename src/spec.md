# Specification

## Summary
**Goal:** Make single-comment generation history completely independent per device, even when the same Internet Identity principal is used on multiple devices, by introducing a locally-generated device identifier and using it to scope history in both frontend and backend.

**Planned changes:**
- Frontend: generate and persist a per-device identifier in browser storage (resetting automatically when storage is cleared) and pass it through existing query/mutation flows without editing immutable hook files.
- Backend: store and retrieve single-comment history keyed by (caller principal, device identifier, listId), rejecting missing/empty device identifiers with a clear English error.
- Backend: extend/add device-scoped history API(s) used by the Customer/User view, without changing bulk generation behavior or coupling it into per-device single-comment history.
- Frontend: update React Query usage and Customer/User view so “Your History” and per-list “already generated” indicators reflect only the current device’s history.
- Frontend: mirror device-scoped history in local storage, initialize UI state from it on reload, and reconcile with backend for the same device identifier (clearing/treating as empty when deviceId resets).
- Backend: persist the new per-device history structure in stable state and add a conditional, repeat-safe upgrade migration that preserves legacy per-principal history by placing it into a deterministic legacy/default device bucket.

**User-visible outcome:** When logged in on multiple devices with the same Internet Identity, each device shows and updates its own independent single-comment history and “already generated” indicators; clearing browser storage resets that device’s history scope.
