type SupportedMethod = 'GET' | 'POST'
export type Endpoint = {
  global: boolean
  path: `/${string}`
  searchParams: [param: string, value: string][]
  method: SupportedMethod
}

export const endpoints = {
  users: {
    me: (): Endpoint => ({
      global: true,
      path: `/users/me`,
      method: 'GET',
      searchParams: [],
    }),
  },
  data: {
    query: (dataset: string): Endpoint => ({
      global: false,
      method: 'GET',
      path: `/query/${dataset}`,
      searchParams: [['perspective', 'raw']],
    }),
    export: (dataset: string, documentTypes?: string[]): Endpoint => ({
      global: false,
      method: 'GET',
      path: `/data/export/${dataset}`,
      searchParams:
        documentTypes && documentTypes?.length > 0 ? [['types', documentTypes.join(',')]] : [],
    }),
    mutate: (
      dataset: string,
      options?: {
        returnIds?: boolean
        returnDocuments?: boolean
        autoGenerateArrayKeys?: boolean
        visibility?: 'async' | 'sync' | 'deferred'
        dryRun?: boolean
        tag?: string
      },
    ): Endpoint => {
      const params = [
        options?.tag && ['tag', options.tag],
        options?.returnIds && ['returnIds', 'true'],
        options?.returnDocuments && ['returnDocuments', 'true'],
        options?.autoGenerateArrayKeys && ['autoGenerateArrayKeys', 'true'],
        options?.visibility && ['visibility', options.visibility],
        options?.dryRun && ['dryRun', 'true'],
      ].filter(Boolean) as [string, string][]

      return {
        global: false,
        method: 'POST',
        path: `/data/mutate/${dataset}`,
        searchParams: params,
      }
    },
  },
}
