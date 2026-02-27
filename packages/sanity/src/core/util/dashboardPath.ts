/**
 * @internal
 */
export const getDashboardPath = ({
  organizationId,
  dashboardDomain,
  appId,
  workspaceName,
}: {
  dashboardDomain: string
  organizationId: string
  appId: string
  workspaceName: string
}) => `${dashboardDomain}/@${organizationId}/studio/${appId}/${workspaceName}`
