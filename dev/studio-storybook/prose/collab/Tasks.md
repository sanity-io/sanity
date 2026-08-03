---
source: stories/collab/Tasks.stories.tsx
title: 'September launch announcement'
blocks: 1
roundtrip: true
sourceHash: a756f134f250d947
---

<!-- @component -->

Content has no named stages between draft and published, and Tasks, the closest thing Studio has to workflow, is a binary To Do/Done checkbox: state a team can neither see nor enforce.

|        |                                                                                                                                                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/tasks/`. Studio-only, no DS equivalent                                                                                                                                                       |
| Tier   | SERVICE. The editorial-coordination layer (assignments, due dates, document targets) in the Studio sidebar; it orchestrates work around documents without being part of the edit loop                                  |
| Audit  | 🔴 needs-work (`editorial-workflow-states`). `TASK_STATUS` in `packages/sanity/src/core/tasks/constants/TaskStatus.tsx` defines exactly `open` ("To Do") and `closed` ("Done"). No in-progress, no review, no approval |

The stories mount the **real** `TasksList` (the tasks sidebar's list body) over fixture task documents. Assignee avatars resolve through the real `createUserStore` against a fixture-serving client; the document target chip resolves through the real preview pipeline (`useDocumentPreviewValues`) against a fixture universe. The status checkbox runs the real `useTaskOperations().edit()` against a stubbed addon-dataset client: toggling resolves, but the fixture list is static, so items do not move between groups.

Harness notes: the three tasks singleton contexts (`TasksEnabledContext`, `TasksContext`, `TasksNavigationContext`) are value-seeded by `TasksStoryHarness` in `lib/mockCollabFixtures.tsx`, mirroring what `TasksProvider` and `TasksNavigationProvider` assemble at runtime, so empty states, which read the active sidebar tab from navigation context, render for real. Due dates are load-time offsets: the "due today" red treatment renders identically on any day.
