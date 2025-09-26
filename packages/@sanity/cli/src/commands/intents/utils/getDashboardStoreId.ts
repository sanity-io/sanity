import {type CliApiClient} from '../../../types'

interface GetDashboardStoreIdOptions {
  apiClient: CliApiClient
  organizationId: string
}

interface DashboardStoreResource {
  id: string
  organizationId: string
  status: 'active' | 'provisioning'
}

interface DashboardStore {
  data: DashboardStoreResource[]
  nextCursor: string | null
}
export async function getDashboardStoreId(options: GetDashboardStoreIdOptions) {
  const {apiClient, organizationId} = options

  const client = apiClient({
    requireUser: true,
    requireProject: false,
  })

  const {data: dashboards} = await client.request<DashboardStore>({
    uri: `/dashboards`,
    query: {organizationId},
  })

  if (dashboards.filter((dashboard) => dashboard.status === 'active').length === 0) {
    throw new Error(
      `Organization not fully initialized. Please visit https://sanity.io/@${organizationId} to complete the setup.`,
    )
  }

  return dashboards[0].id
}
