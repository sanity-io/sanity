import {WorkshopScope} from '@sanity/ui-workshop'

export interface WorkshopOptions {
  collections?: {name: string; title: string}[]
  scopes: WorkshopScope[]
  icon?: React.ComponentType
  name?: string
  title?: string
}
