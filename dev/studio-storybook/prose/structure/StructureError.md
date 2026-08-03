---
source: stories/structure/StructureError.stories.tsx
title: 'Document Pane/Structure Errors'
blocks: 4
roundtrip: true
sourceHash: 97222e0af2cd194b
---

<!-- @component -->

A component whose first act is to re-throw is making a real claim: it handles structure resolution failures, and anything else is somebody else's problem.

|          |                                                                                                     |
| -------- | --------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/components/structureTool/{StructureError,NoDocumentTypesScreen}.tsx` |
| Tier     | SERVICE                                                                                             |
| Patterns | `error-messages`                                                                                    |

These are the two full-screen states the structure tool shows instead of itself: one for a structure that will not compile, one for a schema with no document types in it. Unlike the state panes, these are not pane-shaped. There is no chain of columns left to preserve, because the thing that would have built the columns is what failed.

What it does with the errors it does own is decide, per error, whether a stack trace helps. A structure-builder error is already a well-formed sentence with a path attached, so the stack is suppressed and the path is shown as a breadcrumb. A runtime type error has no useful message on its own, so the stack is shown, run through a formatter first that breaks builder chains onto separate lines, strips bundler cruft from function names, and removes the studio's own host from URLs so its frames read as paths while third-party ones stay fully qualified. That is a component that has read a lot of these traces.

> **Why it matters:** re-throwing anything it does not recognise is the opposite of the usual instinct to catch broadly, and it is right here. A generic "something went wrong" screen shown for a specific, diagnosable failure is worse than no screen at all, because it destroys the information that would have fixed it.

<!-- @story SerializeErrorStory -->

The good case, if there is one. `SerializeError` carries a path through the structure definition and a `helpId`, so the screen can show where in the builder chain the mistake is, state the rule in a sentence, and link to the documentation for that specific rule.

No stack trace, deliberately: the builder already knows exactly what is wrong and where, and a stack would only show the internals of the serializer rather than the line the developer wrote. Note the path is rendered with a `➝` separator generated in CSS rather than in the markup, so it does not end up in a copy-paste.

<!-- @story BuildError -->

The third branch, and the one that looks like an omission until you know why. When the message contains "Module build failed", the stack is suppressed even though this is not a `SerializeError` - because in development with HMR that stack is bundler noise wrapped around the one line that matters.

A hard-coded string match on an error message is the kind of thing that gets flagged in review as fragile. It is also, here, correct: the alternative is showing a developer forty frames of bundler internals in place of a syntax error with a line number.

<!-- @story NoDocumentTypes -->

Not an error - a setup state. The schema compiled fine and simply declares no document types, so the structure tool has nothing to list. Caution-toned rather than critical, with a link to the schema documentation, because the reader is a developer partway through configuring a studio rather than someone whose studio has broken.

It is the structural twin of `NoToolsScreen` in the studio-screens family: same layout, same icon, same three-part copy, one level further in. Seen together, the two are evidence that "nothing is configured yet" is a recurring state with a house style.
