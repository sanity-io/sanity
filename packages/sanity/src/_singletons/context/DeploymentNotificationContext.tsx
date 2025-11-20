import {createContext} from 'sanity/_createContext'

/**
 * Context for tracking deployment changes via etag comparison
 * @beta
 */
export interface DeploymentNotificationContextValue {
  /**
   * The current etag value from the deployment
   */
  currentEtag: string | null

  /**
   * The initial etag value when the app first loaded
   */
  initialEtag: string | null

  /**
   * Whether a new deployment is available (etag has changed)
   */
  hasNewDeployment: boolean

  /**
   * Whether the notifier is currently checking for updates
   */
  isChecking: boolean

  /**
   * Timestamp of the last check
   */
  lastCheckedAt: number | null

  /**
   * Manually trigger a check for new deployment
   */
  checkForDeployment: () => Promise<void>
}

/**
 * @internal
 */
export const DeploymentNotificationContext =
  createContext<DeploymentNotificationContextValue | null>(
    'sanity/_singletons/context/deployment-notification',
    null,
  )
