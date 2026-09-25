import {type RouterState} from 'sanity/router'

/** @internal */
export interface MountedToolsContextValue {
  /**
   * The root router state each inactive, still mounted tool was last active with, keyed by tool
   * name. Navigating to one of these tools restores that state instead of the tool's start page.
   * Empty unless `beta.reactActivityMode` is enabled. A `Map` rather than an object so a
   * tool named like an `Object.prototype` member (`constructor`, `__proto__`) cannot be mistaken
   * for a saved state.
   */
  inactiveToolStates: ReadonlyMap<string, RouterState>
}
