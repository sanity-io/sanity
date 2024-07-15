import {diffInput, wrap} from '@sanity/diff'
import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Card, Container, Flex, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  type BundleDocument,
  ChangeResolver,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getPublishedId,
  LoadingBlock,
  type ObjectDiff,
  useClient,
  useSchema,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'

import {buildChangeList} from '../../../../field/diff/changes/buildChangeList'
import {useDocumentPreviewValues} from '../documentTable/useDocumentPreviewValues'
import {useVersionHistory} from '../documentTable/useVersionHistory'
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
      background-image: none;
    }
  }
  ins {
    &:hover {
      background-image: none;
    }
  }
`

const buildDocumentForDiffInput = (document: SanityDocument) => {
  // Remove internal fields
  const {_id, _rev, _createdAt, _updatedAt, _type, _version, ...rest} = document
  return rest
}

export function DocumentDiff({
  document,
  release,
}: {
  document: SanityDocument
  release: BundleDocument
}) {
  const [baseDocument, setBaseDocument] = useState<SanityDocument | null>(null)
  const [fetchingBaseDocument, setFetchingBaseDocument] = useState(false)
  // TODO: Replace this once https://github.com/sanity-io/sanity/pull/7150 is merged
  const history = useVersionHistory(document._id, document?._rev)
  const client = useClient({...DEFAULT_STUDIO_CLIENT_OPTIONS})
  const schema = useSchema()
  const schemaType = schema.get(document._type) as ObjectSchemaType
  if (!schemaType) {
    throw new Error(`Schema type "${document._type}" not found`)
  }

  const fetchBaseDocument = useCallback(async () => {
    setFetchingBaseDocument(true)
    const publishedId = getPublishedId(document._id, true)
    const query = ` *[_id == "${publishedId}"][0]`
    const response = await client.fetch(query)
    setBaseDocument(response)
    setFetchingBaseDocument(false)
  }, [client, document])

  useEffect(() => {
    fetchBaseDocument()
  }, [fetchBaseDocument])

  const {previewValues, isLoading} = useDocumentPreviewValues({document, release})
  const {changesList, loading, rootDiff} = useMemo(() => {
    if (!baseDocument) return {changesList: [], loading: fetchingBaseDocument, rootDiff: null}
    const diff = diffInput(
      wrap(buildDocumentForDiffInput(baseDocument), null),
      wrap(buildDocumentForDiffInput(document), null),
    ) as ObjectDiff

    if (!diff.isChanged) return {changesList: [], loading: fetchingBaseDocument, rootDiff: null}
    const changeList = buildChangeList(schemaType, diff, [], [], {})
    return {
      changesList: changeList,
      loading: false,
      rootDiff: diff,
    }
  }, [baseDocument, document, schemaType, fetchingBaseDocument])

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
