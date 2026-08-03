---
source: stories/screens/NotAuthenticatedScreen.stories.tsx
title: 'Navbar & Shell/Screens/Not Authenticated'
blocks: 4
roundtrip: true
sourceHash: 577bc4f7b04dfdfb
---

<!-- @component -->

This is the screen for someone who is signed in and still not allowed in. Not a login prompt: the authentication worked, the authorization did not.

|        |                                                                      |
| ------ | -------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/screens/NotAuthenticatedScreen.tsx` |
| Tier   | SERVICE                                                              |

It is the only screen in this family rendered as a `Dialog` rather than a card, with a single "Sign out" action.

> **Why it matters:** the second paragraph is the design, and it exists because of a specific, common, invisible mistake. Someone with two accounts - a personal Google login and a work SSO one - lands here and reasonably concludes they have not been invited to the project. In fact they have; they are simply signed in as the wrong person. So the screen names who you currently are, in bold, with the email and the identity provider you used, and only then offers to sign you out. It converts "you cannot come in" into "check which key you are holding", which is the actual problem far more often than the permissions are.

Note the ordering of the two paragraphs: what happened first, how to check it second. And the one action is Sign out rather than "Request access" - because the likely fix is to come back as someone else, not to escalate.

**A thing to notice about the first render.** `currentUser` starts as `null` and is filled in when the auth observable emits, so for one frame the sentence reads "signed in as ( )" with an empty name, empty email and no provider. With a synchronous store you will not catch it; over a slow auth request you will. There is no skeleton or guard on that paragraph.

<!-- @story Default -->

The ordinary case: a real user, authenticated through Google, without access to this project. `getProviderTitle` turns the provider id into "Google" so the sentence ends "…through Google." rather than naming an internal identifier.

<!-- @story SsoUser -->

An enterprise SAML provider. `getProviderTitle` has no friendly name for it, so the provider clause is omitted entirely and the sentence simply ends after the email. That is the right degradation - better a shorter true sentence than one ending in a raw provider slug.

<!-- @story BeforeUserResolves -->

The first-frame state, held still. The auth observable has emitted no user, so the paragraph that exists to tell you which account you are using renders as "signed in as ( )" - name blank, email blank, provider clause gone.

It is a real state rather than a hypothetical: it is what a slow or failing auth request leaves on screen. And it is the worst possible moment for it, because this is precisely the screen whose whole purpose is answering "which account am I?". No skeleton, no fallback text, no guard on the render.
