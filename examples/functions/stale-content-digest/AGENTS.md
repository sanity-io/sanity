# Adapting this function to the user's content

This Sanity Function recipe ships wired to the `movie` document type with a Portable Text `overview` field, as a runnable demo against the `moviedb` starter dataset. To run it against the user's actual content, follow [PROMPT.md](./PROMPT.md).

Quick reference:

- **Target file:** `index.ts` in this folder. No other files need editing.
- **Three edit points:** the GROQ `STALE_QUERY`, the TypeScript interface at the top of the file, and the agent `instruction` prompt. The README's "Customization" section explains each.
- **Discover the schema first.** Use `list_workspace_schemas` + `get_schema` (Sanity MCP) or read the user's `schemaTypes/` directory. Do not invent document type or field names — confirm they exist before editing.
- **Field projection depends on type.** Plain string: `body`. Portable Text array: `"body": pt::text(myField)`. Array of strings: `"body": array::join(myField, " ")`. Anything more complex: ask the user.
- **After editing,** suggest a `DAYS_SINCE` value tuned to the user's dataset and remind them to run `npx sanity functions test`.

If the user just says "adapt this function to my [type] content," follow the full prompt in [PROMPT.md](./PROMPT.md).
