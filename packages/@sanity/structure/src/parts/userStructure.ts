import type {DocumentBuilder} from '../Document'
import type {DocumentNode} from '../StructureNodes'
import type {DocumentFragmentResolveOptions} from '../userDefinedStructure'

interface UserDefinedStructure {
  getDefaultDocumentNode?: (
    options: DocumentFragmentResolveOptions
  ) => DocumentNode | DocumentBuilder | null
}

export function getUserDefinedStructure(): UserDefinedStructure | undefined {
  return require('part:@sanity/desk-tool/structure?')
}
