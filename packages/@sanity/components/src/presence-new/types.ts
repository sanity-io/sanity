export type Position = 'top' | 'bottom' | 'inside' | null
export type Status = 'online' | 'editing' | 'inactive'
export type Presence = {
  sessionId: string
  identity: string
  path: string[]
}

export type User = {
  displayName: string
  sessionId: string
  imageUrl: string
}
