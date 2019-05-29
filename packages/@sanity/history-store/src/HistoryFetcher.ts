import { client } from './utils/Client'

export function getHistory(documentIds: string | string[], options: { [key: string]: any }): Promise<any> {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const { time, revision } = options
  const dataset = client.clientConfig.dataset
  const timestamp = time || new Date().toISOString()
  let url = `/data/history/${dataset}/documents/${ids.join(',')}?time=${timestamp}`
  if (revision) {
    url = `${url}&revision=${revision}`
  }

  return client.request({ url })
}

export function getTransactions(documentIds: string | string[]): Promise<any> {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const dataset = client.clientConfig.dataset
  const url = `/data/history/${dataset}/transactions/${ids.join(',')}`

  return client.request({ url })
}

