# Specification

## Summary
**Goal:** Overhaul the Comment Rating Studio app with a green-blue theme, redesign the UploadSection into three cards, implement a backend access key system, and add an Access Keys management tab to the AdminPanel.

**Planned changes:**
- Apply a dark teal/navy-green base background and deep teal → cyan → emerald gradient accents consistently across the Navbar/Header, UserView, UploadSection, LiveListChecker, and AdminPanel, removing all leftover purple/generic colors
- Redesign UploadSection into three cards: (1) Upload Comment card with a textarea, (2) Bulk Comment Generator card with an access key gate, and (3) Upload Rating Image card with a name input and file picker; add an animated background with floating green-blue geometric particles behind the cards
- Add a stable `accessKeys` collection to `backend/main.mo` with fields for id, label, and keyString; expose `validateAccessKey` (public), and `createAccessKey`, `updateAccessKey`, `deleteAccessKey`, `listAccessKeys` (admin-only)
- In the Bulk Comment Generator card, require the user to enter an access key, call `validateAccessKey` on the backend, show an error and block generation if invalid, and unlock the generator for the session if valid
- Add an "Access Keys" tab to the AdminPanel with a full CRUD UI: list all keys (label + key string), create new keys via a form, inline edit existing keys, and delete keys with immediate invalidation

**User-visible outcome:** The entire app displays a vibrant green-blue theme; the UploadSection has three distinct cards with an animated particle background; users must enter a valid access key to use the Bulk Comment Generator; admins can create, edit, and delete access keys from a dedicated tab in the AdminPanel.
