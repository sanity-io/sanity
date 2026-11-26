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

### Turning off AI features

Vision has AI features that use your organization's AI credits, all of them on by default. The `ai` option turns them off, all at once or one at a time:

```ts
// No AI features at all
visionTool({ai: false})

// Everything except query generation
visionTool({ai: {generateQuery: false}})
```

| Key                 | Feature                                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateQuery`     | Generate, which writes the query from a description with Sanity Agent Actions (uses AI credits)                                                                |
| `generateMutations` | Generate in the Mutate panel, which writes mutations from a description with Sanity Agent Actions (uses AI credits)                                            |
| `explainQuery`      | "Explain this to me" in the Explain panel, which describes the query and its plan with Sanity Agent Actions (uses AI credits). The query plan stays available. |

A feature is on unless its key is `false`.

Each user can also switch AI features off for themselves, all at once or one at a time, in Vision's settings. The choice is saved in their browser. It only turns features off: a feature the `ai` option turns off stays off and has no switch, and with `ai: false` the settings show no AI section.

### Only enabling it for development

If you only want the Vision tool available in development (e.g., not in deployed studios), you can import and use the `isDev` constant from `sanity/_dangerously_use_private_internals_that_do_not_follow_semver`:

```ts
import {visionTool} from '@sanity/vision'
// `sanity.config.ts` / `sanity.config.js`:
import {defineConfig} from 'sanity'
import {isDev} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

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

## License

MIT-licensed. See LICENSE.
