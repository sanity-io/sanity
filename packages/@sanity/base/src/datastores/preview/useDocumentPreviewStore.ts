import type {DocumentPreviewStore} from '../../preview'
import {useDatastores} from '../useDatastores'

export function useDocumentPreviewStore(): DocumentPreviewStore {
  const datastores = useDatastores()
  return datastores.documentPreviewStore
}
