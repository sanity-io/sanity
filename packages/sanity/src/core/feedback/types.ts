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

/** The full feedback payload sent to Sentry. */
export interface FeedbackPayload {
  name?: string
  email?: string
  message: string
  sentiment: Sentiment
  contactConsent: boolean
  source: string
  tags: Record<string, string>
  attachments?: {filename: string; data: Uint8Array}[]
}
