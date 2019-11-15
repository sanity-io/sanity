# default-layout


## Sidecar

The Sidecar will be enabled in a Studio if there are implementations of the parts `part:@sanity/default-layout/sidecar` and `part:@sanity/default-layout/sidecar-config`

In addition, Sidecar relies on `part:@sanity/default-layout/sidecar-datastore`. This part already exists and shouldn't be overridden unless there's a good reason.

### `part:@sanity/default-layout/sidecar-datastore`

This part exports:

- `isSidecarOpenSetting` listen to this to get realtime updates on the sidecar open/close state
- `toggleSidecarOpenState` call this to flip the sidecar open/close state

### `part:@sanity/default-layout/sidecar`

An implementation of `part:@sanity/default-layout/sidecar` _must_ export two components:

 - `SidecarToggleButton` The button which will appear in the NavBar to toggle on/off the Sidecar
 - `SidecarLayout` The content of the Sidecar (once it appears)

If you need inspiration, `@sanity/studio-hints` package is an implementation of this part.

### `part:@sanity/default-layout/sidecar-config`

Any implementation of `part:@sanity/default-layout/sidecar-config` will do. Just add the following to the Studio's sanity.json file:
```
{
  "implements": "part:@sanity/default-layout/sidecar-config",
  "path": "mySidecarConfig.js"
}
```

Then create that file. It doesn't need to contain anything, unless your sidecar implementation needs it to.
