---
source: stories/beta/DocumentBanners.stories.tsx
title: 'Document Banners/In a live pane'
blocks: 1
roundtrip: true
sourceHash: ee8feba04c080b76
---

<!-- @component -->

These banners are Studio's answer to editing mistakes that come from acting on a document whose state was misread: a single, calm strip that says, before editing, here is the unusual thing about this document.

|          |                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/panes/document/documentPanel/banners/*`, Studio-only (no design-system equivalent); all share the `Banner` chrome primitive                                                          |
| Flag     | varies per banner: `beta.variants.enabled` (variant banners), `scheduledDrafts.enabled` (scheduled-draft override), `apps.canvas.enabled` (Canvas linked). Each story tags its own gating flag                      |
| Tier     | CHROME. A document-scoped status strip. `Banner` is a pure layout atom (icon + content + right-aligned action, toned by `CardTone`); the beta banners are hook-reading shells that pick a tone/string and render it |
| Audit    | ⚪ not-audited. These beta banners post-date the pattern pass. The law they serve is `system-status-visibility`: the editor must be told when the document is in an unusual state before they act                   |
| Patterns | `document-banners`                                                                                                                                                                                                  |

Every beta feature that can put a document into a surprising state (viewing a variant, about to override a schedule, linked to Canvas) adds one, and they all speak through the same `Banner` primitive so they read as one family.

Every story renders the real `Banner` with real i18n. `VariantDefinitionNotFoundBanner` is mounted as its actual component (prop-only); the other three compose `Banner` with the same tone/icon/content/action their wrappers pass, because those wrappers only exist to read document-pane state a props-only story does not have.

> **Why it matters:** `Banner` is a pure layout atom, icon, content, right-aligned action, toned by `CardTone`. It carries no logic of its own. All the intelligence lives in the wrapper that reads document-pane state and picks the tone and string. These stories drive the primitive with fixtures rather than mounting the wrappers.
