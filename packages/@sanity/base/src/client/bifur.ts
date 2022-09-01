import {fromUrl} from '@sanity/bifur-client'
import {memoize} from 'lodash'
import {authToken$} from '../datastores/authState'
import {getVersionedClient} from './versionedClient'

export const getBifur = memoize(() => {
  const bifurVersionedClient = getVersionedClient('2022-06-30')
  const dataset = bifurVersionedClient.config().dataset

  const url = bifurVersionedClient.getUrl(`/socket/${dataset}`).replace(/^http/, 'ws')

  return fromUrl(url, {token$: authToken$})
})
