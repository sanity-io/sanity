import {diffInput, wrap} from '@sanity/diff'
import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {useMemo} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

import {ChangeList} from '../../../../field/diff/components/ChangeList'
import {type ObjectDiff} from '../../../../field/types'
import {useSchema} from '../../../../hooks/useSchema'
import {useSource} from '../../../../studio/source'
import {getPublishedId} from '../../../../util/draftUtils'

const buildDocumentForDiffInput = (document: Partial<SanityDocument>) => {
  // Remove internal fields and undefined values
  const {_id, _rev, _createdAt, _updatedAt, ...rest} = JSON.parse(JSON.stringify(document))

  return rest
}

/**
 * Compares two documents with the same schema type.
 * Showing the changes introduced by the document compared to the base document.
 * Use with caution, this component is not optimized for performance if the document is live synced. Use it with snapshots of the document instead.
 */
export function DocumentDiff({
  baseDocument,
  document,
}: {
  baseDocument: SanityDocument | null
  document: SanityDocument
}) {
  const schema = useSchema()
  const schemaType = schema.get(document._type) as ObjectSchemaType
  const {currentUser} = useSource()

  const rootDiff = useMemo(() => {
    const diff = diffInput(
      wrap(buildDocumentForDiffInput(baseDocument ?? {}), {
        author: currentUser?.id,
      }),
      wrap(buildDocumentForDiffInput(document), {
        author: currentUser?.id,
      }),
    ) as ObjectDiff
    return diff
  }, [baseDocument, document, currentUser?.id])

  return (
    <DocumentChangeContext.Provider
      value={{
        documentId: getPublishedId(document._id),
        schemaType,
        rootDiff,
        isComparingCurrent: false,
        FieldWrapper: (props) => props.children,
        value: document,
        showFromValue: true,
      }}
    >
      <ChangeList diff={rootDiff} schemaType={schemaType} />
    </DocumentChangeContext.Provider>
  )
}
