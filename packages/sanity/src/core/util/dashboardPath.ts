/**
 * @internal
 */
export const DASHBOARD_DOMAIN = 'https://www.sanity.io'

/**
 * @internal
 */
export const getDashboardPath = ({
  organizationId,
  appId,
  workspaceName,
}: {
  organizationId: string
  appId: string
  workspaceName: string
}) => `${DASHBOARD_DOMAIN}/@${organizationId}/studio/${appId}/${workspaceName}`
