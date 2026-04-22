import {AddIcon, LockIcon, SearchIcon, TrashIcon, UnpublishIcon, UsersIcon} from '@sanity/icons'
import {
  Badge,
  Box,
  Button,
  Card,
  Code,
  Dialog,
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
import isEqual from 'lodash-es/isEqual.js'
import {type ReactElement, useCallback, useState} from 'react'
import {ContextMenuButton, UserAvatar, useDateTimeFormat, useTranslation} from 'sanity'

import {type QueryConfig, useSavedQueries} from '../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../i18n'
import {FixedHeader, ScrollContainer} from './QueryRecall.styled'
import {type ParsedUrlState} from './VisionGui'
import {StyledLabel} from './VisionGui.styled'

export function QueryRecall({
  url,
  getStateFromUrl,
  setStateFromParsedUrl,
  currentQuery,
  currentParams,
  generateUrl,
  compactMode = false,
}: {
  url?: string
  getStateFromUrl: (data: string) => ParsedUrlState | null
  setStateFromParsedUrl: (parsedUrlObj: ParsedUrlState) => void
  currentQuery: string
  currentParams: Record<string, unknown>
  generateUrl: (query: string, params: Record<string, unknown>) => string
  compactMode?: boolean
}): ReactElement {
  type QueryFilter = 'all' | 'personal' | 'shared'
  const toast = useToast()
  const {saveQuery, updateQuery, queries, deleteQuery, saving, deleting} = useSavedQueries()
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
  const [pendingUnshareKeys, setPendingUnshareKeys] = useState<string[]>([])
  const [shareDialogQuery, setShareDialogQuery] = useState<QueryConfig | null>(null)

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

    if (!newUrl) return

    try {
      await saveQuery({
        shared: false,
        url: newUrl,
        savedAt: new Date().toISOString(),
        title: t('label.untitled-query'),
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
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }, [
    queries,
    toast,
    t,
    currentQuery,
    currentParams,
    getStateFromUrl,
    generateUrl,
    formatDate,
    saveQuery,
  ])

  const handleShareQuery = useCallback((query: QueryConfig) => {
    setShareDialogQuery(query)
  }, [])

  const handleConfirmShareQuery = useCallback(async () => {
    if (!shareDialogQuery) return

    const sharedQueryKey = shareDialogQuery._key
    const sharedQueryUrl = shareDialogQuery.url
    const sharedQueryTitle = shareDialogQuery.title || t('label.untitled-query')

    try {
      await saveQuery({
        shared: true,
        title: sharedQueryTitle,
        url: sharedQueryUrl,
        savedAt: new Date().toISOString(),
      })

      await deleteQuery(sharedQueryKey)
      toast.push({
        closable: true,
        status: 'success',
        title: t('save-query.shared-success'),
      })
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('save-query.error'),
        description: err instanceof Error ? err.message : String(err),
      })
    }
    setShareDialogQuery(null)
  }, [deleteQuery, saveQuery, shareDialogQuery, t, toast])

  const handleUnshareQuery = useCallback(
    async (query: QueryConfig) => {
      setPendingUnshareKeys((prev) => [...prev, query._key])
      const clearPending = () =>
        setPendingUnshareKeys((prev) => prev.filter((key) => key !== query._key))
      const nextQueryObj = getStateFromUrl(query.url)
      const duplicatePersonalQuery = queries?.find((existingQuery) => {
        if (existingQuery._key === query._key) return false
        if (existingQuery.shared) return false
        const existingQueryObj = getStateFromUrl(existingQuery.url)
        return (
          nextQueryObj &&
          existingQueryObj &&
          existingQueryObj.query === nextQueryObj.query &&
          isEqual(existingQueryObj.params, nextQueryObj.params)
        )
      })
      const unsharedQueryTitle = query.title || t('label.untitled-query')

      if (duplicatePersonalQuery) {
        toast.push({
          closable: true,
          status: 'warning',
          title: t('save-query.already-saved'),
          description: `${duplicatePersonalQuery.title} - ${formatDate.format(
            new Date(duplicatePersonalQuery.savedAt || ''),
          )}`,
        })
        clearPending()
        return
      }

      try {
        await saveQuery({
          shared: false,
          title: unsharedQueryTitle,
          url: query.url,
          savedAt: new Date().toISOString(),
        })

        await deleteQuery(query._key)
        toast.push({
          closable: true,
          status: 'success',
          title: t('save-query.unshared-success'),
        })
        clearPending()
      } catch (err) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('save-query.error'),
          description: err instanceof Error ? err.message : String(err),
        })
        clearPending()
      }
    },
    [deleteQuery, formatDate, getStateFromUrl, queries, saveQuery, t, toast],
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

  const visibleQueries = queries?.filter((q) => !pendingUnshareKeys.includes(q._key))

  const filteredQueries = visibleQueries?.filter((q) => {
    const matchesSearch = (q.title ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter =
      queryFilter === 'all' ||
      (queryFilter === 'personal' && !q.shared) ||
      (queryFilter === 'shared' && q.shared)
    return matchesSearch && matchesFilter
  })

  return (
    <ScrollContainer>
      <FixedHeader space={3}>
        <Flex padding={3} paddingTop={2} paddingBottom={0} justify="space-between" align="center">
          <StyledLabel muted>{t('label.saved-queries')}</StyledLabel>
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
              aria-controls="vision-query-recall-list"
              label={t('label.all')}
              selected={queryFilter === 'all'}
              onClick={() => setQueryFilter('all')}
            />
            <Tab
              id="query-filter-personal"
              aria-controls="vision-query-recall-list"
              label={t('label.personal')}
              selected={queryFilter === 'personal'}
              onClick={() => setQueryFilter('personal')}
            />
            <Tab
              id="query-filter-shared"
              aria-controls="vision-query-recall-list"
              label={t('label.shared')}
              selected={queryFilter === 'shared'}
              onClick={() => setQueryFilter('shared')}
            />
          </TabList>
        </Box>
      </FixedHeader>
      <Stack id="vision-query-recall-list" paddingY={3}>
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
              paddingX={compactMode ? 3 : 4}
              paddingY={compactMode ? 3 : 4}
              tone="default"
              onClick={(event) => {
                const target = event.target as HTMLElement | null
                if (target?.closest('[data-query-actions="true"]')) {
                  return
                }
                setSelectedUrl(q.url) // Update the selected query immediately
                const parsedUrl = getStateFromUrl(q.url)
                if (parsedUrl) {
                  setStateFromParsedUrl(parsedUrl)
                }
              }}
              style={{
                position: 'relative',
                borderBottom: '1px solid var(--card-border-color)',
                borderLeft: isSelected
                  ? '2px solid var(--card-muted-fg-color)'
                  : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              <Stack space={compactMode ? 2 : 3}>
                <Flex justify="space-between" align={'center'} style={{minHeight: '25px'}}>
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
                        size={compactMode ? 2 : 3}
                        textOverflow="ellipsis"
                        style={{
                          maxWidth: compactMode ? '180px' : '220px',
                          cursor: canMutateQuery ? 'pointer' : 'default',
                          padding: '2px 0',
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
                  <Flex align="center" gap={2}>
                    <Box
                      data-query-actions="true"
                      style={{width: '25px', height: '25px', display: 'flex', alignItems: 'center'}}
                    >
                      {(!q.shared || canMutateQuery) && (
                        <MenuButton
                          button={<ContextMenuButton />}
                          id={`${q._key}-menu`}
                          menu={
                            <Menu>
                              {!q.shared && (
                                <MenuItem
                                  icon={UsersIcon}
                                  padding={3}
                                  text={t('label.share')}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleShareQuery(q)
                                  }}
                                />
                              )}
                              {q.shared && canMutateQuery && (
                                <MenuItem
                                  icon={UnpublishIcon}
                                  padding={3}
                                  text={t('action.unshare')}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void handleUnshareQuery(q)
                                  }}
                                />
                              )}
                              {canMutateQuery && (
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
                              )}
                            </Menu>
                          }
                          popover={{portal: true, placement: 'bottom-end', tone: 'default'}}
                        />
                      )}
                    </Box>
                  </Flex>
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
                    <Code muted size={1}>
                      {shortQueryPreview}
                    </Code>
                  </Tooltip>
                ) : (
                  <Code muted />
                )}

                <Flex
                  align="center"
                  gap={2}
                  style={{
                    paddingTop: compactMode ? '0px' : '2px',
                    height: compactMode ? '18px' : '20px',
                  }}
                >
                  <Box
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '17px',
                      height: '17px',
                    }}
                  >
                    {q.shared ? (
                      <UserAvatar size={0} user={q.authorId || ''} withTooltip />
                    ) : (
                      <Box
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 0,
                          color: 'var(--card-muted-fg-color)',
                        }}
                      >
                        <LockIcon />
                      </Box>
                    )}
                  </Box>
                  <Badge mode="outline" tone={q.shared ? 'primary' : 'default'}>
                    {q.shared ? t('label.shared') : t('label.personal')}
                  </Badge>
                  <Text size={1} muted>
                    •
                  </Text>
                  <Text size={1} muted>
                    {formatDate.format(new Date(q.savedAt || ''))}
                  </Text>
                </Flex>

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
      {shareDialogQuery && (
        <Dialog
          id="vision-query-recall-share-dialog"
          width={1}
          header={t('label.share')}
          onClose={() => setShareDialogQuery(null)}
          footer={
            <Flex justify="flex-end" gap={2}>
              <Button
                mode="bleed"
                text={t('action.query-cancel')}
                onClick={() => setShareDialogQuery(null)}
              />
              <Button
                tone="primary"
                text={t('action.save-shared-query')}
                onClick={() => void handleConfirmShareQuery()}
              />
            </Flex>
          }
        >
          <Box padding={4}>
            <Text size={2}>{t('save-query.share-warning')}</Text>
          </Box>
        </Dialog>
      )}
    </ScrollContainer>
  )
}
