export interface LocationQuery {
  [key: string]: undefined | string | string[] | LocationQuery | LocationQuery[]
}

export interface LocationState {
  path: string
  title: string
  query: LocationQuery
}

export type PartialLocationState = Partial<LocationState>

export interface LocationContextValue extends LocationState {
  handleLinkClick: (evt: React.MouseEvent<HTMLElement>) => void
  pushState: (newState: PartialLocationState) => void
  replaceState: (newState: PartialLocationState) => void
  segments: string[]
}
