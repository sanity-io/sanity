---
source: stories/navbar/FreeTrial.stories.tsx
title: 'Acme Content'
blocks: 1
roundtrip: true
sourceHash: 55572ce70a596707
---

<!-- @component -->

FreeTrial is the one navbar control built to persuade rather than inform: it can put itself in front of a person the moment Studio loads, without anyone asking for it.

|        |                                                                                                                                                                                                                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/components/navbar/free-trial/FreeTrial.tsx`                                                                                                                                                                                                                                                        |
| Tier   | CHROME, a conversion surface painted over the navbar. `UpsellPanel` and the free-trial leaf pieces already have prop-driven fixture stories in `Laws & Behaviors/Upsell`; this page drives the real `FreeTrial` component through `FreeTrialContext` the way the real navbar does, so it is the routing logic those pages leave out |
| Audit  | 🟡 needs-work (`interruption-cost`, `escape-hatch`). An auto-shown `modal` blocks the rest of the navbar the instant Studio boots, before any action from the person using it, and the auto-shown `popover` has no click-outside or Escape dismissal at all                                                                         |

Everything downstream of `FreeTrialContext` is server-decided: `showOnLoad`, `showOnClick`, `daysLeft`, the dialog's heading, image and CTA copy all come from a `/journey/trial` fetch that `FreeTrialProvider.tsx` performs (out of scope here, and not reproducible from this repo: it is a real backend endpoint). `FreeTrial` itself only reads whatever the context hands it and picks a branch. Answering the four questions below meant tracing that branch logic, not the server.

<details><summary><b>Days remaining has exactly one client-side boundary, and it is a plain truthiness check, not <code>daysLeft <= 0</code>.</b></summary>

`FreeTrialButtonTopbar`/`FreeTrialButtonSidebar` (`FreeTrialButton.tsx`) render `daysLeft ? t('...days-count', {count: daysLeft}) : t('...trial-finished')` for the tooltip/label, and the topbar's progress ring is gated on `daysLeft > 0 && <SvgFilledOutline />`. So `daysLeft === 0` is a real, distinct, client-derived state: different copy, ring gone. Everything else (whether a dialog auto-shows, what it says, whether one exists at all once the trial is over) is server content. The real dialog-id catalog lives in `getTrialStage()` (`__telemetry__/trialDialogEvents.telemetry.ts`), which is telemetry-only but names the actual lifecycle moments by matching literal ids: `free-upgrade-popover` (trial started), `trial-ending-popover` (ending soon), `project-downgraded-to-free` (trial ended, shown on load), `after-trial-upgrade` (post-trial, `showOnClick` only, never auto-shown). This page's fixtures use those real ids rather than invented ones.

</details>

<details><summary><b>Two different closes exist, and only one of them is actually a close.</b></summary>

`handleClose` (the X, click-outside on the modal, the secondary button, or a CTA with `action: 'closeDialog'`) calls `toggleShowContent(false)`, which sets `showDialog` to `false` and, if the dismissed dialog was the auto-shown one, fires `client.request({url: '/journey/trial/' + id, method: 'POST'})` (`FreeTrialProvider.tsx:92`), a real persistence call. But the primary CTA path (`action: 'openNext'` or `'openUrl'`, and clicking the trigger button itself) calls `closeAndReOpen()`, which is `toggleShowContent(true)`: this also fires the same POST, but sets `showDialog` to `true`, not `false`. Since `dialogToRender` is `showOnLoad ? data.showOnLoad : data.showOnClick`, and this path flips `showOnLoad` to `false`, the effect is not a close: the dialog swaps in place from the auto one to `data.showOnClick` (if one exists) while staying open. If `data.showOnClick` is null, `dialogToRender` becomes null and the whole component, badge included, disappears. This repo cannot confirm whether the server actually stops returning `showOnLoad` for a dismissed dialog id on the next fetch: the POST looks like a "mark seen" call and the endpoint shape supports that reading, but the server side of that contract is outside this codebase, so treat that half as inferred, not verified. The POST is real and observable; what it changes on the next boot is not.

</details>

<details><summary><b>Loading renders literally nothing, not a skeleton.</b></summary>

`data` starts `null` and `FreeTrial` opens with `if (!data?.id) return null`. The **Loading** story below is empty on purpose. The badge does not fade in; it pops into existence the render after the fetch resolves. Every Studio boot passes through this state.

</details>

<details><summary><b>The auto-shown modal blocks the rest of the navbar, and nobody asked for it: the headline finding.</b></summary>

The `popover` branch renders `@sanity/ui`'s `Popover` with no `modal` prop set (that prop, "blocks all pointer interaction with elements beneath the popover until closed", defaults to `false` and `FreeTrial.tsx` never sets it), so it is non-blocking, the rest of the navbar stays clickable underneath it. The `modal` branch is a real `Dialog` at its default `position: fixed`, and Studio can auto-open it with `showOnLoad` the instant the trial data resolves, before the person has clicked anything. **Trial ended (auto modal, blocks the navbar)** below reproduces it next to two decoy navbar controls so the blocking is visible, not just asserted.

</details>

> **Why it matters:** an interruption nobody asked for that also blocks the rest of the chrome is the worst combination this family can produce. A dialog that must be seen is a design choice; a dialog that also disables the search and account buttons beside it is a design accident wearing the same clothes.
