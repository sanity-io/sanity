export type Position = 'top' | 'bottom' | 'inside' | null
export type Status = 'online' | 'editing' | 'inactive'
export type Size = 'xsmall' | 'small' | 'medium'

export type Presence = {
  sessionId: string
  identity: string
  path: string[]
}

export type User = {
  identity: string
  id?: string
  displayName?: string
  sessionId: string
  imageUrl?: string
  status?: Status
  sessions?: any[]
}
