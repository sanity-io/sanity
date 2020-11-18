export interface Router {
  state: {space?: string; tool: string}
  navigate: () => void
}

export interface Tool {
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

export interface User {
  email: string
  name?: string
  profileImage?: string
}
