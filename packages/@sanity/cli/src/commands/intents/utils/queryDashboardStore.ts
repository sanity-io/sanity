import {type CliApiClient} from '../../../types'

interface QueryDashboardStoreOptions {
  apiClient: CliApiClient
  dashboardStoreId: string
  query: string
}

export async function queryDashboardStore<T = any>(
  options: QueryDashboardStoreOptions,
): Promise<T[]> {
  const {apiClient, dashboardStoreId, query} = options

  const client = apiClient({
    requireProject: false,
    requireUser: true,
  })

  // Right now, querying the Dashboard Store is an experimental API.
  const {result} = await client
    .withConfig({apiVersion: 'vX', ignoreWarnings: ['experimental']})
    .request<{result: T[]}>({
      uri: `/dashboards/${dashboardStoreId}/query`,
      method: 'POST',
      body: {
        query,
      },
    })

  return result
}
