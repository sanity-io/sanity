import {type Config, type Source as SanitySource} from '../../config/types'
import {type DocumentPreviewStore} from '../../preview'
import {type KeyValueStore} from '../key-value/types'
import {type DocumentStore} from './document'
import {type GrantsStore} from './grants/types'
import {type HistoryStore} from './history'
import {type PresenceStore} from './presence/presence-store'
import {type ProjectStore} from './project'

export interface DatastoresContext {
  config: Config
  source: SanitySource
}

export interface Datastores {
  documentStore: DocumentStore
  documentPreviewStore: DocumentPreviewStore
  grantsStore: GrantsStore
  historyStore: HistoryStore
  presenceStore: PresenceStore
  projectStore: ProjectStore
  keyValueStore: KeyValueStore
}
