export interface LocationState {
  path: string
  title: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: {[key: string]: any}
}

export interface PartialLocationState {
  path?: string
  title?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: {[key: string]: any}
}

export interface LocationContextValue extends LocationState {
  handleLinkClick: (evt: React.MouseEvent<HTMLElement>) => void
  pushState: (newState: PartialLocationState) => void
  replaceState: (newState: PartialLocationState) => void
  segments: string[]
}
