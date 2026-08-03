---
source: stories/structure/DocumentHeaderTitle.stories.tsx
title: 'Article'
blocks: 2
roundtrip: true
sourceHash: 62de5fd627759e1b
---

<!-- @component -->

The loading state and a real document a reviewer left blank render the identical string, in the identical muted grey. Nothing on screen tells the difference between still connecting and someone needs to fix this.

|          |                                                                                             |
| -------- | ------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/panes/document/documentPanel/header/DocumentHeaderTitle.tsx` |
| Tier     | CORE, the title above every open document, one of the most-read strings in the product      |
| Audit    | 🔴 needs-work (`similarity`). See `LoadingAndBlankTitleCollapse` below                      |
| Patterns | `similarity` · `empty-states`                                                               |

Five return statements, read top to bottom, decide what shows in the header:

```
if (connectionState === 'connecting' && !subscribed) return <></>                 // L23-25
if (title) return <>{title}</>                                                    // L27-29
if (!documentValue) return <>{t('...new.text', {schemaType})}</>                  // L31-39
if (error) return <>{t('...error.text', {error})}</>                              // L41-43
return hasMaximizedPane ? <Breadcrumb/> : documentTitle || <Untitled/>            // L45-57
```

The last line's two variables come from a second hook the component also calls at the top, which reads the same context again and runs its own, independent set of guards, connecting, no value, error, against a different field than the checks above it use. Two near-identical guard ladders, fed from two different fields off the same context.

> **Why it matters:** the pane's own document value always resolves to at least an id and a type, never to something falsy. That makes this component's own first and third guards unreachable through any real document pane, see the two-branches story below. Every case an author actually sees, new, loading, blank, titled, erroring, is decided entirely by the second, nested hook. The component's own unit test independently confirms this: its default props never set a value, so three of its nine cases land on the dead branch while their own descriptions claim to test the other hook's result.

<!-- @story LoadingAndBlankTitleCollapse -->

Read top to bottom: two genuinely different document states render identically, and the one case that reads differently is right there for comparison.
