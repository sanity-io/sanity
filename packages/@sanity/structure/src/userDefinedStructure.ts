import {DocumentBuilder} from './Document'
import {DocumentNode} from './StructureNodes'
import {getUserDefinedStructure} from './parts/userStructure'

export interface DocumentFragmentResolveOptions {
  documentId?: string
  schemaType: string
}

export const getUserDefinedDefaultDocumentBuilder = (
  options: DocumentFragmentResolveOptions
): DocumentBuilder | null => {
  const structure = getUserDefinedStructure()
  if (!structure || !structure.getDefaultDocumentFragment) {
    return null
  }

  if (typeof structure.getDefaultDocumentFragment !== 'function') {
    throw new Error('Structure export `getDefaultDocumentFragment` must be a function')
  }

  const documentNode = structure.getDefaultDocumentFragment(options)

  if (!documentNode) {
    return null
  }

  const isBuilder = typeof (documentNode as DocumentBuilder).serialize === 'function'
  if (!isBuilder && (documentNode as DocumentNode).type !== 'document') {
    throw new Error('`getDefaultDocumentFragment` must return a document or a document builder')
  }

  return isBuilder
    ? (documentNode as DocumentBuilder)
    : new DocumentBuilder(documentNode as DocumentNode)
}
