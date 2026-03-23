/** @internal */
export type Sentiment = 'happy' | 'neutral' | 'unhappy'

/** Tags that are always sent regardless of where the dialog is used. */
export interface BaseFeedbackTags {
  userAgent: string
  screenDensity: string
  screenHeight: string
  screenWidth: string
  innerHeight: string
  innerWidth: string
  studioVersion: string
  reactVersion: string
  environment: string
  projectId: string
  sessionId: string
  userId: string
  plugins: string
  pluginsCount: number
}

/** Tags that update as the user navigates. */
export interface DynamicFeedbackTags {
  activeTool: string
  activeWorkspace: string
  activeProjectId: string
  activeDataset: string
  url: string
}

/** Matches Sentry's accepted tag value types. */
export type TagValue = string | number | boolean

/** The full feedback payload sent to Sentry. */
export interface FeedbackPayload {
  dsn: string
  name?: string
  email?: string
  message: string
  sentiment: Sentiment
  contactConsent: boolean
  source: string
  tags: Record<string, TagValue>
  attachments?: {filename: string; data: Uint8Array}[]
}
