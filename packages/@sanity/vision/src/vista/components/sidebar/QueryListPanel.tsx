import {AddIcon} from '@sanity/icons/Add'
import {EditIcon} from '@sanity/icons/Edit'
import {LaunchIcon} from '@sanity/icons/Launch'
import {RetrieveIcon} from '@sanity/icons/Retrieve'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {UsersIcon} from '@sanity/icons/Users'
import {Button, Card, Dialog, Stack, Text, TextInput} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useToast} from '@sanity/ui/toast'
import {Tooltip} from '@sanity/ui/tooltip'
import {type KeyboardEvent, useCallback, useMemo, useState} from 'react'
import {ContextMenuButton, UserAvatar, useDateTimeFormat, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {type QueryConfig} from '../../../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../../../i18n'
import {useQueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {useSaveCurrentQuery} from '../../hooks/useSaveCurrentQuery'
import {type VistaDrawer} from '../../store/types'
import {useVistaActor, useVistaSelector} from '../../store/VistaActorContext'
import {selectActiveTab} from '../../store/vistaMachine'
import {parseQueryUrl} from '../../util/parseQueryUrl'
import {savedQueryToTabInit, tabMatchesSavedQuery} from '../../util/savedQueryTab'
import {previewCode, scrollArea} from '../vista.css'

interface QueryListPanelProps {
  mode: VistaDrawer
  datasets: string[]
}

export function QueryListPanel({mode, datasets}: QueryListPanelProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVistaActor()
  const activeTab = useVistaSelector(selectActiveTab)
  const tabs = useVistaSelector((snapshot) => snapshot.context.tabs)
  const {request} = useQueryRequestBuilder(activeTab)
  const {queries, saveQuery, updateQuery, deleteQuery, saveCurrent, canSave} = useSaveCurrentQuery(
    activeTab,
    request,
    datasets,
  )
  const formatDate = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})

  const [search, setSearch] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [shareCandidate, setShareCandidate] = useState<QueryConfig | null>(null)

  const visibleQueries = useMemo(() => {
    const term = search.trim().toLowerCase()
    return queries
      .filter((query) => (mode === 'shared' ? query.shared : !query.shared))
      .filter((query) => {
        if (!term) return true
        const parsed = parseQueryUrl(query.url, datasets)
        return (
          (query.title || '').toLowerCase().includes(term) ||
          (parsed?.query || '').toLowerCase().includes(term)
        )
      })
  }, [datasets, mode, queries, search])

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

  const openInNewTab = useCallback(
    (query: QueryConfig) => {
      const existing = tabs.find((tab) => tabMatchesSavedQuery(tab, query, datasets))
      if (existing) {
        actorRef.send({type: 'tab.select', id: existing.id})
        return
      }
      const init = savedQueryToTabInit(query, datasets)
      if (init) {
        actorRef.send({type: 'tab.add', tab: init})
      }
    },
    [actorRef, datasets, tabs],
  )

  const loadIntoCurrentTab = useCallback(
    (query: QueryConfig) => {
      const init = savedQueryToTabInit(query, datasets)
      if (init) {
        actorRef.send({type: 'tab.load', id: activeTab.id, tab: init})
      }
    },
    [actorRef, activeTab.id, datasets],
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
      await saveQuery({
        shared: true,
        title: candidate.title || t('label.untitled-query'),
        url: candidate.url,
        savedAt: new Date().toISOString(),
      })
      await deleteQuery(candidate._key)
      toast.push({closable: true, status: 'success', title: t('save-query.shared-success')})
    } catch (err) {
      reportError(err)
    }
  }, [deleteQuery, reportError, saveQuery, shareCandidate, t, toast])

  const handleUnshare = useCallback(
    async (query: QueryConfig) => {
      try {
        await saveQuery({
          shared: false,
          title: query.title || t('label.untitled-query'),
          url: query.url,
          savedAt: new Date().toISOString(),
        })
        await deleteQuery(query._key)
        toast.push({closable: true, status: 'success', title: t('save-query.unshared-success')})
      } catch (err) {
        reportError(err)
      }
    },
    [deleteQuery, reportError, saveQuery, t, toast],
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
        {visibleQueries.length === 0 ? (
          <Box padding={4}>
            <Text muted size={1}>
              {emptyText}
            </Text>
          </Box>
        ) : (
          <Stack>
            {visibleQueries.map((query) => {
              const parsed = parseQueryUrl(query.url, datasets)
              const preview = (parsed?.query || '').split('\n')[0].split('{')[0].trim()
              const canMutate = !query.shared || query.isOwnedByCurrentUser
              const isEditing = editingKey === query._key
              const isOpen = tabs.some((tab) => tabMatchesSavedQuery(tab, query, datasets))

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
                          data-testid="vista-saved-query-open"
                          justify="flex-start"
                          mode="bleed"
                          onClick={() => openInNewTab(query)}
                          padding={2}
                          selected={isOpen}
                          width="fill"
                        >
                          <Stack gap={2}>
                            <Text size={1} textOverflow="ellipsis" weight="medium">
                              {query.title || t('label.untitled-query')}
                            </Text>
                            {preview && (
                              <Code className={previewCode} size={0}>
                                {preview}
                              </Code>
                            )}
                            <Flex alignItems="center" gap={2}>
                              {query.shared && query.authorId && (
                                <UserAvatar size={0} user={query.authorId} withTooltip />
                              )}
                              <Text muted size={0}>
                                {query.savedAt ? formatDate.format(new Date(query.savedAt)) : ''}
                              </Text>
                            </Flex>
                          </Stack>
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
                              onClick={() => openInNewTab(query)}
                              text={t('vista.saved.open-in-new-tab')}
                            />
                            <MenuItem
                              icon={RetrieveIcon}
                              onClick={() => loadIntoCurrentTab(query)}
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
          </Stack>
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
