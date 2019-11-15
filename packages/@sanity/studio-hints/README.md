# Studio hints

Helpful stuff appears

This plugin is an implementation of `part:@sanity/default-layout/sidecar`. As such, it export the three things it is required to:

 - `SidecarToggleButton` React component: The button which will appear in the NavBar to toggle on/off the Sidecar
 - `SidecarLayout` React component: The content of the Sidecar (once it has appeared)


## In the sanity.json file of your Studio, add
```
{
  "implements": "part:@sanity/default-layout/sidecar-config",
  "path": "studioHintsConfig.js"
}
```

## create studioHintsConfig.js and add this to it:

```
export default {
  options: {
    hintsPackageSlug: 'gatsby-blog'
  }
}
```
