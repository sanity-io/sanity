# Stale Content Digest Scheduled Function

[Explore all examples](https://github.com/sanity-labs/function-recipes)

Every Monday morning, this scheduled function finds stale documents in your dataset, asks the Sanity Content Agent to roast them, and posts the rundown to Slack.

## Problem

Content goes stale. Documents quietly age out of relevance (references get outdated, claims become false, links break), and editors find out only when a reader complains. Manually auditing freshness is tedious enough that it never happens consistently.

## Solution

This recipe runs on a schedule (default: every Monday at 08:00 UTC). It queries for documents that haven't been updated in the last N days, sends them to the [Sanity Content Agent](https://www.sanity.io/docs/agent-actions) with a snarky-reviewer prompt, and posts the resulting findings to Slack.

It bundles three Sanity capabilities into one workflow:

- **Scheduled functions.** Server-side cron, no infrastructure to manage.
- **Agent Actions.** The Content Agent reviews each document and explains what looks outdated.
- **Slack integration.** The digest lands where the editorial team already lives.

## Benefits

- **Catches drift early.** Stale content gets flagged before readers notice.
- **One Slack post per week.** Low-noise format editors will actually read.
- **AI does the reading.** The agent looks at every overview so editors only see what needs attention.
- **Zero infrastructure.** Sanity runs the schedule and the function for you.

## Setup

This recipe needs three things connected: a Sanity project with content to review, a Slack bot to receive the digest, and a Sanity Blueprint with a scheduled function. Setup depends on whether you already have a Sanity project.

- **A. [Demo with the moviedb sample](#a-demo-with-the-moviedb-sample).** Spin up a fresh Sanity project from the moviedb template and run the recipe as-is. About 10 minutes from zero to a Slack post.
- **B. [Wire it into your existing Sanity project](#b-wire-it-into-your-existing-sanity-project).** Use a Studio you already have, then adapt the function to your schema.

Both paths use the shared [Set up the Slack app](#set-up-the-slack-app) section, and Path B uses [Adapt the function to your schema](#adapt-the-function-to-your-schema). Deployment to production happens after either path completes locally; see [Deploy](#deploy).

### A. Demo with the moviedb sample

The recipe ships pre-wired to the `moviedb` starter: a `movie` document type with a Portable Text `overview` field and a sample dataset of real movies.

1. **Create a project directory and bootstrap moviedb.**

   ```bash
   mkdir movies-project
   cd movies-project
   npx sanity init --template moviedb --import-dataset --output-path=studio
   ```

   The CLI prompts for organization, project name, and dataset. With `--output-path=studio`, the Studio code lands in `./studio` and `movies-project/` becomes your project root. Run every subsequent step from `movies-project/`.

2. **Set up the Slack app.** Follow [Set up the Slack app](#set-up-the-slack-app) below, then return here with the bot token.

3. **Initialize the blueprint.**

   ```bash
   npx sanity blueprints init
   ```

   Pick the same organization and Studio you used in step 1.

4. **Add the recipe.**

   ```bash
   npx sanity blueprints add function --example stale-content-digest
   ```

   This scaffolds `functions/stale-content-digest/` with the function code and a partial blueprint resource. You'll complete the blueprint in the next step.

5. **Configure the blueprint.** Replace the contents of `sanity.blueprint.ts` with the [Blueprint reference](#blueprint-reference) below. The reference defines a robot token, the scheduled function, and passes `PROJECT_ID` and `DATASET` through to the function's runtime env.

6. **Configure `.env`.** Create a `.env` file in your project root:

   ```env
   PROJECT_ID=your-sanity-project-id
   DATASET=production
   SLACK_OAUTH_TOKEN=xoxb-your-bot-token
   SLACK_CHANNEL=#your-test-channel
   DAYS_SINCE=0
   ```

   Find `PROJECT_ID` in `studio/sanity.config.ts` or by running `npx sanity projects list`. `DAYS_SINCE=0` makes every movie qualify as stale, so the first run actually posts something.

7. **Install dependencies.**

   ```bash
   npm install dotenv
   cd functions/stale-content-digest && npm install && cd ../..
   ```

   The blueprint loads env vars via `dotenv`, which the moviedb starter doesn't ship with. The function folder has its own `package.json` (with `@sanity/client`, `@sanity/functions`, `@slack/web-api`) that the project-root install doesn't reach.

8. **Run the function locally.**

   ```bash
   npx sanity functions test stale-content-digest --dataset production --with-user-token
   ```

   `--with-user-token` injects auth from your linked Sanity CLI config so the function's `@sanity/client` can read the dataset. Slack should light up with a snarky takedown of each movie overview.

To ship this to production, see [Deploy](#deploy).

### B. Wire it into your existing Sanity project

Use this when you already have a Sanity Studio with content you want reviewed. You'll add the recipe, adapt it to your schema, and deploy it.

1. **From your project root.** Open a terminal in the directory that contains (or where you want) your Sanity Blueprint config. This is typically the same directory as your Studio config or one level up.

2. **Set up the Slack app.** Follow [Set up the Slack app](#set-up-the-slack-app) below.

3. **Initialize the blueprint.** Skip if you already have one.

   ```bash
   npx sanity blueprints init
   ```

4. **Add the recipe.**

   ```bash
   npx sanity blueprints add function --example stale-content-digest
   ```

5. **Configure the blueprint.** Open `sanity.blueprint.ts` and update it to match the [Blueprint reference](#blueprint-reference) below. If you already have other resources, add the `defineRobotToken` and `defineScheduledFunction` definitions to the existing `resources` array.

6. **Adapt the function to your schema.** The function ships pointed at the `movie` document type, which your project almost certainly doesn't have. The easiest way to retarget it: open a coding agent (Claude Code, Cursor, Codex) in your project root and prompt it with:

   ```
   adapt functions/stale-content-digest/ to my schema
   ```

   The function folder ships with an `AGENTS.md` that the agent auto-discovers — it'll read your schema, pick a candidate document type, and rewrite the GROQ query, TypeScript interface, and agent instruction. If the agent asks which type to target, tell it (e.g., "use the `post` type, body field is `body`"). See [Adapt the function to your schema](#adapt-the-function-to-your-schema) for alternatives (chat LLMs, hand edits).

7. **Configure `.env`.** Create or append to `.env` in your project root:

   ```env
   PROJECT_ID=your-sanity-project-id
   DATASET=production
   SLACK_OAUTH_TOKEN=xoxb-your-bot-token
   SLACK_CHANNEL=#content-team
   DAYS_SINCE=180
   STUDIO_URL=https://your-studio.sanity.studio
   ```

   `STUDIO_URL` is optional; when set, each Slack finding deep-links to the document in your Studio.

8. **Install dependencies.**

   ```bash
   npm install dotenv
   cd functions/stale-content-digest && npm install && cd ../..
   ```

9. **Run the function locally.**

   ```bash
   npx sanity functions test stale-content-digest --dataset production --with-user-token
   ```

   For interactive iteration, swap `test` for `dev`. Set `DAYS_SINCE=0` temporarily if your dataset is too fresh to surface results.

To ship this to production, see [Deploy](#deploy).

### Set up the Slack app

You need a Slack bot token to post the digest.

1. **Create the app.** Go to [api.slack.com/apps](https://api.slack.com/apps), click **Create New App** then **From scratch**. Name the app and pick a workspace.

2. **Add the `chat:write` scope.** Under **OAuth & Permissions** then **Bot Token Scopes**, add `chat:write`.

3. **Install and grab the token.** Click **Install to Workspace** at the top of the OAuth page. Copy the Bot User OAuth Token (it starts with `xoxb-`); this is your `SLACK_OAUTH_TOKEN`.

4. **Invite the bot to your channel.** In Slack, run `/invite @your-app-name` in the channel you want the digest to land in. Use that channel name (with `#`) as your `SLACK_CHANNEL`.

### Adapt the function to your schema

The function ships pointed at the `movie` document type and the `overview` Portable Text field. Two ways to adapt it to your content:

- **Coding agent (recommended).** Open Claude Code, Cursor, or Codex in your project root and prompt it with: `adapt functions/stale-content-digest/ to my schema`. The function folder ships with an [AGENTS.md](./AGENTS.md) the agent auto-discovers — it reads your schema, picks a candidate document type, rewrites the GROQ query and TypeScript interface, and tailors the agent instruction. If multiple types qualify, the agent will ask which one to target.

- **Chat LLM.** For ChatGPT or Claude.ai (without file access in your project), paste [PROMPT.md](./PROMPT.md) into the chat. Works best when the LLM is configured with the [Sanity MCP](https://www.sanity.io/docs/model-context-protocol) so it can read your schema directly.

- **Hand edits.** Three edit points in [`index.ts`](./index.ts), spelled out in [Customization](#customization).

After either approach, re-run `npx sanity functions test stale-content-digest --dataset production --with-user-token` to verify.

### Deploy

Local testing works without deploying. To run the function on its actual schedule, you need to deploy.

Scheduled functions live on an organization-scoped Blueprint, not a project-scoped one. The first time you deploy this recipe, promote your stack:

```bash
npx sanity blueprints promote
```

Promotion is one-way. Existing project-scoped resources stay scoped to the project; new scheduled functions land at organization scope.

Then deploy:

```bash
npx sanity blueprints plan    # optional: preview the resources that will be created, updated, or removed
npx sanity blueprints deploy
```

`blueprints plan` is a dry run; it doesn't change anything in your stack. Skip it if you're confident in your changes and go straight to `deploy`.

CI deployment of organization-scoped stacks currently requires a personal user token, which isn't suitable for shared CI runners. Deploy from a developer machine until the platform supports automated organization-scoped deploys.

## Blueprint reference

The full `sanity.blueprint.ts` for this recipe:

```ts
import {defineBlueprint, defineRobotToken, defineScheduledFunction} from '@sanity/blueprints'
import 'dotenv/config'
import {env} from 'node:process'

const {PROJECT_ID, DATASET, DAYS_SINCE, SLACK_OAUTH_TOKEN, SLACK_CHANNEL, STUDIO_URL} = env

export default defineBlueprint({
  resources: [
    defineRobotToken({
      name: 'stale-content-digest-robot',
      label: 'Stale Content Digest Robot',
      memberships: [
        {
          resourceType: 'project',
          resourceId: PROJECT_ID,
          roleNames: ['viewer'],
        },
      ],
    }),
    defineScheduledFunction({
      name: 'stale-content-digest',
      src: './functions/stale-content-digest',
      event: {expression: '0 8 * * 1'},
      timezone: 'UTC',
      memory: 1,
      timeout: 30,
      env: {
        PROJECT_ID,
        DATASET,
        DAYS_SINCE,
        SLACK_OAUTH_TOKEN,
        SLACK_CHANNEL,
        STUDIO_URL,
      },
      robotToken: '$.resources.stale-content-digest-robot.token',
    }),
  ],
})
```

The cron expression runs every Monday at 08:00 UTC. Change the `event` and `timezone` fields to your preference; see [Customization](#customization) for examples.

## Environment variables

| Variable            | Description                                                                                                                                                                                                                                       | Required |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `PROJECT_ID`        | Sanity project ID. The blueprint's robot token uses it, and the function client reads it directly (scheduled handlers don't get `projectId` via `context.clientOptions`). Find it in `studio/sanity.config.ts` or via `npx sanity projects list`. | Yes      |
| `DATASET`           | Dataset to query (for example, `production`). Read directly by the function client.                                                                                                                                                               | Yes      |
| `SLACK_OAUTH_TOKEN` | Slack bot token (`xoxb-...`).                                                                                                                                                                                                                     | Yes      |
| `SLACK_CHANNEL`     | Channel name (for example, `#content-team`).                                                                                                                                                                                                      | Yes      |
| `DAYS_SINCE`        | Stale threshold in days. Default: `180`.                                                                                                                                                                                                          | No       |
| `STUDIO_URL`        | Studio base URL. When set, each finding links to the document in Studio.                                                                                                                                                                          | No       |
| `NOTIFY_WHEN_EMPTY` | `true` to post a "no stale movies" message when nothing is found. Default: `false`.                                                                                                                                                               | No       |
| `SANITY_AUTH_TOKEN` | API token for the function client. Only needed when running the function without `--with-user-token` and without a deployed robot token (for example, plain `node` invocation).                                                                   | No       |

## Customization

Three edit points in [`index.ts`](./index.ts):

### 1. Point the query at your document type

```ts
const STALE_QUERY = `*[_type == "post" && dateTime(_updatedAt) < dateTime(now()) - 60*60*24*$daysSince]{
  _id,
  title,
  _updatedAt,
  "body": pt::text(body)
}`
```

Choose the projection based on the field's type:

- Plain string or text: `body`.
- Portable Text array: `"body": pt::text(body)`.
- Array of strings: `"body": array::join(body, " ")`.
- Anything more complex (objects, references): flatten it to a string in the projection so the agent has plain text to read.

### 2. Rewrite the prompt for your content

The snarky-reviewer persona is there to make the demo fun. For real editorial use, replace it with something that names the specific kinds of staleness your team cares about:

```ts
instruction: `You are a content auditor. Review these articles: $documents.
Flag overviews with outdated references, broken claims, or missing recent context.
Respond in JSON: { "findings": [{ "title": "...", "issue": "...", "priority": "high"|"medium"|"low" }] }`,
```

### 3. Adjust the schedule

Change the cron expression in your blueprint:

```ts
event: {
  expression: '0 9 * * 1-5'
} // every weekday at 09:00
```

### Other knobs

- **Multiple types**: change `_type == "movie"` to `_type in ["post", "page", "guide"]`.
- **Different staleness signal**: replace `_updatedAt` with a custom `lastReviewedAt` field.
- **Richer Slack formatting**: swap `chat.postMessage` for [Block Kit](https://api.slack.com/block-kit) blocks.

## Troubleshooting

**`Configuration must contain projectId` when running `functions test`.**

- Cause: scheduled handlers don't get `projectId` via `context.clientOptions` (only document handlers do). The function reads it from env, but `PROJECT_ID` is missing or unloaded.
- Solution: confirm `PROJECT_ID` is set in `.env` and that the blueprint passes it through in the function's `env` block. See the [Blueprint reference](#blueprint-reference).

**"No stale movies found" but you expected some.**

- Cause: `DAYS_SINCE` is too high for your dataset's age, or the GROQ filter doesn't match your type.
- Solution: lower `DAYS_SINCE` (try `0` for the first run) and confirm the type and field names match your schema.

**Slack post never arrives.**

- Cause: the bot isn't in the target channel, or the token lacks `chat:write`.
- Solution: run `/invite @your-app-name` in the channel; verify scopes under **OAuth & Permissions** in your Slack app config.

**Agent returns invalid JSON.**

- Cause: the prompt is too open-ended for the model.
- Solution: tighten the JSON schema in the instruction and show an explicit example of the expected output.

**Function times out.**

- Cause: too many stale documents. The agent call is the bottleneck.
- Solution: increase `timeout` in the blueprint, batch the documents, or narrow the query.

## Requirements

- A Sanity project with [Functions](https://www.sanity.io/docs/functions) and [Agent Actions](https://www.sanity.io/docs/agent-actions) enabled. Agent Actions are an experimental feature on the `vX` API channel.
- The `moviedb` template, or any document type with a text-like field (string, text, Portable Text, or array of strings). See [Adapt the function to your schema](#adapt-the-function-to-your-schema).
- A Slack workspace and bot token with `chat:write`.
- Node.js v22.x for local development.

## Related examples

- [Auto-Summary Function](../auto-summary/README.md): generate document summaries with the Content Agent on every update.
- [Slack Notify Function](../slack-notify/README.md): post to Slack on document create.
- [Stale Products Analysis](../stale-products-analysis/README.md): document-triggered staleness analysis for e-commerce.
