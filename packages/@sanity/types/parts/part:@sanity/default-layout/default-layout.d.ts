declare module 'part:@sanity/default-layout/branding-style' {
  declare const exports: Record<string, string>
  export default exports
}
declare module 'part:@sanity/default-layout/sidecar-datastore'

declare module 'part:@sanity/default-layout/sidecar?' {
  export declare const isSidecarEnabled: () => boolean | undefined
  export declare const SidecarLayout: React.ComponentType | undefined
  export declare const SidecarToggleButton: React.ComponentType | undefined
}

declare module 'part:@sanity/default-layout/studio-hints-config'
declare module 'part:@sanity/default-layout/studio-hints-config?'
declare module 'part:@sanity/default-layout/tool-switcher'
