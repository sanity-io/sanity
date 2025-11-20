import {useContext} from 'react'
import {
  DeploymentNotificationContext,
  type DeploymentNotificationContextValue,
} from 'sanity/_singletons'

/**
 * Hook to access deployment notification status
 * @beta
 */
export function useDeploymentNotification(): DeploymentNotificationContextValue {
  const context = useContext(DeploymentNotificationContext)

  if (!context) {
    throw new Error(
      'useDeploymentNotification must be used within a DeploymentNotificationProvider',
    )
  }

  return context
}
