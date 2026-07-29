import {AddIcon} from '@sanity/icons/Add'
import {SearchIcon} from '@sanity/icons/Search'
import {type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {Badge, Box, Card, Flex, Menu, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'

import {Button} from '../../../../ui-components/button/Button'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useSchema} from '../../../hooks/useSchema'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {SanityDefaultPreview} from '../../../preview/components/SanityDefaultPreview'
import {getPreviewStateObservable} from '../../../preview/utils/getPreviewStateObservable'
import {getPreviewValueWithFallback} from '../../../preview/utils/getPreviewValueWithFallback'
import {useDocumentPreviewStore} from '../../../store/datastores'
import {useSearch} from '../../../studio/components/navbar/search/hooks/useSearch'
import {variantsLocaleNamespace} from '../../i18n'

/** The base document a user picks to personalize into the variant. */
export interface VariantAddDocumentSelection {
  _id: string
  _rev?: string
}

/**
 * A single search result, rendered with the document's real Studio preview (icon · title ·
 * subtitle · media) via the shared preview store — the same reading as omnisearch and the tables,
 * rather than a raw id. Clicking it personalizes the document into the variant.
 */
function AddDocumentResultItem({
  hit,
  schemaType,
  onSelect,
}: {
  hit: SanityDocumentLike
  schemaType: SchemaType
  onSelect: (document: VariantAddDocumentSelection) => void
}): React.JSX.Element {
  const documentPreviewStore = useDocumentPreviewStore()
  const observable = useMemo(
    () => getPreviewStateObservable(documentPreviewStore, schemaType, hit._id, undefined),
    [documentPreviewStore, schemaType, hit._id],
  )
  const documentStub = useMemo(() => ({_id: hit._id, _type: hit._type}), [hit._id, hit._type])
  const {isLoading, snapshot, original} = useObservable(observable, {
    snapshot: null,
    isLoading: true,
    original: null,
  })

  return (
    <Card
      as="button"
      data-testid="variant-add-document-result"
      onClick={() => onSelect({_id: hit._id, _rev: hit._rev})}
      padding={2}
      radius={2}
      tone="inherit"
    >
      <SanityDefaultPreview
        {...getPreviewValueWithFallback({snapshot, original, fallback: documentStub})}
        icon={schemaType.icon}
        isPlaceholder={isLoading ?? true}
        layout="default"
        status={<Badge>{schemaType.title || hit._type}</Badge>}
      />
    </Card>
  )
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
  onCreateNew,
}: {
  onClose: () => void
  onSelect: (document: VariantAddDocumentSelection) => void
  onCreateNew: (type: string) => void
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const schema = useSchema()
  const [query, setQuery] = useState('')

  // The document types a new document can be created as (real document types, not internal ones).
  const documentTypes = useMemo(
    () =>
      schema
        .getTypeNames()
        .map((name) => schema.get(name))
        .filter((type): type is SchemaType => {
          if (!type || type.type?.name !== 'document') return false
          return !type.name.startsWith('sanity.') && !type.name.startsWith('system.')
        }),
    [schema],
  )

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
                if (!schemaType) return null
                return (
                  <AddDocumentResultItem
                    key={hit._id}
                    hit={hit}
                    onSelect={onSelect}
                    schemaType={schemaType}
                  />
                )
              })}
            </Stack>
          )}
          {documentTypes.length > 0 && (
            <MenuButton
              id="variant-add-document-new"
              button={
                <Button
                  data-testid="variant-add-document-new"
                  icon={AddIcon}
                  mode="ghost"
                  text={t('detail.add-document.new')}
                />
              }
              menu={
                <Menu>
                  {documentTypes.map((type) => (
                    <MenuItem
                      key={type.name}
                      onClick={() => onCreateNew(type.name)}
                      text={type.title || type.name}
                    />
                  ))}
                </Menu>
              }
              popover={{placement: 'top-start', portal: true}}
            />
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
