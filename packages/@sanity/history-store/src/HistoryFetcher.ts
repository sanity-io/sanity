import { client } from './utils/Client'

export function getHistory(documentIds: string | string[], options: { [key: string]: any } = {}): Promise<any> {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const { time, revision } = options

  if (time && revision) {
    throw new Error(`getHistory can't handle both time and revision parameters`)
  }

  const dataset = client.clientConfig.dataset
  let url = `/data/history/${dataset}/documents/${ids.join(',')}`

  if (revision) {
    url = `${url}?revision=${revision}`
  } else {
    const timestamp = time || new Date().toISOString()
    url = `${url}?time=${timestamp}`
  }

  return client.request({ url })
}

export function getTransactions(documentIds: string | string[]): Promise<any> {
  const ids = Array.isArray(documentIds) ? documentIds : [documentIds]
  const dataset = client.clientConfig.dataset
  const url = `/data/history/${dataset}/transactions/${ids.join(',')}`

  return client.request({ url })
}

