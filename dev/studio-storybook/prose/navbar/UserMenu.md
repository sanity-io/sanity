---
source: stories/navbar/UserMenu.stories.tsx
title: 'Acme Content'
blocks: 1
roundtrip: true
sourceHash: b3d94db588f2af09
---

<!-- @component -->

UserMenu is the signed-in identity control at the right of the navbar: it shows the current user's avatar and opens the personal menu, profile, the appearance and locale preferences, and sign out.

|         |                                                                                                                                                           |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source  | `packages/sanity/src/core/studio/components/navbar/userMenu/UserMenu.tsx`                                                                                 |
| Tier    | CHROME                                                                                                                                                    |
| Harness | reads the current user from the workspace source, which the studio harness seeds with a mock user, so it renders a real signed-in avatar and menu offline |
