import {AddIcon, SearchIcon, ShareIcon, TrashIcon} from '@sanity/icons'
import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  Stack,
  Tab,
  TabList,
  Text,
  TextInput,
  Tooltip,
  useToast,
} from '@sanity/ui'
import {isEqual} from 'lodash-es'
import {type ReactElement, useCallback, useState} from 'react'
import {ContextMenuButton, UserAvatar, useDateTimeFormat, useTranslation} from 'sanity'

import {type QueryConfig, useSavedQueries} from '../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../i18n'
import {FixedHeader, ScrollContainer} from './QueryRecall.styled'
import {type ParsedUrlState} from './VisionGui'

export function QueryRecall({
  url,
  getStateFromUrl,
  setStateFromParsedUrl,
  currentQuery,
  currentParams,
  generateUrl,
}: {
  url?: string
  getStateFromUrl: (data: string) => ParsedUrlState | null
  setStateFromParsedUrl: (parsedUrlObj: ParsedUrlState) => void
  currentQuery: string
  currentParams: Record<string, unknown>
  generateUrl: (query: string, params: Record<string, unknown>) => string
}): ReactElement {
  type QueryFilter = 'all' | 'personal' | 'shared'
  const toast = useToast()
  const {saveQuery, updateQuery, queries, deleteQuery, saving, deleting, saveQueryError} =
    useSavedQueries()
  const {t} = useTranslation(visionLocaleNamespace)
  const formatDate = useDateTimeFormat({
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [optimisticTitles, setOptimisticTitles] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [queryFilter, setQueryFilter] = useState<QueryFilter>('all')
  const [selectedUrl, setSelectedUrl] = useState<string | undefined>(url)

  const handleSave = useCallback(async () => {
    // Generate the correct URL first
    const newUrl = generateUrl(currentQuery, currentParams)

    // Check for duplicates by comparing query content and params
    const isDuplicate = queries?.some((q) => {
      if (q.shared) return false
      const savedQueryObj = getStateFromUrl(q.url)
      return (
        savedQueryObj &&
        savedQueryObj.query === currentQuery &&
        isEqual(savedQueryObj.params, currentParams)
      )
    })

    if (isDuplicate) {
      const duplicateQuery = queries?.find((q) => {
        if (q.shared) return false
        const savedQueryObj = getStateFromUrl(q.url)
        return (
          savedQueryObj &&
          savedQueryObj.query === currentQuery &&
          isEqual(savedQueryObj.params, currentParams)
        )
      })
      toast.push({
        closable: true,
        status: 'warning',
        title: t('save-query.already-saved'),
        description: `${duplicateQuery?.title} - ${formatDate.format(new Date(duplicateQuery?.savedAt || ''))}`,
      })
      return
    }

    if (newUrl) {
      await saveQuery({
        shared: false,
        url: newUrl,
        savedAt: new Date().toISOString(),
        title: 'Untitled',
      })
      // Set the selected URL to the newly saved query's URL
      setSelectedUrl(newUrl)
    }
    if (saveQueryError) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('save-query.error'),
        description: saveQueryError.message,
      })
    } else {
      toast.push({
        closable: true,
        status: 'success',
        title: t('save-query.success'),
      })
    }
  }, [
    queries,
    saveQueryError,
    toast,
    t,
    currentQuery,
    currentParams,
    getStateFromUrl,
    generateUrl,
    formatDate,
    saveQuery,
  ])

  const handleShareQuery = useCallback(
    async (query: QueryConfig) => {
      await saveQuery({
        shared: true,
        title: query.title || t('label.untitled-query'),
        url: query.url,
        savedAt: new Date().toISOString(),
      })

      if (saveQueryError) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('save-query.error'),
          description: saveQueryError.message,
        })
        return
      }

      await deleteQuery(query._key)
      toast.push({
        closable: true,
        status: 'success',
        title: t('save-query.shared-success'),
      })
    },
    [deleteQuery, saveQuery, saveQueryError, t, toast],
  )

  const handleTitleSave = useCallback(
    async (query: QueryConfig, newTitle: string) => {
      setEditingKey(null)
      setOptimisticTitles((prev) => ({...prev, [query._key]: newTitle}))

      try {
        await updateQuery({
          ...query,
          title: newTitle,
        })
        // Clear optimistic title on success
        setOptimisticTitles((prev) => {
          const next = {...prev}
          delete next[query._key]
          return next
        })
      } catch (err) {
        // Clear optimistic title on error
        setOptimisticTitles((prev) => {
          const next = {...prev}
          delete next[query._key]
          return next
        })
        toast.push({
          closable: true,
          status: 'error',
          title: t('save-query.error'),
          description: err.message,
        })
      }
    },
    [updateQuery, toast, t],
  )

  const handleUpdate = useCallback(
    async (query: QueryConfig) => {
      const newUrl = generateUrl(currentQuery, currentParams)

      // Check for duplicates by comparing query content and params
      const isDuplicate = queries?.some((q) => {
        // Skip the current query when checking for duplicates
        if (q._key === query._key) return false
        const savedQueryObj = getStateFromUrl(q.url)
        return (
          savedQueryObj &&
          savedQueryObj.query === currentQuery &&
          isEqual(savedQueryObj.params, currentParams)
        )
      })

      if (isDuplicate) {
        const duplicateQuery = queries?.find((q) => {
          if (q._key === query._key) return false
          const savedQueryObj = getStateFromUrl(q.url)
          return (
            savedQueryObj &&
            savedQueryObj.query === currentQuery &&
            isEqual(savedQueryObj.params, currentParams)
          )
        })
        toast.push({
          closable: true,
          status: 'warning',
          title: t('save-query.already-saved'),
          description: `${duplicateQuery?.title} - ${formatDate.format(
            new Date(duplicateQuery?.savedAt || ''),
          )}`,
        })
        return
      }

      try {
        await updateQuery({
          ...query,
          url: newUrl,
          savedAt: new Date().toISOString(),
        })
        setSelectedUrl(newUrl)
        toast.push({
          closable: true,
          status: 'success',
          title: t('save-query.success'),
        })
      } catch (err) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('save-query.error'),
          description: err.message,
        })
      }
    },
    [
      currentQuery,
      currentParams,
      formatDate,
      generateUrl,
      updateQuery,
      toast,
      t,
      queries,
      getStateFromUrl,
    ],
  )

  const filteredQueries = queries?.filter((q) => {
    const matchesSearch = q?.title?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      queryFilter === 'all' ||
      (queryFilter === 'personal' && !q.shared) ||
      (queryFilter === 'shared' && q.shared)
    return matchesSearch && matchesFilter
  })

  return (
    <ScrollContainer>
      <FixedHeader space={3}>
        <Flex padding={3} paddingTop={4} paddingBottom={0} justify="space-between" align="center">
          <Text weight="semibold" style={{textTransform: 'capitalize'}} size={4}>
            {t('label.saved-queries')}
          </Text>
          <Button
            label={t('action.save-query')}
            icon={AddIcon}
            disabled={saving}
            onClick={() => void handleSave()}
            mode="bleed"
          />
        </Flex>
        <Box padding={3} paddingTop={0}>
          <TextInput
            placeholder={t('label.search-queries')}
            icon={SearchIcon}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
        </Box>
        <Box paddingX={3} paddingBottom={2}>
          <TabList space={1}>
            <Tab
              id="query-filter-all"
              label={t('label.all')}
              selected={queryFilter === 'all'}
              onClick={() => setQueryFilter('all')}
            />
            <Tab
              id="query-filter-personal"
              label={t('label.personal')}
              selected={queryFilter === 'personal'}
              onClick={() => setQueryFilter('personal')}
            />
            <Tab
              id="query-filter-shared"
              label={t('label.shared')}
              selected={queryFilter === 'shared'}
              onClick={() => setQueryFilter('shared')}
            />
          </TabList>
        </Box>
      </FixedHeader>
      <Stack paddingY={3}>
        {filteredQueries?.map((q) => {
          const queryObj = getStateFromUrl(q.url)
          const fullQueryPreview = queryObj?.query || ''
          const shortQueryPreview = fullQueryPreview.split('{')[0]
          const isSelected = selectedUrl === q.url
          const canMutateQuery = !q.shared || q.isOwnedByCurrentUser

          // Compare against current live state
          const areQueriesEqual =
            queryObj && currentQuery === queryObj.query && isEqual(currentParams, queryObj.params)

          const isEdited = isSelected && !areQueriesEqual && canMutateQuery
          return (
            <Card
              key={q._key}
              width={'fill'}
              padding={4}
              border
              tone={isSelected ? 'positive' : 'default'}
              onClick={() => {
                setSelectedUrl(q.url) // Update the selected query immediately
                const parsedUrl = getStateFromUrl(q.url)
                if (parsedUrl) {
                  setStateFromParsedUrl(parsedUrl)
                }
              }}
              style={{position: 'relative'}}
            >
              <Stack space={3}>
                <Flex justify="space-between" align={'center'}>
                  <Flex align="center" gap={2} paddingRight={1}>
                    {editingKey === q._key ? (
                      <TextInput
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.currentTarget.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            void handleTitleSave(q, editingTitle)
                          } else if (event.key === 'Escape') {
                            setEditingKey(null)
                          }
                        }}
                        onBlur={() => handleTitleSave(q, editingTitle)}
                        autoFocus
                        style={{maxWidth: '170px', height: '24px'}}
                      />
                    ) : (
                      <Text
                        weight="bold"
                        size={3}
                        textOverflow="ellipsis"
                        style={{
                          maxWidth: '170px',
                          cursor: canMutateQuery ? 'pointer' : 'default',
                          padding: '4px 0',
                        }}
                        title={
                          optimisticTitles[q._key] ||
                          q.title ||
                          q._key.slice(q._key.length - 5, q._key.length)
                        }
                        onClick={
                          canMutateQuery
                            ? () => {
                                setEditingKey(q._key)
                                setEditingTitle(q.title || q._key.slice(0, 5))
                              }
                            : undefined
                        }
                      >
                        {optimisticTitles[q._key] ||
                          q.title ||
                          q._key.slice(q._key.length - 5, q._key.length)}
                      </Text>
                    )}
                    {isEdited && (
                      <Box
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--card-focus-ring-color)',
                        }}
                      />
                    )}
                  </Flex>
                  {!q.shared && (
                    <MenuButton
                      button={<ContextMenuButton />}
                      id={`${q._key}-menu`}
                      menu={
                        <Menu>
                          <MenuItem
                            icon={ShareIcon}
                            padding={3}
                            text={t('label.share')}
                            onClick={(event) => {
                              event.stopPropagation()
                              void handleShareQuery(q)
                            }}
                          />
                          <MenuItem
                            tone="critical"
                            padding={3}
                            icon={TrashIcon}
                            text={t('action.delete')}
                            onClick={(event) => {
                              event.stopPropagation()
                              void deleteQuery(q._key)
                            }}
                          />
                        </Menu>
                      }
                      popover={{portal: true, placement: 'bottom-end', tone: 'default'}}
                    />
                  )}
                  {q.shared && canMutateQuery && (
                    <MenuButton
                      button={
                        <Button mode="bleed" padding={0}>
                          <UserAvatar size={0} user={q.authorId || ''} withTooltip />
                        </Button>
                      }
                      id={`${q._key}-menu`}
                      menu={
                        <Menu>
                          <MenuItem
                            tone="critical"
                            padding={3}
                            icon={TrashIcon}
                            text={t('action.delete')}
                            onClick={(event) => {
                              event.stopPropagation()
                              void deleteQuery(q._key)
                            }}
                          />
                        </Menu>
                      }
                      popover={{portal: true, placement: 'bottom-end', tone: 'default'}}
                    />
                  )}
                  {q.shared && !canMutateQuery && (
                    <Box padding={1}>
                      <UserAvatar size={0} user={q.authorId || ''} withTooltip />
                    </Box>
                  )}
                </Flex>

                {fullQueryPreview ? (
                  <Tooltip
                    content={
                      <Box
                        padding={2}
                        style={{maxWidth: '420px', maxHeight: '220px', overflow: 'auto'}}
                      >
                        <Code size={1}>{fullQueryPreview}</Code>
                      </Box>
                    }
                    placement="top"
                    portal
                  >
                    <Code muted>{shortQueryPreview}</Code>
                  </Tooltip>
                ) : (
                  <Code muted />
                )}

                <Flex align="center" gap={1}>
                  <Text size={1} muted>
                    {formatDate.format(new Date(q.savedAt || ''))}
                  </Text>
                </Flex>

                {q.shared && (
                  <Box
                    style={{
                      position: 'absolute',
                      right: '16px',
                      bottom: isEdited ? '44px' : '16px',
                    }}
                  >
                    <Badge mode="outline" tone="primary">
                      {t('label.shared')}
                    </Badge>
                  </Box>
                )}

                {isEdited && (
                  <Button
                    mode="ghost"
                    tone="default"
                    size={1}
                    padding={2}
                    style={{
                      height: '24px',
                      position: 'absolute',
                      right: '16px',
                      bottom: '16px',
                      fontSize: '12px',
                    }}
                    text={t('action.update')}
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleUpdate(q)
                    }}
                  />
                )}
              </Stack>
            </Card>
          )
        })}
      </Stack>
    </ScrollContainer>
  )
}
