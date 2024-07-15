import {diffInput, wrap} from '@sanity/diff'
import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Card, Container, Flex, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  type BundleDocument,
  ChangeResolver,
  getPublishedId,
  LoadingBlock,
  type ObjectDiff,
  useDocumentPreviewStore,
  useSchema,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'

import {buildChangeList} from '../../../../field/diff/changes/buildChangeList'
import {useDocumentPreviewValues} from '../documentTable/useDocumentPreviewValues'
import {type DocumentHistory} from '../documentTable/useReleaseHistory'
import {DocumentReviewHeader} from '../review/DocumentReviewHeader'

const ChangesWrapper = styled(Container)((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    [data-ui='group-change-content'] {
      // Hide the first grouping border border
      &::before {
        display: none;
      }
      [data-ui='group-change-list'] {
        grid-gap: ${theme.space[6]}px;
      }

      [data-ui='group-change-content'] {
        // For inner groupings, show the border and reduce the gap
        &::before {
          display: block;
        }
        [data-ui='group-change-list'] {
          grid-gap: ${theme.space[4]}px;
        }
      }
    }

    [data-ui='field-diff-inspect-wrapper'] {
      // Hide the border of the field diff wrapper
      padding: 0;
      padding-top: ${theme.space[2]}px;
      &::before {
        display: none;
      }
    }
  `
})

const FieldWrapper = styled.div`
  [data-changed] {
    cursor: default;
  }

  [data-diff-action='removed'] {
    background-color: var(--card-badge-critical-bg-color);
    color: var(--card-badge-critical-fg-color);
  }
  [data-diff-action='added'] {
    background-color: var(--card-badge-positive-bg-color);
    color: var(--card-badge-positive-fg-color);
  }

  [data-ui='diff-card'] {
    cursor: default;

    background-color: var(--card-badge-positive-bg-color);
    color: var(--card-badge-positive-fg-color);
    &:has(del) {
      background-color: var(--card-badge-critical-bg-color);
      color: var(--card-badge-critical-fg-color);
    }
    &[data-hover] {
      &::after {
        // Remove the hover effect for the cards
        display: none;
      }
    }
  }

  del[data-ui='diff-card'] {
    background-color: var(--card-badge-critical-bg-color);
    color: var(--card-badge-critical-fg-color);
  }

  ins[data-ui='diff-card'] {
    background-color: var(--card-badge-positive-bg-color);
    color: var(--card-badge-positive-fg-color);
  }

  del {
    text-decoration: none;
    &:hover {
      // Hides the border bottom added to the text differences when hovering
      background-image: none;
    }
  }
  ins {
    &:hover {
      // Hides the border bottom added to the text differences when hovering
      background-image: none;
    }
  }
`

const buildDocumentForDiffInput = (document: SanityDocument) => {
  // Remove internal fields and undefined values
  const {_id, _rev, _createdAt, _updatedAt, _type, _version, ...rest} = JSON.parse(
    JSON.stringify(document),
  )

  return rest
}

function useObserveDocument(documentId: string, schemaType: ObjectSchemaType) {
  const documentPreviewStore = useDocumentPreviewStore()
  const observePaths = documentPreviewStore.observePaths(
    {_id: documentId},
    schemaType.fields.map((field) => [field.name]),
  )
  const baseDocument = useObservable(observePaths, 'loading') as
    | SanityDocument
    | 'loading'
    | undefined

  return {
    baseDocument: baseDocument === 'loading' ? null : baseDocument,
    loading: baseDocument === 'loading',
  }
}

export function DocumentDiff({
  document,
  release,
  history,
}: {
  document: SanityDocument
  release: BundleDocument
  history?: DocumentHistory
}) {
  const publishedId = getPublishedId(document._id, true)
  const schema = useSchema()
  const schemaType = schema.get(document._type) as ObjectSchemaType
  if (!schemaType) {
    throw new Error(`Schema type "${document._type}" not found`)
  }
  const {baseDocument, loading} = useObserveDocument(publishedId, schemaType)
  const {previewValues, isLoading} = useDocumentPreviewValues({document, release})

  const {changesList, rootDiff} = useMemo(() => {
    if (!baseDocument?._type) return {changesList: [], rootDiff: null}
    const diff = diffInput(
      wrap(buildDocumentForDiffInput(baseDocument), null),
      wrap(buildDocumentForDiffInput(document), null),
    ) as ObjectDiff

    if (!diff.isChanged) return {changesList: [], rootDiff: null}
    const changeList = buildChangeList(schemaType, diff, [], [], {})
    return {changesList: changeList, rootDiff: diff}
  }, [baseDocument, document, schemaType])

  if (loading) return <LoadingBlock />

  return (
    <Card border radius={3}>
      <DocumentReviewHeader
        document={document}
        previewValues={previewValues}
        isLoading={!!isLoading}
        history={history}
        release={release}
      />
      <Flex justify="center" padding={4}>
        {loading ? (
          <LoadingBlock />
        ) : (
          <>
            {baseDocument ? (
              <>
                {rootDiff?.isChanged ? (
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
                    }}
                  >
                    <ChangesWrapper width={1}>
                      {changesList.length ? (
                        changesList.map((change) => (
                          <ChangeResolver key={change.key} change={changesList[0]} />
                        ))
                      ) : (
                        <Text>Changes list is empty, see document</Text>
                      )}
                    </ChangesWrapper>
                  </DocumentChangeContext.Provider>
                ) : (
                  <Text>No changes</Text>
                )}
              </>
            ) : (
              <Text>New document</Text>
            )}
          </>
        )}
      </Flex>
    </Card>
  )
}
