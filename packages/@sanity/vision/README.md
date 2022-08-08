# sanity-vision

Vision is a plugin for Sanity Studio for testing GROQ queries. It features:

- GROQ syntax highlighting so that the query is easier to read.
- Parsed response that's more convenient to navigate and explore.
- Switch between datasets
- Listening for real-time updates

![screenshot](https://cdn.sanity.io/images/3do82whm/next/da4cb4ff12945f0a95e6695ee2fad0470e14da9e-1651x1017.png)

## Installation

`npm install --save @sanity/vision`

### Configuring

```ts
// `sanity.config.ts` / `sanity.config.js`:
import {createConfig} from 'sanity'
import {vision} from '@sanity/vision'

export default createConfig({
  // ...
  plugins: [
    vision({
      // Note: These are both optional
      defaultApiVersion: 'v2021-10-21',
      defaultDataset: 'some-dataset',
    }),
  ],
})
```
