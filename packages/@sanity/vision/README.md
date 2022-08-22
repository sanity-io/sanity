# sanity-vision

Vision is a plugin for Sanity Studio for testing GROQ queries. It features:

- GROQ syntax highlighting so that the query is easier to read.
- Parsed response that's more convenient to navigate and explore.
- Switch between datasets
- Listening for real-time updates

![Screenshot](assets/screenshot.png)

## Installation

`npm install --save @sanity/vision`

### Configuring

```ts
// `sanity.config.ts` / `sanity.config.js`:
import {createConfig} from 'sanity'
import {visionTool} from '@sanity/vision'

export default createConfig({
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

If you only want the tool available in development (eg not in deployed studios), you can import and use the `isDev` constant from the `sanity` package:

```ts
// `sanity.config.ts` / `sanity.config.js`:
import {createConfig, isDev} from 'sanity'
import {visionTool} from '@sanity/vision'

const devOnlyPlugins = [visionTool()]

export default createConfig({
  // ...
  plugins: [
    // ... your other plugins here ...
    ...(isDev ? devOnlyPlugins : []),
  ],
})
```

## License

MIT-licensed. See LICENSE.
