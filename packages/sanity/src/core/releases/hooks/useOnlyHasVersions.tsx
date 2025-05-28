import {isVersionId} from '../../util/draftUtils'
import {useDocumentVersions} from './useDocumentVersions'

/**
 * Returns a boolean if the document has only versions
 *
 * @param documentId - document id related to the document version list
 * @returns if the document has only versions
 *
 * @beta
 */
export const useOnlyHasVersions = ({documentId}: {documentId: string}): boolean => {
  const {data: documentVersions} = useDocumentVersions({documentId})

  const onlyHasVersions =
    documentVersions &&
    documentVersions.length > 0 &&
    !documentVersions.some((version) => !isVersionId(version))

  return onlyHasVersions
}
