import {DocumentBuilder} from '../Document'
import {DocumentNode} from '../StructureNodes'
import {DocumentFragmentResolveOptions} from '../userDefinedStructure'

interface UserDefinedStructure {
  getDefaultDocumentNode?: (
    options: DocumentFragmentResolveOptions
  ) => DocumentNode | DocumentBuilder | null
}

export function getUserDefinedStructure(): UserDefinedStructure | undefined {
  return require('part:@sanity/desk-tool/structure?')
}
