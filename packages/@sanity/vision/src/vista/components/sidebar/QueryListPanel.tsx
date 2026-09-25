import {AddIcon} from '@sanity/icons/Add'
import {EditIcon} from '@sanity/icons/Edit'
import {LaunchIcon} from '@sanity/icons/Launch'
import {RetrieveIcon} from '@sanity/icons/Retrieve'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {UsersIcon} from '@sanity/icons/Users'
import {Button, Card, Dialog, Text, TextInput} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useToast} from '@sanity/ui/toast'
import {Tooltip} from '@sanity/ui/tooltip'
import {type KeyboardEvent, useCallback, useMemo, useState} from 'react'
import {ContextMenuButton, UserAvatar, useDateTimeFormat, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {type QueryConfig} from '../../../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../../../i18n'
import {type ParsedQueryUrl, parseQueryUrl} from '../../../util/parseQueryUrl'
import {useOnValueChange} from '../../hooks/useOnValueChange'
import {useQueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {useSaveCurrentQuery} from '../../hooks/useSaveCurrentQuery'
import {type VistaDrawer} from '../../store/types'
import {useSavedQueriesApi, useVistaActor, useVistaSelector} from '../../store/VistaActorContext'
import {selectActiveTab, selectDatasets, selectWorkspaceDataset} from '../../store/vistaMachine'
import {savedQueryToTabInit, tabMatchesParsedQuery} from '../../util/savedQueryTab'
import {listItemButton, previewCode, scrollArea} from '../vista.css'

interface QueryListPanelProps {
  mode: VistaDrawer
}

/** A saved query with its URL parsed once, so rendering and matching do not parse it again */
interface QueryListItem {
  query: QueryConfig
  parsed: ParsedQueryUrl | null
  /** First line of the GROQ, up to the projection */
  preview: string
}

export function QueryListPanel({mode}: QueryListPanelProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVistaActor()
  const activeTab = useVistaSelector(selectActiveTab)
  const tabs = useVistaSelector((snapshot) => snapshot.context.tabs)
  const datasets = useVistaSelector(selectDatasets)
  const workspaceDataset = useVistaSelector(selectWorkspaceDataset)
  const {request} = useQueryRequestBuilder(activeTab)
  const {queries, updateQuery, deleteQuery, deleteQueryError, shareQuery, unshareQuery} =
    useSavedQueriesApi()
  const {saveCurrent, canSave} = useSaveCurrentQuery(activeTab, request)
  const formatDate = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})

  const [search, setSearch] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [shareCandidate, setShareCandidate] = useState<QueryConfig | null>(null)

  const items = useMemo((): QueryListItem[] => {
    return queries
      .filter((query) => (mode === 'shared' ? query.shared : !query.shared))
      .map((query) => {
        const parsed = parseQueryUrl(query.url, datasets)
        const preview = (parsed?.query || '').split('\n')[0].split('{')[0].trim()
        return {query, parsed, preview}
      })
  }, [datasets, mode, queries])

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      ({query, parsed}) =>
        (query.title || '').toLowerCase().includes(term) ||
        (parsed?.query || '').toLowerCase().includes(term),
    )
  }, [items, search])

  const isOpenInTab = useCallback(
    (parsed: ParsedQueryUrl | null) =>
      parsed !== null && tabs.some((tab) => tabMatchesParsedQuery(tab, parsed, workspaceDataset)),
    [tabs, workspaceDataset],
  )

  const reportError = useCallback(
    (err: unknown) => {
      toast.push({
        closable: true,
        status: 'error',
        title: t('save-query.error'),
        description: err instanceof Error ? err.message : String(err),
      })
    },
    [t, toast],
  )

  // `deleteQuery` resolves either way and reports failures through this state instead
  useOnValueChange(deleteQueryError, (error) => {
    if (error) reportError(error)
  })

  const openInNewTab = useCallback(
    ({query, parsed}: QueryListItem) => {
      if (!parsed) return
      const existing = tabs.find((tab) => tabMatchesParsedQuery(tab, parsed, workspaceDataset))
      if (existing) {
        actorRef.send({type: 'tab.select', id: existing.id})
      } else {
        actorRef.send({type: 'tab.add', tab: savedQueryToTabInit(query, parsed)})
      }
    },
    [actorRef, tabs, workspaceDataset],
  )

  const loadIntoCurrentTab = useCallback(
    ({query, parsed}: QueryListItem) => {
      if (!parsed) return
      actorRef.send({type: 'tab.load', id: activeTab.id, tab: savedQueryToTabInit(query, parsed)})
    },
    [actorRef, activeTab.id],
  )

  const startRename = useCallback((query: QueryConfig) => {
    setEditingKey(query._key)
    setEditingTitle(query.title || '')
  }, [])

  const commitRename = useCallback(
    async (query: QueryConfig) => {
      setEditingKey(null)
      const title = editingTitle.trim()
      if (!title || title === query.title) return
      try {
        await updateQuery({...query, title})
      } catch (err) {
        reportError(err)
      }
    },
    [editingTitle, reportError, updateQuery],
  )

  const handleConfirmShare = useCallback(async () => {
    if (!shareCandidate) return
    const candidate = shareCandidate
    setShareCandidate(null)
    try {
      await shareQuery(candidate._key)
      toast.push({closable: true, status: 'success', title: t('save-query.shared-success')})
    } catch (err) {
      reportError(err)
    }
  }, [reportError, shareCandidate, shareQuery, t, toast])

  const handleUnshare = useCallback(
    async (query: QueryConfig) => {
      try {
        await unshareQuery(query._key)
        toast.push({closable: true, status: 'success', title: t('save-query.unshared-success')})
      } catch (err) {
        reportError(err)
      }
    },
    [reportError, t, toast, unshareQuery],
  )

  const emptyText = search.trim()
    ? t('vista.saved.empty-search')
    : mode === 'saved'
      ? t('vista.saved.empty')
      : t('vista.shared.empty')

  return (
    <Flex flexBasis="0%" flexDirection="column" flexGrow={1} minHeight="0">
      <Flex alignItems="center" borderBottom flexShrink={0} gap={2} padding={2}>
        <Box flexBasis="0%" flexGrow={1}>
          <TextInput
            fontSize={1}
            icon={SearchIcon}
            onChange={(event) => setSearch(event.currentTarget.value)}
            padding={2}
            placeholder={t('label.search-queries')}
            value={search}
          />
        </Box>
        {mode === 'saved' && (
          <Tooltip content={<Text size={1}>{t('vista.saved.save-current')}</Text>} portal>
            <Button
              aria-label={t('vista.saved.save-current')}
              data-testid="vista-save-current-query"
              disabled={!canSave}
              icon={AddIcon}
              mode="ghost"
              onClick={() => void saveCurrent()}
              padding={2}
            />
          </Tooltip>
        )}
      </Flex>

      <Box className={scrollArea} flexBasis="0%" flexGrow={1}>
        {visibleItems.length === 0 ? (
          <Box padding={4}>
            <Text muted size={1}>
              {emptyText}
            </Text>
          </Box>
        ) : (
          <Flex flexDirection="column" minWidth="0">
            {visibleItems.map((item) => {
              const {query, parsed, preview} = item
              const canMutate = !query.shared || query.isOwnedByCurrentUser
              const isEditing = editingKey === query._key
              const isOpen = isOpenInTab(parsed)

              return (
                <Card
                  borderBottom
                  data-testid="vista-saved-query"
                  key={query._key}
                  padding={1}
                  tone={isOpen ? 'transparent' : 'default'}
                >
                  <Flex alignItems="flex-start" gap={1}>
                    <Box flexBasis="0%" flexGrow={1} minWidth="0">
                      {isEditing ? (
                        <Box padding={2}>
                          <TextInput
                            autoFocus
                            fontSize={1}
                            onBlur={() => void commitRename(query)}
                            onChange={(event) => setEditingTitle(event.currentTarget.value)}
                            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                              if (event.key === 'Enter') void commitRename(query)
                              if (event.key === 'Escape') setEditingKey(null)
                            }}
                            padding={1}
                            value={editingTitle}
                          />
                        </Box>
                      ) : (
                        <Button
                          className={listItemButton}
                          data-testid="vista-saved-query-open"
                          justify="flex-start"
                          mode="bleed"
                          onClick={() => openInNewTab(item)}
                          padding={2}
                          selected={isOpen}
                          width="fill"
                        >
                          <Flex flexDirection="column" gap={2} minWidth="0">
                            <Text size={1} textOverflow="ellipsis" weight="medium">
                              {query.title || t('label.untitled-query')}
                            </Text>
                            {preview && (
                              <Box className={previewCode}>
                                <Code size={0}>{preview}</Code>
                              </Box>
                            )}
                            <Flex alignItems="center" gap={2}>
                              {query.shared && query.authorId && (
                                <UserAvatar size={0} user={query.authorId} withTooltip />
                              )}
                              <Text muted size={0}>
                                {query.savedAt ? formatDate.format(new Date(query.savedAt)) : ''}
                              </Text>
                            </Flex>
                          </Flex>
                        </Button>
                      )}
                    </Box>
                    <Box paddingTop={1}>
                      <MenuButton
                        button={<ContextMenuButton />}
                        id={`vista-saved-query-menu-${query._key}`}
                        menu={
                          <Menu>
                            <MenuItem
                              icon={LaunchIcon}
                              onClick={() => openInNewTab(item)}
                              text={t('vista.saved.open-in-new-tab')}
                            />
                            <MenuItem
                              icon={RetrieveIcon}
                              onClick={() => loadIntoCurrentTab(item)}
                              text={t('vista.saved.load-in-current-tab')}
                            />
                            {canMutate && (
                              <>
                                <MenuDivider />
                                <MenuItem
                                  icon={EditIcon}
                                  onClick={() => startRename(query)}
                                  text={t('vista.saved.rename')}
                                />
                                {query.shared ? (
                                  <MenuItem
                                    icon={UnpublishIcon}
                                    onClick={() => void handleUnshare(query)}
                                    text={t('action.unshare')}
                                  />
                                ) : (
                                  <MenuItem
                                    icon={UsersIcon}
                                    onClick={() => setShareCandidate(query)}
                                    text={t('label.share')}
                                  />
                                )}
                                <MenuItem
                                  icon={TrashIcon}
                                  onClick={() => void deleteQuery(query._key)}
                                  text={t('action.delete')}
                                  tone="critical"
                                />
                              </>
                            )}
                          </Menu>
                        }
                        popover={{portal: true, placement: 'bottom-end'}}
                      />
                    </Box>
                  </Flex>
                </Card>
              )
            })}
          </Flex>
        )}
      </Box>

      {shareCandidate && (
        <Dialog
          footer={
            <Flex gap={2} justifyContent="flex-end" padding={3}>
              <Button
                mode="bleed"
                onClick={() => setShareCandidate(null)}
                text={t('action.query-cancel')}
              />
              <Button
                onClick={() => void handleConfirmShare()}
                text={t('action.save-shared-query')}
                tone="primary"
              />
            </Flex>
          }
          header={t('label.share')}
          id="vista-share-query-dialog"
          onClose={() => setShareCandidate(null)}
          width={0}
        >
          <Box padding={4}>
            <Text size={1}>{t('save-query.share-warning')}</Text>
          </Box>
        </Dialog>
      )}
    </Flex>
  )
}
