import {Config, Source as SanitySource} from '../../config'
import {DocumentPreviewStore} from '../../preview'
import {DocumentStore} from './document'
import {GrantsStore} from './grants/types'
import {HistoryStore} from './history'
import {PresenceStore} from './presence'
import {ProjectStore} from './project'
import {SettingsStore} from './settings/types'

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
  settingsStore: SettingsStore
}
