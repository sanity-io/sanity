import {diffInput, wrap} from '@sanity/diff'
import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

import {buildChangeList} from '../../../../field/diff/changes/buildChangeList'
import {ChangeResolver} from '../../../../field/diff/components/ChangeResolver'
import {type ObjectDiff} from '../../../../field/types'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
import {ChangesWrapper, FieldWrapper} from './DocumentDiff.styled'

const buildDocumentForDiffInput = (document: Partial<SanityDocument>) => {
  // Remove internal fields and undefined values
  const {_id, _rev, _createdAt, _updatedAt, _type, ...rest} = JSON.parse(JSON.stringify(document))

  return rest
}

/**
 * Compares two documents with the same schema type.
 * Showing the changes introduced by the document compared to the base document.
 */
export function DocumentDiff({
  baseDocument,
  document,
  schemaType,
}: {
  baseDocument: SanityDocument | null
  document: SanityDocument
  schemaType: ObjectSchemaType
}) {
  const {changesList, rootDiff} = useMemo(() => {
    const diff = diffInput(
      wrap(buildDocumentForDiffInput(baseDocument ?? {}), null),
      wrap(buildDocumentForDiffInput(document), null),
    ) as ObjectDiff

    if (!diff.isChanged) return {changesList: [], rootDiff: null}
    const changeList = buildChangeList(schemaType, diff, [], [], {})
    return {changesList: changeList, rootDiff: diff}
  }, [baseDocument, document, schemaType])
  const {t} = useTranslation(releasesLocaleNamespace)

  const isChanged = !!rootDiff?.isChanged

  if (!isChanged) {
    return <Text>{t('diff.no-changes')}</Text>
  }

  return (
    <DocumentChangeContext.Provider
      value={{
        documentId: document._id,
        schemaType,
        rootDiff: rootDiff,
        isComparingCurrent: false,
        FieldWrapper: (props) => {
          return <FieldWrapper>{props.children}</FieldWrapper>
        },
        value: document,
        showFromValue: !!baseDocument,
      }}
    >
      <ChangesWrapper width={1}>
        {changesList.length ? (
          changesList.map((change) => <ChangeResolver key={change.key} change={changesList[0]} />)
        ) : (
          <Text>{t('diff.list-empty')}</Text>
        )}
      </ChangesWrapper>
    </DocumentChangeContext.Provider>
  )
}
