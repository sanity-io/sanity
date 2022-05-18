import {ConfigContext} from '../../config'
import {StructureBuilder} from '../structureBuilder'

// TODO: this should be updated to enforce the correct return type
export type StructureResolver = (S: StructureBuilder, context: ConfigContext) => unknown
