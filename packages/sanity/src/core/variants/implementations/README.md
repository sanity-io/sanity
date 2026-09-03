# Client-side variant conditions

Notes for the implementations team. Variants are beta and this API is `@internal`. You can ship it in a studio today. Do not treat it as a platform contract.

Conditions should come from the project, not from whoever typed into the dialog.

## The problem

A variant definition stores conditions as free-form pairs. `audience: loyal`. `locale: en-US`. Fine for a demo. Useless once the real audiences live in a CDP.

What we keep running into:

- A CDP or experiment tool already owns the dimensions and values
- The frontend already queries those same keys
- Editors invent parallel names if the studio lets them type
- Content agents cannot see a hard-coded picker, and they cannot see the CDP either

Two things go wrong if the studio does not know the list. Editors drift: `loyal`, `loyal-customers`, `Loyal Customers`. And when the upstream list changes, old pairs sit on the definition with no signal that they are stale.

The meeting put it this way. Upstream changes should become something the studio can remap or review. Silent breaks are how you get a week of "why is this variant empty."

## What we shipped

You can declare the known conditions on the workspace:

```ts
beta: {
  variants: {
    enabled: true,
    conditions: [
      {
        name: 'audience',
        title: 'Audience',
        description: 'Who this content is for.',
        values: [
          {value: 'loyal', title: 'Loyal customers'},
          {value: 'new', title: 'New visitors'},
        ],
      },
      {
        name: 'locale',
        title: 'Locale',
        values: ['en-US', 'nb-NO'],
      },
    ],
  },
}
```

`conditions` can also be a function. It gets `projectId`, `dataset`, and `getClient`. It may return a promise. That is how you load from a CDP, a document, or any HTTP API the studio can reach. It does not get `currentUser`, `schema`, or `i18n`.

```ts
beta: {
  variants: {
    enabled: true,
    conditions: async (context) => {
      const client = context.getClient({apiVersion: '2024-01-01'})
      // or fetch('https://your-cdp.example/audiences')
      return loadConditions(client, context.dataset)
    },
  },
}
```

Or point it at a deployed PubSub Sanity Function. The studio calls `client.functions.invoke(name, {event: {data: {projectId, dataset}}}, {sync: true})` with the editor's session and expects the handler to return the same array shape. Secrets stay on the server, and agents or the App SDK can call the same function.

```ts
beta: {
  variants: {
    enabled: true,
    conditions: {function: 'audience-conditions', stackId: 'ST-xxxxxxxx'},
  },
}
```

`stackId` is optional if the studio client config already carries one. `organizationId` and `timeout` are also accepted and passed straight to `invoke`. If the handler returns something other than an array, the studio treats it as a load error.

Functions are included on every plan, but Free has a hard monthly cap and no overage. The static array and the browser function stay supported; pick whichever fits the project.

When `conditions` is set:

- The create/edit dialog is a card picker. Keys and values must come from the list. You cannot type a new name.
- The function (browser or Sanity Function) runs when the form, overview, detail page, or navbar needs the list. Not at studio boot. One resolve is shared. A slow CDP does not stall the rest of the studio.
- If the load fails, the form shows an error and Retry. It does not fall back to free text.
- Stored pairs that are no longer in the list get flagged. [Mismatch validation](#mismatch-validation) has the copy and the screens.
- `title` and `description` are optional. What we persist is still `name` + `value`, like `audience` / `loyal`.
- The config is not composable. Last defined value wins, root over plugins, same as `beta.variants.enabled`.

Leave `conditions` unset and you still get the old free-text autocomplete. Suggestions come from existing variant documents. We do not check those names against a list.

The `/test` workspace in test-studio points at the `audience-conditions` function (`dev/test-studio/sanity.config.ts`). Set `SANITY_STUDIO_VARIANT_CONDITIONS=browser` to use the in-browser resolver instead.

## Mismatch validation

Once `conditions` is set and the list has loaded, the studio walks each stored pair on a `system.variant` document. Studio UI only. We do not rewrite the document. The content API does not care.

A pair is a mismatch in two cases.

**Unknown key.** The stored key is not in the list. The document still has `legacy: old-value` after `legacy` left the config.

**Unknown value.** The key exists, the value does not. `audience: vip` after someone dropped `vip`.

Missing configured keys are fine. A variant that only uses `audience` is valid even if the list also has `locale`. We are not requiring a full matrix.

We skip the check, no icon, when:

- `conditions` is unset
- the function is still loading
- the function failed. The form shows error + Retry. Overview, detail, and the navbar stay quiet so we do not flash a false stale state.

The editor can still select an invalid variant and open it. We do not lock document create or edit under a stale definition. We also do not put this error on document-pane chips, the inventory picker, the release table, or the navbar trigger. Those can wait.

### What the editor sees

**Overview table.** Critical icon on the title cell if the row has any mismatch.

| Case                   | Tooltip                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| One unknown key        | `The condition "legacy" is not in the configured list. Edit the variant to fix it.`       |
| One unknown value      | `The value "vip" is not valid for "audience". Edit the variant to fix it.`                |
| Two or more mismatches | `This variant uses conditions that are no longer configured. Edit the variant to fix it.` |

**Detail page.** Same icon, on the mismatched condition's value. Tooltip is the single-key or single-value line for that row, never the "multiple" line. One good pair and one stale pair means only the stale row is marked.

**Navbar variants menu.** Same icon on the menu item. Tooltip matches the overview, including the "multiple" line when needed. Click still selects the variant. The trigger next to the menu does not show the icon.

**Create / edit form.** Errors show as soon as the list is ready, not after Save.

- Unknown key. The key card goes critical. `The condition "legacy" is not in the configured list. Edit the variant to fix it.`
- Known key, unknown value. The value card goes critical. `The value "vip" is not valid for "audience". Edit the variant to fix it.`
- The stale pair stays visible. Pick a configured pair or remove the row. You cannot type your way out.
- Save stays blocked until every row is a configured pair.

Save is also blocked while the list is not ready.

| Form state                         | What shows                            | Save                                            |
| ---------------------------------- | ------------------------------------- | ----------------------------------------------- |
| List loading                       | `Loading conditions` and skeletons    | Blocked                                         |
| List failed                        | `Unable to load conditions` and Retry | Blocked                                         |
| List ready, stale pair             | Critical card and the mismatch line   | Blocked                                         |
| List ready, every pair in the list | Normal selected cards                 | Allowed, if title and the other form rules pass |

## Why this shape

We talked about hard-coding slots in the UI. Audience, locale, whatever is fashionable this quarter. That UI dies the first time a customer adds an axis we did not name.

A configured list is the thing we can actually keep up with. Static array or a function that fetches. The picker can still use titles and descriptions. Persistence does not change. Variants still store `Record<string, string>`.

This is client-side only. The studio resolves the list in the browser. There is no server-side schema for conditions. That is on purpose. A developer can point the studio at a list or a fetch without waiting on Functions, blueprints, or the content agent.

## What this does

**Editors stop inventing names.** Configure the list and they pick from it. That is the studio win. The rest is support for that.

**A CDP can drive the picker.** The function runs when someone needs the list. Change the upstream API and you do not need a studio deploy. Change the studio config itself and you still do.

**A failed fetch is visible.** The dialog says so and offers Retry. We do not quietly let people type anything.

**A list that moved shows up as work.** Stale pairs get an error on the overview, detail page, navbar menu, and the form. [Mismatch validation](#mismatch-validation) has the exact strings.

**The content agent is not a blocker for this.** Agents cannot see a browser-only function. That is fine. This work is for editors. Agent access is later. Do not hold the picker for it.

## What this does not do

Read this part if you are about to demo it.

**It is not a server-side source of truth.** Query APIs, Presentation, and anything outside the studio browser never see this list. The content API matches on whatever is stored on the variant. If the frontend asks for `audience: loyal` and the document says `audience: loyal`, it matches, even if the CDP deleted `loyal` yesterday.

**Content agents cannot call this function.** The list lives in studio config and runs in the client. An agent that only sees documents and schema still cannot enumerate valid audiences unless you also store that list as documents. Do not sell this as "the agent now knows your CDP."

**It is not a Sanity Function or blueprint proxy.** We talked about a helper that fetches external data so the studio and later agents do not each invent an HTTP client. Most of that primitive exists already as PubSub functions plus `client.functions.invoke()`. [proposal.md](./proposal.md) describes the general pattern (server-side resolvers for any studio config callback, variant conditions being the first) and what we are asking the functions team for. Nothing in this branch deploys or calls a function. When that lands, the studio still has to accept the static array and this config function. Functions are on Free with a hard monthly cap; not every project will deploy a blueprint.

**Documents-as-the-list is a workaround.** If the agent must see the same values, keep a document the studio function reads. The agent can query it. You also get two writes, a sync job, and an argument about which document is canonical. Use it if you have to. Do not call it the model.

**We do not remap existing variants.** Changing the configured list does not rewrite `system.variant` documents. Old keys and values stay until someone edits them. The studio flags those pairs and blocks save. It will not fix them for you.

**We do not enforce conditions on document content.** Adding a document to a variant is unchanged. Editing a document under a stale definition still works.

**No fixed query slots, no latency story.** Multi-dimensional perspectives still persist as a flat map. "Fixed slots" for common axes, and anything about query planning, is product and API work on top of this.

**Schema serialization is unchanged.** Putting this on the server, closer to how RSC fetches, would make the list available to agents and keep the fetch out of the studio bundle. We did not do that.

## How to put this on a project

1. Enable variants. `beta.variants.enabled: true`.
2. Decide who owns the list. Small and stable: static array in `sanity.config`. Lives in a CDP or another service: async function.
3. Persist stable ids in `name` / `value`. Human copy goes in `title` / `description`. The API and the frontend should use the ids.
4. Keys must match `^[a-z][a-z0-9_-]{0,63}$`. Values cannot contain commas. Invalid entries are dropped from the picker. You get a console warning.
5. The function runs in the editor's browser. CORS, auth, and secrets have to work from the studio origin. Do not put private CDP credentials in client config.
6. If the external API is not browser-safe, use a backend you already trust. Your app, a webhook, later a function proxy. This config will not invent that.
7. Leave `conditions` unset only while the project is still naming things. Once they have a real taxonomy, configure it. Mixed free-text and configured lists across workspaces is fine. Inside one workspace, last config wins.

## Suggested pitch

> Point the studio at your real condition list. Static, or fetched when an editor needs it. They pick from that list instead of typing. If the fetch fails, the studio says so. If a stored variant no longer matches, the studio flags it and asks them to retarget. Server-side and agent-readable conditions are later. Not this beta.

If the first question is "will the content agent know our PostHog audiences?", the answer is no. If the question is "can we stop editors inventing audience names?", the answer is yes.
