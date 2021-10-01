import {MenuItem, MenuItemGroup} from '@sanity/base/__legacy/@sanity/components'
import {SanityDocument} from '@sanity/types'
import {BaseDeskToolPaneProps} from '../types'

export type TimelineMode = 'since' | 'rev' | 'closed'

export interface DocumentPaneOptions {
  id: string
  type: string
  template?: string
  templateParameters?: Record<string, unknown>
}

export interface DocumentView {
  type: string
  id: string
  title: string
  // @todo: provide proper typings for this
  // eslint-disable-next-line @typescript-eslint/ban-types
  options: {}
  component: React.ComponentType<{
    document: {
      draft: SanityDocument | null
      displayed: Partial<SanityDocument>
      historical: Partial<SanityDocument> | null
      published: SanityDocument | null
    }
    documentId: string
    // @todo: provide proper typings for this
    // eslint-disable-next-line @typescript-eslint/ban-types
    options: {}
    schemaType: any
  }>
  icon?: React.ComponentType
}

export type DocumentPaneProviderProps = BaseDeskToolPaneProps<{
  type: 'document'
  initialValue?: SanityDocument
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
  options: DocumentPaneOptions
  title?: string
  views: DocumentView[]
}>
