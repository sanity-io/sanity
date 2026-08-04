---
source: stories/navbar/HomeButton.stories.tsx
title: 'Acme Content'
blocks: 1
roundtrip: true
sourceHash: 9562147628a83aee
---

<!-- @component -->

HomeButton is the leftmost control in the Studio navbar: a quiet anchor that shows the active workspace's icon, or its title initial, and links back to the workspace root. It is the one persistent "you are here, take me home" affordance in the shell.

|         |                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source  | `packages/sanity/src/core/studio/components/navbar/home/HomeButton.tsx`                                                                                                              |
| Tier    | CHROME. It frames and navigates the editing surface; it is not the editing                                                                                                           |
| Harness | reads `useActiveWorkspace()`, which `WithStudioProviders` omits, so this story wraps it in `NavbarProviders` (`lib/navbarHarness.tsx`) to seed the active workspace and color scheme |
