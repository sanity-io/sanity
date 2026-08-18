# LLM adaptation prompt

Copy everything below the line into your LLM (Claude Code, Cursor, Codex, ChatGPT, Claude.ai with the [Sanity MCP](https://www.sanity.io/docs/model-context-protocol), etc.). Fill in `TARGET DOCUMENT TYPE` and `TARGET FIELD` first.

For coding agents running in your project root, [AGENTS.md](./AGENTS.md) gives them this same context automatically — you can also just say "adapt this function to my [type] content" and the agent will follow the steps below.

---

TARGET DOCUMENT TYPE: <fill in, e.g. "documentation">
TARGET FIELDS: <fill in one or more comma-separated fields to review for staleness, e.g. "body" or "title, lead, body">

I want to adapt the stale-content-digest Sanity Function in this project to work with the document type and field(s) above. The function currently targets the `movie` document type and the single `overview` Portable Text field — rewire it for my schema.

Steps:

1. **Verify the target.** Confirm the document type and every field I named above actually exists in my Sanity schema. Use `list_workspace_schemas` and `get_schema` from the Sanity MCP if available, otherwise read the schema files (typically under `schemaTypes/` or `schemas/`). For each field, note its _type_ (string, text, Portable Text array, array of strings, etc.) — you'll need it for the GROQ projection. If the type or any field doesn't exist, stop and ask me to correct it.

2. **Edit `stale-content-digest/index.ts` in three places** — the same three points called out in the README's "Customization" section:

   a. **The GROQ query** (around the `STALE_QUERY` constant). Change `_type == "movie"` to my type. Project the title-equivalent field and each target field. Choose the projection per field based on its type:
   - Plain string or text: `myField` (or rename)
   - Portable Text array: `"myField": pt::text(myField)`
   - Array of strings: `"myField": array::join(myField, " ")`
   - Anything else (object, reference, etc.): stop and ask me how I want it flattened to text

   If I gave you multiple fields, project each one separately under its own key (don't pre-concatenate in GROQ). The agent prompt and the TypeScript interface will reflect them all.

   b. **The TypeScript interface** at the top of the file (currently `Movie`). Rename it and update the field types to match what the query returns.

   c. **The agent instruction prompt** (the `instruction` field passed to the agent action). Replace the snarky-reviewer persona with one tailored to my content type. Be explicit about what staleness looks like for my domain — e.g., outdated API references for docs, expired promotions for marketing content, broken links for resource pages. Keep the JSON output schema unchanged.

3. **Update the user-facing strings** in `index.ts` — log messages and the Slack message header — so they say "stale [my content type]" instead of "stale movies".

4. **Update the Studio deep-link** in `formatSlackMessage` if the document type slug differs from `movie`.

After editing, show me a diff and tell me what to set `DAYS_SINCE` to for a useful first run on my content.
