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
  if (!structure || !structure.getDefaultDocumentNode) {
    return null
  }

  if (typeof structure.getDefaultDocumentNode !== 'function') {
    throw new Error('Structure export `getDefaultDocumentNode` must be a function')
  }

  const documentNode = structure.getDefaultDocumentNode(options)

  if (!documentNode) {
    return null
  }

  const isBuilder = typeof (documentNode as DocumentBuilder).serialize === 'function'
  if (!isBuilder && (documentNode as DocumentNode).type !== 'document') {
    throw new Error('`getDefaultDocumentNode` must return a document or a document builder')
  }

  return isBuilder
    ? (documentNode as DocumentBuilder)
    : new DocumentBuilder(documentNode as DocumentNode)
}
