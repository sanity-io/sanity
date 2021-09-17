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
declare module 'part:@sanity/default-layout/tool-switcher' {
  interface Router {
    state: {space?: string; tool: string}
  }

  interface Tool {
    canHandleIntent?: (
      intent: Record<string, any>,
      params: Record<string, any>,
      state: Record<string, any>
    ) => void
    component?: React.ComponentType
    icon?: React.ComponentType
    getIntentState?: (
      intent: Record<string, any>,
      params: Record<string, any>,
      state: Record<string, any>,
      payload: Record<string, any>
    ) => void
    name: string
    title: string
    router?: Record<string, any>
  }

  interface VerticalToolSwitcherProps {
    activeToolName: string
    direction: 'vertical'
    isVisible: boolean
    onSwitchTool: () => void
    tools: Tool[]
  }

  interface HorizontalToolSwitcherProps {
    direction: 'horizontal'
    tools: Tool[]
  }

  type ToolSwitcherProps = VerticalToolSwitcherProps | HorizontalToolSwitcherProps

  const ToolSwitcher: React.ComponentType<ToolSwitcherProps>

  export default ToolSwitcher
}
