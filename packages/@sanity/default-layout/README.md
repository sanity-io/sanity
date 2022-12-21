# ⚠️ THIS PACKAGE IS DEPRECATED

> This package is part of Sanity Studio v2, which has been superseded by **Sanity Studio v3**, the current major version released on Dec 7th, 2022. This package is no longer used/needed for Sanity Studio in its current version and will be retired on Dec 7th, 2023. The core packages for Sanity Studio v2 will only receive critical bug fixes until this date.
>
> Please head over to [the documentation for Sanity Studio v3](https://www.sanity.io/docs/sanity-studio) to learn more.

# default-layout

## Sidecar

The Sidecar will be enabled in a Studio if there is an implementations of the part `part:@sanity/default-layout/sidecar`

### `part:@sanity/default-layout/sidecar`

An implementation of `part:@sanity/default-layout/sidecar` _must_ export these:

- `SidecarToggleButton` React component. The button which will appear in the Navbar to toggle on/off the Sidecar
- `SidecarLayout` React component. The content of the Sidecar (once it appears)
- `isSidecarEnabled` Function. Call this to check if the Sidecar implementation is happy and good to go (typically, the sidecar impl. wants to verify if config is present)

If you need inspiration, the `@sanity/studio-hints` package is an implementation of this part.

### `part:@sanity/default-layout/sidecar-datastore`

In addition, Sidecar relies on `part:@sanity/default-layout/sidecar-datastore`. This part already exists and shouldn't be overridden unless there's a good reason. This part exports:

- `isSidecarOpenSetting` listen to this to get realtime updates on the sidecar open/close state
- `toggleSidecarOpenState` call this to flip the sidecar open/close state
