import {DefaultDocumentNodeResolver} from '../structureBuilder'
import {StructureResolver} from './structure'

export interface DeskToolOptions {
  icon?: React.ComponentType
  name?: string
  source?: string
  structure?: StructureResolver
  defaultDocumentNode?: DefaultDocumentNodeResolver
  title?: string
}
