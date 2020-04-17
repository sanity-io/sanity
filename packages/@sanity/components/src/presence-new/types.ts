
export type Position = 'top' | 'bottom' | 'inside' | null
export type Status = 'online' | 'editing' | 'inactive'
export type Presence = Array<any>

export type User = {
  displayName: string
  sessionId: string
  imageUrl: string
}

type PresenceItem = {
  id: string
  presence: Array<any>
}
