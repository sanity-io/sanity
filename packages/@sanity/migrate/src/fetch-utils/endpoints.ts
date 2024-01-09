type SupportedMethod = 'GET' | 'POST'
export type Endpoint = {
  global: boolean
  path: `/${string}`
  method: SupportedMethod
}

export const endpoints = {
  users: {
    me: (): Endpoint => ({global: true, path: `/users/me`, method: 'GET'}),
  },
  data: {
    query: (dataset: string): Endpoint => ({
      global: false,
      method: 'GET',
      path: `/query/${dataset}`,
    }),
    export: (dataset: string): Endpoint => ({
      global: false,
      method: 'GET',
      path: `/data/export/${dataset}`,
    }),
    mutate: (dataset: string): Endpoint => ({
      global: false,
      method: 'POST',
      path: `/data/mutate/${dataset}`,
    }),
  },
}
