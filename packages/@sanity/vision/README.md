# sanity-vision

Vision is a plugin for Sanity Studio for testing GROQ queries. It features:

- GROQ syntax highlighting so that the query is easier to read
- Parsed response that's more convenient to navigate and explore
- Switching between datasets
- Listening for real-time updates

![Screenshot](assets/screenshot.png)

## Installation

`npm install --save-exact @sanity/vision`

### Configuring

```ts
import {visionTool} from '@sanity/vision'
// `sanity.config.ts` / `sanity.config.js`:
import {defineConfig} from 'sanity'

export default defineConfig({
  // ...
  plugins: [
    visionTool({
      // Note: These are both optional
      defaultApiVersion: 'v2021-10-21',
      defaultDataset: 'some-dataset',
    }),
  ],
})
```

### Only enabling it for development

If you only want the Vision tool available in development (e.g., not in deployed studios), you can import and use the `isDev` constant from the `sanity` package:

```ts
import {visionTool} from '@sanity/vision'
// `sanity.config.ts` / `sanity.config.js`:
import {defineConfig, isDev} from 'sanity'

const devOnlyPlugins = [visionTool()]

export default defineConfig({
  // ...
  plugins: [
    // ... your other plugins here ...
    ...(isDev ? devOnlyPlugins : []),
  ],
})
```

### Only enabling it for administrators

If you only want the Vision tool available to administrators, you can use the [Tool API](https://www.sanity.io/docs/studio-tools) to filter out the tool based on role:

```ts
import {visionTool} from '@sanity/vision'
// `sanity.config.ts` / `sanity.config.js`:
import {defineConfig} from 'sanity'

export default defineConfig({
  // ... name, title, projectId, dataset, etc.
  plugins: [
    // ... your other plugins here ...
    visionTool(),
  ],
  tools: (prev, {currentUser}) => {
    const isAdmin = currentUser?.roles.some((role) => role.name === 'administrator')

    // If the user has the administrator role, return all tools.
    // If the user does not have the administrator role, filter out the vision tool.
    return isAdmin ? prev : prev.filter((tool) => tool.name !== 'vision')
  },
})
```

## Beta: the redesigned Vision

Vision ships an opt-in redesign behind the `beta.redesign` option. It is off by default. When enabled, the classic tool shows a dismissible toast inviting users to try the redesign; users who accept get the redesigned tool, remembered per project in their browser, and can switch back at any time from its sidebar or settings (or by clearing its storage).

```ts
import {visionTool} from '@sanity/vision'
// `sanity.config.ts` / `sanity.config.js`:
import {defineConfig} from 'sanity'

export default defineConfig({
  // ...
  plugins: [
    visionTool({
      beta: {redesign: {enabled: true}},
    }),
  ],
})
```

What is different in the redesign:

- **Query tabs**, each with its own query, params and options. The options follow the studio by default: the dataset follows the workspace's until you pin one, the **Global** perspective runs the query against the navbar's perspective (the pinned release, drafts or published; a tab can also pick `raw`, `published`, `drafts` or scheduled drafts of its own), and the **Variant** option sends the navbar's variant or none; the API version and the content source map are set per tab. Drag a tab (or press Shift with an arrow key) to reorder them, double-click a title (or press F2) to rename it; tabs and their order are persisted per project in `localStorage`.
- **Query, Params and Options stacked** in the request column, all visible at once above a bottom action bar (Live fetch, Fetch and a show-more menu, like structure document panels, with the API version the requests go out with on its other end; pressing it opens the field that changes it): the editor takes whatever the two panels leave over, Params grow with their JSON (drag their top edge for another height, double-click it to fit the content again) and Options are as tall as their fields. Both panels collapse to a header, remembered per project. The Params panel's experimental **Form** view lists every `$param` the query uses with a field for it, typed from how the query uses it and, like `sanity typegen`, from the workspace schema: `_type == $type` suggests the document types, a field with an options list suggests its values, slice bounds take whole numbers, `references($id)` a document ID. Values that do not fit are still sent, with a note, so you can test them.
- **Generate query**: the sparkles button over the query editor opens a field above it that writes a query from a description ("the 10 most recent authors, ordered by last name and then first name"); Enter generates, Escape closes. [Agent Actions](https://www.sanity.io/docs/agent-actions/introduction) (`client.agent.action.prompt`, which needs API version `vX` and Agent Actions on the project) get the description, the names and fields of the document types it mentions and a GROQ primer; each attempt is compiled on the Content Lake with the active tab's options without running it (`select(false => …)`), and a rejected one is retried with the API's error, up to three times. The query goes into the tab while its query is empty, otherwise into a new tab with the same options, and runs there; when every attempt is rejected, the last one can still be opened to fix by hand.
- **The active query in the address bar**: once typing settles, the tool's URL holds the active tab's request (`?vision[url]=…`, the query URL the Response panel shows, replacing the history entry rather than adding one), so it can be bookmarked or shared. Opening such a link selects a tab that already shows the request, or opens one for it, read the way a pasted query URL is.
- **A collapsible sidebar** with your saved queries, the queries shared in the dataset, the keyboard shortcuts and the settings. Saved queries are shared with the classic tool.
- **Live fetch**: an alternative to **Fetch** that fetches the query and then fetches it again whenever the documents it depends on change (the response's `syncTags` are matched against the Live Content API), until **Stop live**. While a fetch runs, Fetch reads **Stop** and stops that fetch only. Fetch still fetches on demand meanwhile, for results no document change touches, like `now()`. The History panel records every fetch and why it happened, and whether its result changed since the previous one: expand **Changes** for a line diff of the two results, rendered with [`@pierre/diffs`](https://diffs.com) (loaded only when a diff is expanded). When the query, the params or the request URL (API host and version, dataset, perspective and variant) changed too, they are diffed above the result, the query laid out by `groq-format` with every attribute, condition and argument on a line of its own so a change reads like one in the JSON; turning the Content Source Map on or off is left out, since it does not change the result. Besides the result on screen, the ten most recent results are kept for this, each up to 1 MB as JSON. Fields that change with every revision (`_rev`, `_updatedAt` and `_system.base.rev` by default, matched at any depth) are left out of the diffs, so an entry where only they changed says so; the list is in the settings, and each diff can show them.
- **The result as a tree, as JSON or as a graph**: the tree has a copy button on each property's row (text is copied as it is, everything else as indented JSON), the JSON view is a read-only editor to select any part of the result from, with foldable objects and arrays, and Copy result next to the switch copies all of it. The graph draws the result the way [jsoncrack](https://jsoncrack.com) does: every object and array is a node listing its plain values, linked from the row of the property that holds it, laid out left to right a column per level. Drag to move around, scroll or use the buttons to zoom (the arrow keys, + and - and 0 to fit while it is focused), collapse what a node holds, and copy a node's value from its header. It lists up to 30 entries of an object or array and draws up to 300 objects and arrays, and says when it leaves part of the result out. The choice is remembered per project.
- **Explain**: a panel next to History that shows the query plan, how the Content Lake runs the query (the query endpoint's `explain` option, which `@sanity/client`'s `fetch` cannot send, so the query URL is requested directly), and on request has Agent Actions explain the query and its plan in plain words. Above the plan, what stands out in it: a filter evaluated in memory after reading (a `FilterStep`, with its expression, typically a join with `->` or a function in the filter), sorting or slicing in memory, and on the good side sorting and limiting in the index, a subquery batched once for all documents, and counts computed in the index, with a link to the high performance GROQ guide. The explanation's prompt carries what each kind of plan step means, since models otherwise guess. Both belong to the query they were made for and clear when it changes.
- **Use the API CDN**: a per-tab option (and a default for new tabs in the settings) that sends the query to the API CDN, like `useCdn: true` in `@sanity/client`; the button next to Fetch then reads "API CDN" with the version. As in the client, the drafts perspective and perspective stacks (which the CDN rejects) keep the query on the API, and the option says so. The CDN's answers are cached for up to a minute, so Live fetch passes the live event's id along (`lastLiveEventId`) to get content at least as new as the change, and Vision asks the browser to revalidate rather than answer from its own cache, so a cached answer is the CDN's. The studio's login cookie never reaches the CDN; in a studio signed in with one rather than a token, the CDN answers as it would an anonymous visitor, which the option points out.
- **Network**: a panel next to Response that says which endpoint answered (API or API CDN), whether the CDN answered from its cache, and where the query ran, on a globe ([cobe](https://github.com/shuding/cobe), loaded with the panel) from roughly where you are (from the browser's time zone) to the API's region, with an arc when the request went there; History marks the fetches the CDN answered and its cache hits. It reads the headers the API exposes to browsers through a request handler that gives `@sanity/client`'s transport a `fetch` reading them: the region from `X-Sanity-Shard`, and a cache hit from `traceparent`, since a cached response repeats the trace of the one it was cached from (so only hits on answers this session saw before can be told). `X-Sanity-Age` and `Server-Timing` are not exposed.
- **Response details**: execution and end-to-end time, payload size, sync tags, the query URL and the content source map when requested.
- **Delta**: a panel that runs the query in delta mode, the way GROQ-powered webhooks, listeners and Sanity Functions filter and project changes: `before()` and `after()` are a document before and after a change, `@` is the document after it (as it was, for a delete), and `delta::changedAny()`, `delta::changedOnly()` and `delta::operation()` compare the two. Load a document's history to pick two of its revisions from the History API (the latest as After and the one before it as Before), or write the documents in; an empty side is no document, so the change creates or deletes it. A filter says whether a webhook or function with it would run for the change, and anything else shows its result. The Content Lake's query endpoint has no delta mode, so the panel runs the query in the browser with groq-js, as you type.
- **WebMCP**: in browsers with [WebMCP](https://webmachinelearning.github.io/webmcp/) (`document.modelContext`), the redesign registers tools an agent in the browser can call while Vision is open, acting through the user's own session: `vision_get_state` (the active tab's query, params, options and latest result), `vision_run_query` (runs a query with the active tab's options, leaving the tab alone), `vision_check_query` (what the editor's linting finds, the schema checks included), `vision_explain_query` (the query plan and what stands out in it), `vision_describe_schema` (the document types, and the fields of the ones asked for), and `vision_open_query`, the only one marked as not read-only, which opens a query in a new tab and runs it there for the user to see. None of them write data. Results are cut at 50,000 characters, and the tools are unregistered when Vision closes.
- **Exports**: the query as `curl`, `@sanity/client` and `next-sanity` snippets; the result as JSON or CSV, and as TypeScript types or a Zod schema inferred from the workspace schema (falling back to the fetched result).
- **Prettify and lint** from [sanity-labs/sanity-lint](https://github.com/sanity-labs/sanity-lint), through its `@sanity-labs/groq-wasm` build: Prettify formats the query with `groq-format`, wrapping lines at the query editor's current width so the result needs no sideways scrolling, and the editor underlines what the `groq-lint` rules find (joins in filters, comparisons that cannot use an index, deep pagination, ...). Hover a finding for its explanation, press F8 to jump to the next one, or open the Lint panel next to the response, which lists every finding and selects one in the editor when picked. Pasting a query URL from the network tab loads it into the active tab.
- **Checked against the schema**: the editor also checks the query against the workspace schema. It flags a document type a `_type` filter names that the schema does not have (`_type == "athor"`, also in `in [...]` and conditional projections, where it checks against the array's member types), a field that none of the types in scope has, in filters, projections and `order()`, through references (`->`), arrays (`[]`) and nested objects (`slug.curent`), with `^` reading the scope a subquery is written in, a field read from a reference without following it (`author.name`), and `->` on something that is not a reference. A finding that has a likely fix offers it ("Use `author`", "Use `->`"). Scopes whose types the query does not pin down (no `_type` filter, a parameter, a function's result) are left alone, since documents can hold fields their schema does not declare.
- **Functions**: hovering a function call in the query editor shows its documentation from the [GROQ functions reference](https://www.sanity.io/docs/specifications/groq-functions) (signature, what it does, the API version it needs), and function names complete as they are typed (Ctrl-Space lists them anytime; Enter keeps inserting a new line until an option is picked with the arrow keys). Custom functions (`fn ns::name($param) = …;` at the start of a query) get the checks the API runs and `groq-lint` does not: one parameter, a body that projects it (`$p{…}`, `$p->{…}`, `$p[]{…}` or `$p[]->{…}`) and uses it nowhere else, no `^` reaching outside the body, no recursion; calls are checked too (unknown functions, argument counts, delta-only and pipe functions out of place). **Extract to function** (the button over the editor, or ⌥↩ / Alt+Enter) turns the projection around the cursor, such as `author->{name}`, or a selected one into a custom function: it is declared at the top of the query and called where it was. The button's tooltip names the expression it would extract, and selecting a projection also shows the action next to the selection. The Functions panel lists the query's custom functions, each of which can be saved to a library kept in the browser for the project; library functions can be added to any query from the panel, from completions, or from the lint finding on a call to one the query does not declare.

The redesign is in beta: its look and feature set may still change.

## License

MIT-licensed. See LICENSE.
