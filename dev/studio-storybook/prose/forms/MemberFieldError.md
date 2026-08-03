---
source: stories/forms/MemberFieldError.stories.tsx
title: 'Book'
blocks: 1
roundtrip: true
sourceHash: 4cdf18154721fa44
---

<!-- @component -->

When the form store cannot build a normal field because the value and the schema disagree, one component decides what an author sees in its place, and for two of the six ways that disagreement can happen, what they see is a component telling them something unexpected occurred when the type system saw it coming.

|             |                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `packages/sanity/src/core/form/members/object/MemberFieldError.tsx`                                                                    |
| Tier        | CORE. What an author is shown when the content in the document does not fit the schema the studio is running                           |
| Audit       | 🟡 needs-work (`error-recovery`). Two of the six declared error types reach a fallback that calls them unexpected and offers no repair |
| Patterns    | `error-recovery`                                                                                                                       |
| Error union | 6 members, closed, all public, all listed in the docblock on `FieldError["error"]`                                                     |

The field-level error renderer. The stories cover the **whole input domain**, not a selection from it, since the union is closed and every member is exercised below.

**What reading it turned up.** The component branches on four of the six by name and lets the other two fall through to:

```
return <Box>{t('member-field-error.unexpected-error', {error: props.member.error.type})}</Box>
```

`TYPE_ANNOTATION_MISMATCH` and `UNDECLARED_MEMBERS` are not unexpected. They are declared in the same union, in the same file, and named in the same docblock as the four that are handled. An author who hits one is told the studio met something it did not anticipate, when in fact it is a case the type system anticipated and the renderer did not.

The four handled cases each get a dedicated alert with a repair action. The two unhandled ones get a bare string inside a `Box`, with no `Text` wrapper, no tone, no icon and nothing to do about it.

> **Why it matters:** these are the errors an author meets after a schema change, which is exactly when they are least able to tell whether the problem is their content or someone else's deploy. Half the vocabulary answers that question and half of it says "unexpected".
