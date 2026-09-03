# Studio customizations that run on the server

For the functions team.

The studio lets developers plug functions into config. Those functions run in the editor's browser, so nothing outside the studio can use them. We want a pattern where a developer writes the logic once as a Sanity Function and every surface (studio, App SDK, Agent Actions, Content Agent, other functions) reads the same answer.

PubSub functions plus `client.functions.invoke()` already cover most of it. This note lists what is left. Variant conditions is the first customer of the pattern and the running example.

## The pattern today

Studio config takes callbacks in many places. A few that already exist or are being added:

- `variants.conditions` returns the allowed variant condition keys and values, often from a CDP ([README.md](./README.md))
- `initialValue` on a schema type can be an async function
- `options.list` on a string field is static today; people ask for it to come from a PIM or a feature flag service
- `validation` functions on fields
- `etc..`

All of these run in the browser with the editor's session. Secrets for the external system have to be browser-safe or proxied through a backend the developer already runs.

```ts
// sanity.config.ts, how it looks today
variants: {
  conditions: async ({getClient, dataset}) => {
    const audiences = await fetch('https://cdp.example/audiences').then((r) => r.json())
     return [{name: 'audience', title: 'Audience', values: audiences}]
   },
},
```

## The problem

Editing is no longer only the studio. Agent Actions, the Content Agent, the App SDK, and Functions all write documents. None of them can run a function that lives in `sanity.config.ts`. So the studio knows the valid audiences, or the initial value, or the allowed list, and everything else guesses or the developer copies the logic into multiple places.

## Proposal

A developer deploys a PubSub function that returns data. Every consumer calls it through the client. Studio config takes a pointer to the function instead of inline code.

### Blueprint

Docs: [Create a PubSub function](https://www.sanity.io/docs/functions/pubsub-function-quickstart), `definePubSubFunction` [reference](https://reference.sanity.io/_sanity/blueprints/definePubSubFunction/).

```ts
// sanity.blueprint.ts
import {defineBlueprint, definePubSubFunction} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    definePubSubFunction({
      name: 'audience-conditions',
      // Proposed, see gap 3. Tells consumers what this function answers.
      provides: 'sanity.variants.conditions',
    }),
  ],
})
```

### Handler

Docs: `pubSubEventHandler` [reference](https://reference.sanity.io/_sanity/functions/pubSubEventHandler-1/) (the return value is what callers receive from `invoke(name, payload, {sync: true})`), [Function handler reference](https://www.sanity.io/docs/functions/function-wrapper).

```ts
// functions/audience-conditions/index.ts
import {pubSubEventHandler} from '@sanity/functions'

export const handler = pubSubEventHandler(async ({event}) => {
  const audiences = await fetch(`https://cdp.example/audiences?dataset=${event.data.dataset}`, {
    headers: {authorization: `Bearer ${process.env.CDP_TOKEN}`},
  }).then((r) => r.json())

  return [{name: 'audience', title: 'Audience', values: audiences}]
})
```

Secrets stay on the server. The browser never sees the CDP token.

### Consumers

`@sanity/client` 8.3.0+ invokes a PubSub function synchronously and returns its value. Docs: [Invoking functions](https://github.com/sanity-io/client#invoking-functions), [v8.1.0](https://github.com/sanity-io/client/releases/tag/v8.1.0) (adds `client.functions.invoke()`), [v8.3.0](https://github.com/sanity-io/client/releases/tag/v8.3.0) (adds `{sync: true}`).

```ts
const result = await client.functions.invoke(
  'audience-conditions',
  {event: {data: {projectId, dataset}}},
  {sync: true},
)
```

Studio config becomes a pointer:

```ts
variants: {
    conditions: {function: 'audience-conditions'},
 },
```

The same `{function: string}` shape can go anywhere the studio accepts a resolver today. An agent tool and the App SDK call the same `invoke` line. One deployment, one answer.

The pointer is optional. Studio config still accepts the static array and the browser function we ship today. Projects that do not deploy a blueprint keep working. That is a requirement, not a fallback we can drop later.

## What already works

Checked against the docs and the client README, September 2026.

| Need                           | Exists as                                                               | Docs                                                                                                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deploy a callable function     | `definePubSubFunction` + `pubSubEventHandler`, `sanity.function.pubsub` | [PubSub quickstart](https://www.sanity.io/docs/functions/pubsub-function-quickstart), [function types](https://www.sanity.io/docs/functions/functions-introduction#function-types)                               |
| Return a value to the caller   | Handler return value, `{sync: true}` on invoke                          | `[pubSubEventHandler](https://reference.sanity.io/_sanity/functions/pubSubEventHandler-1/)`, [sync invocation](https://www.sanity.io/docs/functions/function-to-function-invocation#sync-waiting-for-a-response) |
| Call it from outside Functions | `client.functions.invoke(name, request, {sync: true})`, client 8.3.0+   | [client README](https://github.com/sanity-io/client#invoking-functions), [v8.3.0](https://github.com/sanity-io/client/releases/tag/v8.3.0)                                                                       |
| Call it from another function  | `invoke(name, {context, event}, {sync: true})` from `@sanity/functions` | [Function to function invocation](https://www.sanity.io/docs/functions/function-to-function-invocation), `invoke` [reference](https://reference.sanity.io/_sanity/functions/invoke/)                             |
| Server-side secrets            | `env` on the resource, robot tokens                                     | [Robot tokens with Functions](https://www.sanity.io/docs/functions/robot-tokens-with-functions)                                                                                                                  |
| Local test                     | `sanity functions dev`, `sanity functions test`                         | [Test the function locally](https://www.sanity.io/docs/functions/pubsub-function-quickstart#test-the-function-locally)                                                                                           |

No new function type. No new client namespace. Earlier drafts of this note proposed `defineDataSource` and `client.dataSource.get()`. Those are the first and third rows under different names.

## What is missing

None of these are about variants. They are what any studio config resolver needs before it can move to the server.

### 1. Invoking as an editor

Every doc example uses a deploy token or a robot token. The studio runs with the editor's session. The App SDK runs with the user's session.

- Does `POST /functions/:id/invoke` accept a user session token?
- Which grant is required? Editors do not have `deployStudio`.
- Can a function declare who may invoke it? Something like `invoke: 'project-members'` on the resource. A read-only data function should not need deploy-level permission.

If editors cannot invoke, the pattern does not work for the studio at all.

### 2. Stack resolution

`client.functions.invoke` requires a `stackId`. Names are unique per stack. A project can have several stacks. `sanity.config.ts` does not know its stack id, and pasting `ST-...` into studio config breaks between environments.

Ask: a project-level default stack, or name resolution scoped to `projectId` when there is exactly one stack. Failing that, a documented lookup the studio can do at boot.

### 3. Discovery by capability

Function resources have `name` and `displayName`. Nothing says what a function answers. The studio can be handed the name in config. An agent cannot. It needs to look at the stack and find "the function that returns variant conditions" or "the function that returns initial values for `product`".

Ask: a `provides` (or `tags`) field on function resources. Sanity owns a small set of values (`sanity.variants.conditions`, `sanity.schema.list-options`, ...), developers can add their own. `GET /blueprints/stacks/:id` already lists resources, so the read side exists.

This is what makes the pattern reusable. Without it every new consumer needs its own config key and every agent needs bespoke wiring.

### 4. A contract per capability

A sync PubSub function returns whatever JSON the handler returns. For each `provides` value there needs to be a published input and output shape, and ideally a typed helper. Studio consumers can normalize and drop invalid entries. Agents cannot guess.

For the first value, `sanity.variants.conditions`, the input is `{projectId, dataset}` and the output is `VariantConditionMap[]` from `sanity`. That type already exists.

### 5. Latency and caching

One invoke is two round trips: read the stack to map name to id, then invoke. Add cold start. Default timeout is 10s. Config resolvers run when a dialog opens or a field mounts, so the first call is visible.

- Cache name to function id per stack on the client. It only changes on deploy.
- `Cache-Control` or a TTL on sync invoke responses for functions that are pure reads. Many config resolvers are.

### 6. Cost and Free-plan caps

Every session that touches a surface backed by a resolver is at least one invocation. Client calls the function makes to the Content Lake still count against the project quota. Rate limit is 4000 per 30s per project. Not a blocker. Should be in the docs for this pattern.
Can we make the invocations from our own surfaces free?

### 7. Local development

`sanity functions dev` runs the function locally. `sanity dev` runs the studio locally. They do not talk. A developer iterating on a resolver hits the deployed function.

Ask: an env override on the client so `functions.invoke` can target the local playground.

### 8. Agent tooling

Even with 1 through 4 done, the Content Agent has no tool that calls `functions.invoke`. Agent Actions run server-side with a token, so the plumbing exists. Someone needs to add "call the function that `provides: X`" as a tool. Probably not the functions team, but it is the reason 3 matters.

### 9. Docs

The [Functions overview](https://www.sanity.io/docs/functions/functions-introduction#function-types) describes PubSub as "a function you can invoke from other functions". The [client README](https://github.com/sanity-io/client#invoking-functions) describes invoking from anywhere with a token and a `stackId`. If this pattern is the story, the Functions docs should say so, and there should be a "config resolver" recipe next to the Slack and Algolia ones.

That recipe must state the plan facts from [Plans](#plans): Functions are on Free, Free has a hard cap, and the studio config callback remains the supported path when you are not deploying a function.

## What we would do on the studio side

The studio has to support both ways on every plan. A function pointer is additive. It does not replace the config we already ship.

```ts
type FunctionRef = {function: string; stackId?: string}

// First property: beta.variants.conditions
type ConditionsConfig =
  | VariantConditionMap[] // static, no network
  | ((context: VariantConditionsContext) => VariantConditionMap[] | Promise<VariantConditionMap[]>) // browser, today
  | FunctionRef // PubSub function, shared with agents
```

One hook that, given that union, either returns the array, runs the browser function, or calls `getClient().functions.invoke(...)`. Per-workspace cache either way. Picker, mismatch validation, and the existing hook stay the same. Later properties opt in to the same union, one at a time.

This is now implemented for `beta.variants.conditions` (`VariantConditionsFunctionRef` in `config/types.ts`, resolution in `variants/util/resolveVariantConditions.ts`). It works today against a stack id pasted into config and the editor's session. That is what gaps 1 and 2 are about.

If the function pointer fails (no stack, quota, permission), we do not fall back to inventing names. Same as a failed browser fetch: error + Retry on the form. The developer who wants a no-function path uses the static array or the config callback.

## Order

1. Answer 1. If editors cannot invoke, nothing else matters.
2. Then 2. A stack id in config is survivable for a beta, not as the end state.
3. Then 3 and 4 together. That is what makes the pattern reusable and what agents need.
4. 5 through 9 are quality.
