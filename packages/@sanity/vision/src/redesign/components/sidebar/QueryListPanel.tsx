import {EditIcon} from '@sanity/icons/Edit'
import {LaunchIcon} from '@sanity/icons/Launch'
import {RetrieveIcon} from '@sanity/icons/Retrieve'
import {SearchIcon} from '@sanity/icons/Search'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Button, Card, TextInput} from '@sanity/ui'
import {MenuButton} from '@sanity/ui/menu'
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
import {
  type RequestEnvironment,
  resolveRequestOptions,
  useRequestEnvironment,
} from '../../hooks/useResolvedRequest'
import {type VisionTab} from '../../store/types'
import {useSavedQueriesApi, useVisionActor, useVisionSelector} from '../../store/VisionActorContext'
import {selectActiveTab, selectDatasets} from '../../store/visionMachine'
import {cx} from '../../util/cx'
import {
  findLinkedSharedQuery,
  findSharedQuery,
  savedQueryToTabInit,
  tabMatchesParsedQuery,
} from '../../util/savedQueryTab'
import * as styles from '../redesign.module.css'
import {VISION_MENU_POPOVER, VisionMenu, VisionMenuDivider, VisionMenuItem} from '../VisionMenu'
import * as sidebarStyles from './sidebar.module.css'

/** A shared query with its URL parsed once, so rendering and matching do not parse it again */
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
 * The Shared tabs drawer, listing the tabs stored as shared queries, which everyone using the
 * dataset can open. A tab opened or loaded from a shared tab is linked to it
 * (`VisionTab.sharedId`), as is the tab the author shared it from.
 */
export function QueryListPanel() {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVisionActor()
  const telemetry = useVisionTelemetry()
  const activeTab = useVisionSelector(selectActiveTab)
  const tabs = useVisionSelector((snapshot) => snapshot.context.tabs)
  const datasets = useVisionSelector(selectDatasets)
  const environment = useRequestEnvironment()
  const {queries, updateSharedQuery, unshareQuery} = useSavedQueriesApi()
  const formatDate = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})

  const [search, setSearch] = useState('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const items = useMemo((): QueryListItem[] => {
    return queries
      .filter((query) => query.shared)
      .map((query) => {
        const parsed = parseQueryUrl(query.url, datasets)
        const preview = (parsed?.query || '').split('\n')[0].split('{')[0].trim()
        return {query, parsed, preview}
      })
  }, [datasets, queries])

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

  // What the tab a shared tab was loaded into cannot reproduce is worth saying: a dataset the
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
      telemetry.sharedTab('open')
      const own = isOwnSharedQuery(query)
      const existing = findTabShowing(item)
      if (existing) {
        actorRef.send({type: 'tab.select', id: existing.id})
        // A tab showing a query the user shared, and shared as nothing else, is that shared tab;
        // one showing someone else's is linked to it unless it is linked to another one
        if (own ? !findSharedQuery(existing, queries) : !findLinkedSharedQuery(existing, queries)) {
          actorRef.send({type: 'tab.setSharedId', id: existing.id, sharedId: query._key})
        }
      } else {
        actorRef.send({
          type: 'tab.add',
          tab: {...savedQueryToTabInit(query, parsed), sharedId: query._key},
        })
        warnAboutUnrepresentable(parsed)
      }
    },
    [actorRef, findTabShowing, queries, telemetry, warnAboutUnrepresentable],
  )

  // Loading a shared tab links the tab to it, and makes it that shared tab when the user shared it
  const loadIntoCurrentTab = useCallback(
    ({query, parsed}: QueryListItem) => {
      if (!parsed) return
      telemetry.sharedTab('load')
      actorRef.send({
        type: 'tab.load',
        id: activeTab.id,
        tab: {...savedQueryToTabInit(query, parsed), sharedId: query._key},
      })
      warnAboutUnrepresentable(parsed)
    },
    [actorRef, activeTab.id, telemetry, warnAboutUnrepresentable],
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
        await updateSharedQuery({...query, title})
      } catch (err) {
        reportError(err)
        return
      }
      telemetry.sharedTab('rename')
      // The tab shared as it takes the new title too, open or closed, so it is not shown as
      // changed by it
      actorRef.send({type: 'sharedQuery.renamed', sharedId: query._key, title})
    },
    [actorRef, editingTitle, reportError, telemetry, updateSharedQuery],
  )

  // Unsharing deletes the shared query; the tab shared as it stays where it is, open or in
  // Restore tabs, unlinked, and a query no open or closed tab shows is opened in one, so that
  // unsharing never loses it
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
      const {tabs: openTabs, closedTabs} = actorRef.getSnapshot().context
      const keptTabs = [...openTabs, ...closedTabs.map(({tab}) => tab)]
      const isKept =
        keptTabs.some((tab) => tab.sharedId === query._key) ||
        (parsed !== null && findMatchingTab(keptTabs, parsed, environment) !== undefined)
      actorRef.send({type: 'sharedQuery.unshared', sharedId: query._key})
      if (!isKept && parsed) {
        actorRef.send({type: 'tab.add', tab: savedQueryToTabInit(query, parsed)})
        warnAboutUnrepresentable(parsed)
      }
      telemetry.sharedTab('unshare')
      toast.push({closable: true, status: 'success', title: t('vision.tabs.unshare-success')})
    },
    [actorRef, environment, t, telemetry, toast, unshareQuery, warnAboutUnrepresentable],
  )

  return (
    <Flex flexBasis="0%" flexDirection="column" flexGrow={1} minHeight="0">
      <Flex alignItems="center" borderBottom flexShrink={0} gap={2} padding={2}>
        <Box flexBasis="0%" flexGrow={1}>
          <TextInput
            fontSize={1}
            icon={SearchIcon}
            onChange={(event) => {
              const next = event.currentTarget.value
              if (!search && next) telemetry.sharedTabsSearched()
              setSearch(next)
            }}
            padding={2}
            placeholder={t('label.search-queries')}
            value={search}
          />
        </Box>
      </Flex>

      <Box className={styles.scrollArea} flexBasis="0%" flexGrow={1}>
        {visibleItems.length === 0 ? (
          <Box padding={4}>
            <Text muted size={1} as="div" trim={true}>
              {search.trim() ? t('vision.saved.empty-search') : t('vision.shared.empty')}
            </Text>
          </Box>
        ) : (
          <Flex flexDirection="column" minWidth="0">
            {visibleItems.map((item) => {
              const {query, preview} = item
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
                          <VisionMenu>
                            <VisionMenuItem
                              icon={LaunchIcon}
                              onClick={() => openInNewTab(item)}
                              text={t('vision.saved.open-in-new-tab')}
                            />
                            <VisionMenuItem
                              icon={RetrieveIcon}
                              onClick={() => loadIntoCurrentTab(item)}
                              text={t('vision.saved.load-in-current-tab')}
                            />
                            {query.isOwnedByCurrentUser && (
                              <>
                                <VisionMenuDivider />
                                <VisionMenuItem
                                  icon={EditIcon}
                                  onClick={() => startRename(query)}
                                  text={t('vision.saved.rename')}
                                />
                                <VisionMenuItem
                                  data-testid="vision-shared-tab-unshare"
                                  icon={UnpublishIcon}
                                  onClick={() => void handleUnshare(item)}
                                  text={t('vision.tabs.unshare')}
                                />
                              </>
                            )}
                          </VisionMenu>
                        }
                        popover={{...VISION_MENU_POPOVER, placement: 'bottom-end'}}
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
