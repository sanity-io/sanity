import {fromUrl} from '@sanity/bifur-client'
import {authToken$} from '../datastores/authState'
import {getVersionedClient} from './versionedClient'

const bifurVersionedClient = getVersionedClient('2022-06-30')
const dataset = bifurVersionedClient.config().dataset

const url = bifurVersionedClient.getUrl(`/socket/${dataset}`).replace(/^http/, 'ws')

export const bifur = fromUrl(url, {token$: authToken$})
