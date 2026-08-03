---
source: stories/forms/ObjectInputMember.stories.tsx
title: 'Plain field'
blocks: 1
roundtrip: true
sourceHash: 99bb0692761e6b39
---

<!-- @component -->

Every field, fieldset and field-level error inside every object and document form passes through one dispatcher, and the interesting part is the fifth branch, the one the compiler has already marked unreachable.

|        |                                                                                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/form/members/object/ObjectInputMember.tsx`                                                                                          |
| Tier   | CORE. Every field, fieldset and field-level error inside every object and document form passes through this dispatcher                                        |
| Audit  | 🟢 holds. All four declared member kinds are handled and render distinctly. The one structural finding is a dead branch, not a defect (see `Unhandled` below) |
| Kinds  | 4, closed union (`store/types/members.ts:9`), plus one type-system-unreachable fallback                                                                       |

`ObjectInputMember` takes one `ObjectMember` and switches on `member.kind` to decide what to draw: a field, a fieldset, a field-level error, or a schema-injected decoration. It renders nothing itself; every branch delegates to a sibling renderer (`MemberField`, `MemberFieldSet`, `MemberFieldError`, `MemberDecoration`).

**What reading it turned up.** `ObjectMember` is a closed union of exactly four kinds, and the component has one `if` per kind:

- `member.kind === 'decoration'` maps to `MemberDecoration`, wrapped in a `FormRow`
- `member.kind === 'field'` maps to `MemberField`
- `member.kind === 'error'` maps to `MemberFieldError`
- `member.kind === 'fieldSet'` maps to `MemberFieldSet`

That is the domain, and after it the component still carries a fifth path: a `//@ts-expect-error`-suppressed `console.warn` followed by `return null`. The suppressed error is TypeScript telling the author the line is unreachable: with all four kinds excluded, `member.kind` narrows to `never`. The four stories below each drive a real document through the real `useFormState` resolver so the `member` each one hands to the component is genuine, not hand-forged; the fifth story forces an invalid `kind` past the type system to show what the dead branch actually does.

> **Why it matters:** the branch is not wrong to keep. Nothing in the type system stops a future member kind, or a corrupted value crossing a serialization boundary, from reaching this component at runtime, and a silent `null` with a logged warning is a reasonable failure mode for that. It is worth flagging precisely because it is dead **by the compiler’s own admission** while still doing real defensive work, the kind of code a lint rule would flag and a careless pass would then delete.
