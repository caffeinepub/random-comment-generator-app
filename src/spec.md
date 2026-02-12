# Specification

## Summary
**Goal:** Restore public access to Customer View and Upload Section (no PIN), keep Admin Panel PIN-protected, add admin-controlled list lock/unlock and one-click bulk download of uploaded rating images, and improve UI theme and performance.

**Planned changes:**
- Restore the v46-like structure so Customer View and Upload Section are publicly accessible without any admin PIN/unlock.
- Update app navigation so users can switch between Customer View, Upload Section, and Admin Panel, with only Admin Panel protected by the existing admin PIN flow.
- Add a persistent lock/unlock flag per comment list ID, with Admin Panel controls to lock/unlock lists.
- Update Customer View and Upload Section to show lock status and prevent generate/bulk-generate actions for locked lists with a clear English explanation.
- Add an Admin Panel action to download all uploaded rating images in one click (single bulk download artifact/flow), with stable filenames (including userName + index/unique ID) and progress/success/failure feedback.
- Reduce UI lag by minimizing unnecessary re-renders/refetch loops and toning down expensive visual effects while keeping the UI visually appealing.
- Apply a cohesive, consistent visual theme (colors/graphics) across Customer View, Upload Section, and Admin Panel with improved readability (light/dark).

**User-visible outcome:** Users can freely use Customer View and Upload Section without any PIN, while admins unlock only the Admin Panel to manage lists (including lock/unlock) and download all uploaded rating images in one click; the app feels faster and has a more consistent look.
