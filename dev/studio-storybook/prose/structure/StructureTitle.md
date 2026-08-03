---
source: stories/structure/StructureTitle.stories.tsx
title: 'Article'
blocks: 2
roundtrip: true
sourceHash: 0cba14562a0d448f
---

<!-- @component -->

Three tabs open on three different documents of the same type can be indistinguishable in a browser's tab strip, because a structure-builder-configured static title wins over every document's own identity.

|          |                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/structure/components/structureTool/StructureTitle.tsx`                                                                                                                                  |
| Tier     | CORE. This sets the browser tab title for the whole structure tool. It is the one piece of the product that survives into bookmarks, browser history, session restore, and screenshots of somebody's tab bar |
| Audit    | 🔴 needs-work (`similarity`). See `SameTypeThreeTabsCollapse` below                                                                                                                                          |
| Patterns | `similarity` · `identity`                                                                                                                                                                                    |

Three functions in one file, all of which return null and do their real work in an effect that assigns the document title. Nothing here is visible by rendering it, so every story below reads the title back out of the real DOM element rather than rendering a guess.

```
// StructureTitle(resolvedPanes) - picks WHICH of the two below runs, off the LAST pane only
if (!resolvedPanes?.length) return null                          // untouched, no effect at all
if (isLoadingPane(lastPane)) return <PassthroughTitle />         // base title only
if (isDocumentPane(lastPane)) {
  if (lastPane?.title) return <PassthroughTitle title={lastPane.title} />
  return null                                                   // <DocumentTitle> (mounted separately
}                                                                // inside DocumentPaneProvider) governs instead
return <PassthroughTitle title={lastPane?.title} />

// DocumentTitle({isDeleted, displayed, ready, schemaType}) - the document's OWN resolved title
const documentTitle = isDeleted ? ''
  : isNewDocument ? t('New {{schemaType}}')
  : value?.title || t('Untitled')
useEffect(() => { if (!ready || previewValueIsLoading) return; document.title = newTitle })
```

This effect only ever reads the last resolved pane. Opening Content, Articles, "Quarterly Planning Review" produces a tab reading just "Quarterly Planning Review, Acme Studio", never the full breadcrumb, matching the component's own unit test.

> **Why it matters:** the document's own title effect is mounted unconditionally inside every real document pane, separate from this one. The two coordinate only by both writing the same global tab title; whichever effect commits last wins. And the document's own effect never reads the preview's error state at all, only its value and loading flag: a genuinely broken preview subscription is not just indistinguishable from an empty title, it is architecturally incapable of being distinguished here.

<!-- @story SameTypeThreeTabsCollapse -->

Read top to bottom: three different documents produce one indistinguishable tab title when the pane has a static title, and three distinguishable ones when it does not.
