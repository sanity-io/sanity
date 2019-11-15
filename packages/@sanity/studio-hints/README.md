# Studio hints

Helpful stuff appears! In the sidecar!

This plugin is an implementation of `part:@sanity/default-layout/sidecar`. As such, it export the two things it is required to:

 - `SidecarToggleButton` React component: The button which will appear in the NavBar to toggle on/off the Sidecar
 - `SidecarLayout` React component: The content of the Sidecar (once it appears)

## For the Studio hints to appear in a running Studio, add the following to the sanity.json file
```
{
  "implements": "part:@sanity/default-layout/sidecar-config",
  "path": "studioHintsConfig.js"
}
```

In that file, specify which hints package the plugin will show:
```
export default {
  options: {
    hintsPackageSlug: 'gatsby-blog'
  }
}
```
