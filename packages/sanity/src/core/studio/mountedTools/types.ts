import {type RouterState} from 'sanity/router'

/** @internal */
export interface MountedToolsContextValue {
  /**
   * The root router state each inactive, still mounted tool was last active with, keyed by tool
   * name. Navigating to one of these tools restores that state instead of the tool's start page.
   * Empty unless `beta.keepInactiveToolsMounted` is enabled.
   */
  inactiveToolStates: Readonly<Record<string, RouterState>>
}
