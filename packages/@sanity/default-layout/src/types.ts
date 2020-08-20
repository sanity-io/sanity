export interface Router {
  state: {space?: string; tool: string}
  navigate: () => void
}

export interface Tool {
  canHandleIntent?: (intent: {}, params: {}, state: {}) => {}
  component?: React.ComponentType<{}>
  icon?: React.ComponentType<{}>
  getIntentState?: (intent: {}, params: {}, state: {}, payload: {}) => {}
  name: string
  title: string
  router?: {}
}

export interface User {
  email: string
  name?: string
  profileImage?: string
}
