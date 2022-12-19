# ⚠️ THIS PACKAGE IS DEPRECATED

> This package is part of Sanity Studio v2, which has been superseded by **Sanity Studio v3**, the current major version released on Dec 7th, 2022. This package is no longer used/needed for Sanity Studio in its current version and will be retired on Dec 7th, 2023. The core packages for Sanity Studio v2 will only receive critical bug fixes until this date.
>
> Please head over to [the documentation for Sanity Studio v3](https://www.sanity.io/docs/sanity-studio) to learn more.

# Studio hints

Helpful stuff appears! In the sidecar!

This plugin is an implementation of `part:@sanity/default-layout/sidecar`. As such, it exports the three things it is required to:

- `SidecarToggleButton` React component: The button which will appear in the Navbar to toggle on/off the Sidecar
- `SidecarLayout` React component: The content of the Sidecar (once it appears)
- `isSidecarEnabled` Function. Call this to check if the Sidecar implementation is happy and good to go (typically, the sidecar impl. wants to verify if config is present)

## Want Studio hints to appear in a running Studio?

### 1. Install the studio-hints plugin

```bash
sanity install @sanity/studio-hints
```

### 2. Implement part:@sanity/default-layout/studio-hints-config

Add this to the `parts` array in the sanity.json file:

```json
{
  "implements": "part:@sanity/default-layout/studio-hints-config",
  "path": "studioHintsConfig.js"
}
```

Create the file:

```bash
touch studioHintsConfig.js
```

Edit that file to specify which hints package the studio-hints plugin will use:

```js
export default {
  templateRepoId: 'sanity-io/sanity-template-gatsby-blog',
}
```
