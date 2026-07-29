import {SearchIcon} from '@sanity/icons/Search'
import {type SanityDocumentLike} from '@sanity/types'
import {Box, Card, Flex, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useSearch} from '../../../studio/components/navbar/search/hooks/useSearch'
import {variantsLocaleNamespace} from '../../i18n'

/** The base document a user picks to personalize into the variant. */
export interface VariantAddDocumentSelection {
  _id: string
  _rev?: string
}

function getHitTitle(document: SanityDocumentLike): string {
  const title = document.title ?? document.name
  return typeof title === 'string' && title.trim() ? title : document._id
}

/**
 * "Add document" picker for the variant detail page. A variant is a *lens*, not a curated bundle —
 * a document becomes part of a variant by being personalized (given a variant-scoped version). So
 * this searches existing documents and, on selection, the caller personalizes the chosen one into
 * the variant (creating its variant draft), after which it appears in the detail table.
 *
 * (Create-a-new-document-from-scratch is a follow-up; this first pass covers personalizing an
 * existing document, which is the common case and unblocks populating a variant.)
 *
 * @internal
 */
export function VariantAddDocumentDialog({
  onClose,
  onSelect,
}: {
  onClose: () => void
  onSelect: (document: VariantAddDocumentSelection) => void
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const schema = useSchema()
  const [query, setQuery] = useState('')

  const {handleSearch, searchState} = useSearch({
    allowEmptyQueries: true,
    initialState: {hits: [], loading: false, error: null, terms: {query: '', types: []}},
    schema,
  })

  const runSearch = useCallback(
    (value: string) => {
      handleSearch({options: {limit: 50}, terms: {query: value, types: []}})
    },
    [handleSearch],
  )

  // Open with an initial (empty-query) search so the dialog lands on recent documents.
  useEffect(() => {
    runSearch('')
  }, [runSearch])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value
      setQuery(value)
      runSearch(value)
    },
    [runSearch],
  )

  const {hits, loading} = searchState

  return (
    <Dialog
      data-testid="variant-add-document-dialog"
      header={t('detail.add-document.header')}
      id="variant-add-document-dialog"
      onClose={onClose}
      width={1}
    >
      <Box padding={3}>
        <Stack space={3}>
          <TextInput
            autoFocus
            data-testid="variant-add-document-search"
            icon={SearchIcon}
            onChange={handleChange}
            placeholder={t('detail.add-document.search-placeholder')}
            value={query}
          />
          {loading ? (
            <Flex align="center" justify="center" padding={4}>
              <Spinner muted />
            </Flex>
          ) : hits.length === 0 ? (
            <Card padding={3} radius={2} tone="transparent">
              <Text muted size={1}>
                {t('detail.add-document.no-results')}
              </Text>
            </Card>
          ) : (
            <Stack space={1} style={{maxHeight: '45vh', overflowY: 'auto'}}>
              {hits.map(({hit}) => {
                const schemaType = schema.get(hit._type)
                const Icon = schemaType?.icon
                return (
                  <Card
                    key={hit._id}
                    as="button"
                    data-testid="variant-add-document-result"
                    onClick={() => onSelect({_id: hit._id, _rev: hit._rev})}
                    padding={2}
                    radius={2}
                    tone="inherit"
                  >
                    <Flex align="center" gap={3}>
                      {Icon && (
                        <Text muted size={1}>
                          <Icon />
                        </Text>
                      )}
                      <Box flex={1} style={{minWidth: 0}}>
                        <Text align="left" size={1} textOverflow="ellipsis">
                          {getHitTitle(hit)}
                        </Text>
                      </Box>
                      <Text muted size={1}>
                        {schemaType?.title || hit._type}
                      </Text>
                    </Flex>
                  </Card>
                )
              })}
            </Stack>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
