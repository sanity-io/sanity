export type Hook = GroqHook | LegacyHook

export interface GroqHook {
  type: 'document'
  rule: {
    on: ('create' | 'update' | 'delete')[]
    filter: string | null
    projection: string | null
  }
  apiVersion: string
  httpMethod: string
  includeDrafts: boolean
  headers: Record<string, string | undefined>
  secret: string | null
  id: string
  name: string
  projectId: string
  dataset: string
  url: string
  createdAt: string
  createdByUserId: string
  isDisabled: boolean
  isDisabledByUser: boolean
  deletedAt: string | null
  description: string | null
}

export interface LegacyHook {
  type: 'transaction'
  id: string
  name: string
  projectId: string
  dataset: string
  url: string
  createdAt: string
  createdByUserId: string
  isDisabled: boolean
  isDisabledByUser: boolean
  deletedAt: string | null
  description: string | null
}

export type HookMessage = GroqHookMessage | LegacyHookMessage

export interface GroqHookMessage {
  id: string
  projectId: string
  dataset: string
  payload: string
  status: 'queued' | 'sending' | 'success' | 'failure'
  failureCount: number
  resultCode: number | null
  createdAt: string
}

export interface LegacyHookMessage {
  id: string
  projectId: string
  dataset: string
  payload: string
  status: 'queued' | 'sending' | 'success' | 'failure'
  failureCount: number
  resultCode: number | null
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
  hookId: string
}

export interface DeliveryAttempt {
  id: string
  projectId: string
  hookId: string
  messageId: string
  inProgress: boolean
  duration: number | null
  isFailure: boolean
  failureReason: string
  resultCode: number
  resultBody: string
  createdAt: string
  updatedAt: string | null
}
