import {AddIcon} from '@sanity/icons/Add'
import {ChevronLeftIcon} from '@sanity/icons/ChevronLeft'
import {SearchIcon} from '@sanity/icons/Search'
import {type SanityDocumentLike, type SchemaType} from '@sanity/types'
import {Box, Card, Flex, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'

import {Button} from '../../../../ui-components/button/Button'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
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

/** A clickable row: leading icon, a title, optional trailing content. Shared by both funnel steps. */
function PickerRow({
  icon: Icon,
  title,
  trailing,
  onClick,
  testId,
}: {
  icon?: React.ComponentType
  title: React.ReactNode
  trailing?: React.ReactNode
  onClick: () => void
  testId?: string
}): React.JSX.Element {
  return (
    <Card as="button" data-testid={testId} onClick={onClick} padding={2} radius={2} tone="inherit">
      <Flex align="center" gap={3}>
        {Icon && (
          <Text muted size={1}>
            <Icon />
          </Text>
        )}
        <Box flex={1} style={{minWidth: 0}}>
          {typeof title === 'string' ? (
            <Text align="left" size={1} textOverflow="ellipsis">
              {title}
            </Text>
          ) : (
            title
          )}
        </Box>
        {trailing}
      </Flex>
    </Card>
  )
}

/**
 * A single document search result, rendered with the document's real Studio preview (icon · title ·
 * subtitle · media) via the shared preview store — the same reading as omnisearch and the tables.
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
      />
    </Card>
  )
}

/**
 * "Add document" picker for the variant detail page, as a **type-first funnel**. A variant is a
 * lens, not a curated bundle — a document becomes part of it by being personalized. Rather than dump
 * every document (or every type) in one flat list, the picker narrows in two scoped steps:
 *
 *  1. **Choose a type** — a searchable list of document types.
 *  2. **Choose a document of that type** — search + recents scoped to the chosen type, plus a
 *     "New [type]" action that creates a fresh document of that type, personalized into the variant.
 *
 * Type is the single organising axis for both jobs (personalize existing / create new), so each step
 * stays small. When only one type is eligible, step 1 is skipped.
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

  // The document types a document can be created/personalized as (real document types, not internal).
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

  // Skip the type step when there's exactly one eligible type — no point funnelling.
  const soleType = documentTypes.length === 1 ? documentTypes[0] : null
  const [pickedType, setPickedType] = useState<SchemaType | null>(null)
  const activeType = pickedType ?? soleType

  const [typeQuery, setTypeQuery] = useState('')
  const [docQuery, setDocQuery] = useState('')

  const {handleSearch, searchState} = useSearch({
    allowEmptyQueries: true,
    initialState: {hits: [], loading: false, error: null, terms: {query: '', types: []}},
    schema,
  })

  const runDocSearch = useCallback(
    (value: string, type: SchemaType) => {
      handleSearch({options: {limit: 50}, terms: {query: value, types: [type]}})
    },
    [handleSearch],
  )

  // Land on a type → run a scoped (empty-query) search so it opens on recent documents of that type.
  useEffect(() => {
    if (activeType) runDocSearch('', activeType)
  }, [activeType, runDocSearch])

  const filteredTypes = useMemo(() => {
    const query = typeQuery.trim().toLowerCase()
    if (!query) return documentTypes
    return documentTypes.filter((type) => (type.title || type.name).toLowerCase().includes(query))
  }, [documentTypes, typeQuery])

  const handleDocQueryChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value
      setDocQuery(value)
      if (activeType) runDocSearch(value, activeType)
    },
    [activeType, runDocSearch],
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
        {activeType ? (
          // ── Step 2 · documents of the chosen type ──
          <Stack space={3}>
            <Flex align="center" gap={2}>
              {/* Back to the type step (hidden when auto-skipped to a single eligible type). */}
              {!soleType && (
                <Button
                  data-testid="variant-add-document-back"
                  icon={ChevronLeftIcon}
                  mode="bleed"
                  onClick={() => setPickedType(null)}
                  text={t('detail.add-document.back')}
                />
              )}
              <Box flex={1} />
              <Button
                data-testid="variant-add-document-new"
                icon={AddIcon}
                mode="ghost"
                onClick={() => onCreateNew(activeType.name)}
                text={t('detail.add-document.new-of-type', {
                  type: activeType.title || activeType.name,
                })}
              />
            </Flex>
            <TextInput
              autoFocus
              data-testid="variant-add-document-search"
              icon={SearchIcon}
              onChange={handleDocQueryChange}
              placeholder={t('detail.add-document.search-placeholder')}
              value={docQuery}
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
          </Stack>
        ) : (
          // ── Step 1 · choose a type ──
          <Stack space={3}>
            <TextInput
              autoFocus
              data-testid="variant-add-document-type-search"
              icon={SearchIcon}
              onChange={(event) => setTypeQuery(event.currentTarget.value)}
              placeholder={t('detail.add-document.find-type')}
              value={typeQuery}
            />
            {filteredTypes.length === 0 ? (
              <Card padding={3} radius={2} tone="transparent">
                <Text muted size={1}>
                  {t('detail.add-document.no-types')}
                </Text>
              </Card>
            ) : (
              <Stack space={1} style={{maxHeight: '45vh', overflowY: 'auto'}}>
                {filteredTypes.map((type) => (
                  <PickerRow
                    key={type.name}
                    icon={type.icon}
                    onClick={() => {
                      setPickedType(type)
                      setDocQuery('')
                    }}
                    testId="variant-add-document-type"
                    title={type.title || type.name}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Box>
    </Dialog>
  )
}
