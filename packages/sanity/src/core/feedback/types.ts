import {type ConsentStatus} from '../studio/telemetry/telemetryConsent'

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
  /**
   * Sentry DSN to send feedback to.
   * Format: `https://[key]@[host]/[project-id]`
   */
  dsn: string
  /**
   * Tracks the tag schema for this feedback source. Bump when tags or meaningful changes are made.
   * Similar to version in telemetry consent.
   */
  feedbackVersion: string
  /**
   * The user's telemetry consent status.
   * When not 'granted', PII (name, email, userId) is stripped and IP is anonymised.
   */
  telemetryConsent: ConsentStatus
  /**
   * The name of the user sending feedback.
   */
  name?: string
  /**
   * The email of the user sending feedback.
   */
  email?: string
  /**
   * The message the user is sending feedback.
   * It's mandatory as without it, Sentry will ignore the feedback upon receiving it.
   * (Mandatory Sentry field)
   */
  message: string
  /**
   * The source of the feedback.
   * Identifies where this feedback was triggered from (e.g. 'studio-help-menu').
   */
  source: string
  /**
   * The tags to send with the feedback.
   */
  tags: Record<string, TagValue>
  /**
   * The attachments to send with the feedback.
   */
  attachments?: {filename: string; data: Uint8Array}[]
}
