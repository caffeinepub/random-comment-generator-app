# Specification

## Summary
**Goal:** Add a Live List Checker feature where admins manage a name list, claims, limits/totals, and public contact info, and users can check/claim names with UPI ID and track claim status.

**Planned changes:**
- Add backend models and APIs to store/manage an admin-provided name list, create and track name claims (available/pending/approved/rejected), prevent duplicate claims, and record claimant identifier, timestamp, and UPI ID.
- Add backend admin settings for claim limits and per-claim amount, enforce limits during claim creation, and expose computed totals derived from claims.
- Add backend storage and APIs for admin-managed public contact info (including WhatsApp number) and ensure all new state survives upgrades via migration handling.
- Extend frontend React Query hooks (following existing patterns) for all Live List Checker operations: list upload/fetch, claim creation/status lookup, admin claim queue + approve/reject, limits/totals, and contact info get/set.
- Add a user-facing Live List Checker UI to enter a name, see availability, submit a claim with required UPI ID, view clear “taken” errors, and see claim status plus displayed contact info.
- Extend the Admin Panel with a Live List Checker section to upload/replace the list, view/filter claims, approve/reject, set limits and per-claim amount, view totals, and edit contact info.
- Apply a distinct but consistent Tailwind/Shadcn visual theme for this feature (not blue/purple), with clear status badges and accessible English messaging.

**User-visible outcome:** Users can check a name’s availability, submit a claim with their UPI ID, and track status; admins can manage the name list, review and approve/reject claims, configure limits and per-claim amount, view totals, and update public contact info (including WhatsApp number).
