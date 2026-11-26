import {AddIcon} from '@sanity/icons/Add'
import {EditIcon} from '@sanity/icons/Edit'
import {LaunchIcon} from '@sanity/icons/Launch'
import {RetrieveIcon} from '@sanity/icons/Retrieve'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Button, Card, TextInput} from '@sanity/ui'
import {Menu, MenuButton, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {useToast} from '@sanity/ui/toast'
import {type KeyboardEvent, useCallback, useMemo, useRef, useState} from 'react'
import {useDateTimeFormat} from 'sanity'
import {
  UserAvatar,
  ContextMenuButton,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useTranslation} from 'sanity/i18n'
import {Code, Text, Box, Flex} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {type QueryConfig} from '../../../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../../../i18n'
import {type ParsedQueryUrl, parseQueryUrl} from '../../../util/parseQueryUrl'
import {useOnValueChange} from '../../hooks/useOnValueChange'
import {useQueryRequestBuilder} from '../../hooks/useQueryRequestBuilder'
import {
  type RequestEnvironment,
  resolveRequestOptions,
  useRequestEnvironment,
} from '../../hooks/useResolvedRequest'
import {useSaveCurrentQuery} from '../../hooks/useSaveCurrentQuery'
import {type VisionDrawer, type VisionTab} from '../../store/types'
import {useSavedQueriesApi, useVisionActor, useVisionSelector} from '../../store/VisionActorContext'
import {selectActiveTab, selectDatasets} from '../../store/visionMachine'
import {cx} from '../../util/cx'
import {findSharedQuery, savedQueryToTabInit, tabMatchesParsedQuery} from '../../util/savedQueryTab'
import * as styles from '../redesign.module.css'
import * as themeStyles from '../themeTokens.module.css'
import {VisionTooltip} from '../VisionTooltip'
import * as sidebarStyles from './sidebar.module.css'

interface QueryListPanelProps {
  mode: VisionDrawer
}

/** A saved query with its URL parsed once, so rendering and matching do not parse it again */
interface QueryListItem {
  query: QueryConfig
  parsed: ParsedQueryUrl | null
  /** First line of the GROQ, up to the projection */
  preview: string
}

// A saved URL is the request its tab sent, so tabs are matched through the request they would
// send now (the navbar's perspective for `global`, the variants API version while a variant is selected)
function findMatchingTab(
  tabs: VisionTab[],
  parsed: ParsedQueryUrl,
  environment: RequestEnvironment,
): VisionTab | undefined {
  return tabs.find((tab) =>
    tabMatchesParsedQuery(tab, parsed, resolveRequestOptions(tab.options, environment)),
  )
}

/** Whether a query is one the current user shared, so a tab can be shared as it */
function isOwnSharedQuery(query: QueryConfig): boolean {
  return Boolean(query.shared && query.isOwnedByCurrentUser)
}

/**
 * The drawer listing the personal saved queries, or the shared tabs: the tabs stored as shared
 * queries, which everyone using the dataset can open. A tab opened or loaded from a shared tab
 * the user shared is linked to it (`VisionTab.sharedId`), as is the tab they shared it from.
 */
export function QueryListPanel({mode}: QueryListPanelProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVisionActor()
  const telemetry = useVisionTelemetry()
  const activeTab = useVisionSelector(selectActiveTab)
  const tabs = useVisionSelector((snapshot) => snapshot.context.tabs)
  const datasets = useVisionSelector(selectDatasets)
  const environment = useRequestEnvironment()
  const requestBuilder = useQueryRequestBuilder(activeTab)
  const {queries, updateQuery, deleteQuery, deleteQueryError, unshareQuery} = useSavedQueriesApi()
  const {saveCurrent, canSave} = useSaveCurrentQuery(activeTab, requestBuilder)
  const formatDate = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})

  const [search, setSearch] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const isShared = mode === 'shared'

  const items = useMemo((): QueryListItem[] => {
    return queries
      .filter((query) => (isShared ? query.shared : !query.shared))
      .map((query) => {
        const parsed = parseQueryUrl(query.url, datasets)
        const preview = (parsed?.query || '').split('\n')[0].split('{')[0].trim()
        return {query, parsed, preview}
      })
  }, [datasets, isShared, queries])

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      ({query, parsed}) =>
        (query.title || '').toLowerCase().includes(term) ||
        (parsed?.query || '').toLowerCase().includes(term),
    )
  }, [items, search])

  // The tab shared as a shared tab shows it even after it changed; any other query is shown by
  // a tab that would send the same request
  const findTabShowing = useCallback(
    ({query, parsed}: QueryListItem) =>
      (isOwnSharedQuery(query) ? tabs.find((tab) => tab.sharedId === query._key) : undefined) ??
      (parsed === null ? undefined : findMatchingTab(tabs, parsed, environment)),
    [environment, tabs],
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

  // What the tab a saved query was loaded into cannot reproduce is worth saying: a dataset the
  // tool does not know (another project's URL, or a dataset the user cannot see) leaves the tab
  // on its own dataset, and a variant the navbar does not have selected is not sent, since a tab
  // cannot pin one (its option follows the navbar or sends none); where the workspace has
  // variants switched off there is no navbar selector to select it with
  const warnAboutUnrepresentable = useCallback(
    (parsed: ParsedQueryUrl) => {
      if (!parsed.isKnownDataset) {
        toast.push({
          closable: true,
          id: 'vision-saved-query-dataset',
          status: 'warning',
          title: t('vision.saved.unknown-dataset', {dataset: parsed.dataset}),
        })
      }
      const {tabs: currentTabs, activeTabId} = actorRef.getSnapshot().context
      const target = currentTabs.find((tab) => tab.id === activeTabId)
      const sent = target && resolveRequestOptions(target.options, environment).variant
      if (parsed.variant !== undefined && parsed.variant !== sent) {
        toast.push({
          closable: true,
          id: 'vision-saved-query-variant',
          status: 'warning',
          title: t(
            environment.isVariantsEnabled
              ? 'vision.saved.unavailable-variant'
              : 'vision.saved.variants-disabled',
            {variant: parsed.variant},
          ),
        })
      }
    },
    [actorRef, environment, t, toast],
  )

  const openInNewTab = useCallback(
    (item: QueryListItem) => {
      const {query, parsed} = item
      if (!parsed) return
      if (isShared) {
        telemetry.sharedTab('open')
      } else {
        telemetry.savedQuery('open-in-new-tab', false)
      }
      const own = isOwnSharedQuery(query)
      const existing = findTabShowing(item)
      if (existing) {
        actorRef.send({type: 'tab.select', id: existing.id})
        // A tab showing a query the user shared, and shared as nothing else, is that shared tab
        if (own && !findSharedQuery(existing, queries)) {
          actorRef.send({type: 'tab.setSharedId', id: existing.id, sharedId: query._key})
        }
      } else {
        actorRef.send({
          type: 'tab.add',
          tab: {...savedQueryToTabInit(query, parsed), sharedId: own ? query._key : undefined},
        })
        warnAboutUnrepresentable(parsed)
      }
    },
    [actorRef, findTabShowing, isShared, queries, telemetry, warnAboutUnrepresentable],
  )

  // Loading a saved query edits the tab, which stays shared as whatever it was shared as; loading
  // a shared tab makes the tab that shared tab
  const loadIntoCurrentTab = useCallback(
    ({query, parsed}: QueryListItem) => {
      if (!parsed) return
      const tab = savedQueryToTabInit(query, parsed)
      if (isShared) {
        telemetry.sharedTab('load')
        tab.sharedId = isOwnSharedQuery(query) ? query._key : undefined
      } else {
        telemetry.savedQuery('load', false)
      }
      actorRef.send({type: 'tab.load', id: activeTab.id, tab})
      warnAboutUnrepresentable(parsed)
    },
    [actorRef, activeTab.id, isShared, telemetry, warnAboutUnrepresentable],
  )

  // Enter and Escape unmount the rename field while it has focus; a blur delivered on the way
  // out must not commit a draft that was just committed or discarded (same shape as the tab
  // rename field)
  const renameSettledRef = useRef(false)
  const startRename = useCallback((query: QueryConfig) => {
    renameSettledRef.current = false
    setEditingKey(query._key)
    setEditingTitle(query.title || '')
  }, [])

  const cancelRename = useCallback(() => {
    if (renameSettledRef.current) return
    renameSettledRef.current = true
    setEditingKey(null)
  }, [])

  const commitRename = useCallback(
    async (query: QueryConfig) => {
      if (renameSettledRef.current) return
      renameSettledRef.current = true
      setEditingKey(null)
      const title = editingTitle.trim()
      if (!title || title === query.title) return
      try {
        await updateQuery({...query, title})
      } catch (err) {
        reportError(err)
        return
      }
      if (!query.shared) {
        telemetry.savedQuery('rename', false)
        return
      }
      telemetry.sharedTab('rename')
      // The tab shared as it takes the new title too, so it is not shown as changed by it
      for (const tab of actorRef.getSnapshot().context.tabs) {
        if (tab.sharedId === query._key) actorRef.send({type: 'tab.rename', id: tab.id, title})
      }
    },
    [actorRef, editingTitle, reportError, telemetry, updateQuery],
  )

  // Unsharing deletes the shared query; the tab shared as it stays open, unlinked, and a query
  // no tab shows is opened in one, so that unsharing never loses it
  const handleUnshare = useCallback(
    async ({query, parsed}: QueryListItem) => {
      try {
        await unshareQuery(query._key)
      } catch (err) {
        toast.push({
          closable: true,
          status: 'error',
          title: t('vision.tabs.unshare-failed'),
          description: err instanceof Error ? err.message : String(err),
        })
        return
      }
      const {tabs: currentTabs} = actorRef.getSnapshot().context
      const linked = currentTabs.filter((tab) => tab.sharedId === query._key)
      for (const tab of linked) {
        actorRef.send({type: 'tab.setSharedId', id: tab.id, sharedId: undefined})
      }
      if (linked.length === 0 && parsed && !findMatchingTab(currentTabs, parsed, environment)) {
        actorRef.send({type: 'tab.add', tab: savedQueryToTabInit(query, parsed)})
        warnAboutUnrepresentable(parsed)
      }
      telemetry.sharedTab('unshare')
      toast.push({closable: true, status: 'success', title: t('vision.tabs.unshare-success')})
    },
    [actorRef, environment, t, telemetry, toast, unshareQuery, warnAboutUnrepresentable],
  )

  const emptyText = search.trim()
    ? t('vision.saved.empty-search')
    : isShared
      ? t('vision.shared.empty')
      : t('vision.saved.empty')

  return (
    <Flex flexBasis="0%" flexDirection="column" flexGrow={1} minHeight="0">
      <Flex alignItems="center" borderBottom flexShrink={0} gap={2} padding={2}>
        <Box flexBasis="0%" flexGrow={1}>
          <TextInput
            fontSize={1}
            icon={SearchIcon}
            onChange={(event) => {
              const next = event.currentTarget.value
              if (!search && next) {
                if (isShared) {
                  telemetry.sharedTabsSearched()
                } else {
                  telemetry.savedQueriesFiltered('search')
                }
              }
              setSearch(next)
            }}
            padding={2}
            placeholder={t('label.search-queries')}
            value={search}
          />
        </Box>
        {!isShared && (
          <VisionTooltip content={t('vision.saved.save-current')}>
            <Button
              aria-label={t('vision.saved.save-current')}
              className={sidebarStyles.pressable}
              data-testid="vision-save-current-query"
              disabled={!canSave}
              icon={AddIcon}
              mode="ghost"
              onClick={() => void saveCurrent()}
              padding={2}
            />
          </VisionTooltip>
        )}
      </Flex>

      <Box className={styles.scrollArea} flexBasis="0%" flexGrow={1}>
        {visibleItems.length === 0 ? (
          <Box padding={4}>
            <Text muted size={1} as="div" trim={true}>
              {emptyText}
            </Text>
          </Box>
        ) : (
          <Flex flexDirection="column" minWidth="0">
            {visibleItems.map((item) => {
              const {query, parsed, preview} = item
              const canMutate = !query.shared || query.isOwnedByCurrentUser
              const isEditing = editingKey === query._key
              const isOpen = findTabShowing(item) !== undefined

              return (
                <Card
                  borderBottom
                  className={sidebarStyles.queryRow}
                  data-testid="vision-saved-query"
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
                              if (event.key === 'Escape') cancelRename()
                            }}
                            padding={1}
                            value={editingTitle}
                          />
                        </Box>
                      ) : (
                        <Button
                          className={cx(styles.listItemButton, sidebarStyles.pressable)}
                          data-testid="vision-saved-query-open"
                          justify="flex-start"
                          mode="bleed"
                          onClick={() => openInNewTab(item)}
                          padding={2}
                          selected={isOpen}
                          width="fill"
                        >
                          <Flex flexDirection="column" gap={2} minWidth="0">
                            <Text size={1} truncate={1} weight="medium" as="div" trim={true}>
                              {query.title || t('label.untitled-query')}
                            </Text>
                            {preview && (
                              <Box className={styles.previewCode}>
                                <Code size={0} trim>
                                  {preview}
                                </Code>
                              </Box>
                            )}
                            <Flex alignItems="center" gap={2}>
                              {query.shared && query.authorId && (
                                <UserAvatar size={0} user={query.authorId} withTooltip />
                              )}
                              <Text muted size={0} as="div" trim={true}>
                                {query.savedAt ? formatDate.format(new Date(query.savedAt)) : ''}
                              </Text>
                            </Flex>
                          </Flex>
                        </Button>
                      )}
                    </Box>
                    <Box className={sidebarStyles.queryRowMenu} paddingTop={1}>
                      <MenuButton
                        button={
                          <ContextMenuButton tooltipProps={{content: t('vision.actions.more')}} />
                        }
                        id={`vision-saved-query-menu-${query._key}`}
                        menu={
                          <Menu className={cx(styles.popoverScroll, themeStyles.themeTokens)}>
                            <MenuItem
                              icon={LaunchIcon}
                              onClick={() => openInNewTab(item)}
                              text={t('vision.saved.open-in-new-tab')}
                            />
                            <MenuItem
                              icon={RetrieveIcon}
                              onClick={() => loadIntoCurrentTab(item)}
                              text={t('vision.saved.load-in-current-tab')}
                            />
                            {canMutate && (
                              <>
                                <MenuDivider />
                                <MenuItem
                                  icon={EditIcon}
                                  onClick={() => startRename(query)}
                                  text={t('vision.saved.rename')}
                                />
                                {query.shared ? (
                                  <MenuItem
                                    data-testid="vision-shared-tab-unshare"
                                    icon={UnpublishIcon}
                                    onClick={() => void handleUnshare(item)}
                                    text={t('vision.tabs.unshare')}
                                  />
                                ) : (
                                  <MenuItem
                                    icon={TrashIcon}
                                    onClick={() => {
                                      telemetry.savedQuery('delete', false)
                                      void deleteQuery(query._key)
                                    }}
                                    text={t('action.delete')}
                                    tone="critical"
                                  />
                                )}
                              </>
                            )}
                          </Menu>
                        }
                        popover={{animate: true, portal: true, placement: 'bottom-end'}}
                      />
                    </Box>
                  </Flex>
                </Card>
              )
            })}
          </Flex>
        )}
      </Box>
    </Flex>
  )
}
