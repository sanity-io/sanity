import {RestoreIcon} from '@sanity/icons/Restore'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {Button, Card, TextInput} from '@sanity/ui'
import {MenuButton} from '@sanity/ui/menu'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useDateTimeFormat} from 'sanity'
import {ContextMenuButton} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useTranslation} from 'sanity/i18n'
import {Box, Code, Flex, Text} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {visionLocaleNamespace} from '../../../i18n'
import {type VisionClosedTab} from '../../store/types'
import {useVisionActor, useVisionSelector} from '../../store/VisionActorContext'
import {selectClosedTabs} from '../../store/visionMachine'
import {cx} from '../../util/cx'
import {deriveTabTitle} from '../../util/tabTitle'
import * as styles from '../redesign.module.css'
import {VISION_MENU_POPOVER, VisionMenu, VisionMenuDivider, VisionMenuItem} from '../VisionMenu'
import * as sidebarStyles from './sidebar.module.css'

interface ClosedTabItem {
  closed: VisionClosedTab
  /** The title the tab showed in the tab bar */
  title: string
  /** First line of the GROQ, up to the projection */
  preview: string
}

/**
 * The Restore tabs drawer, listing the tabs closed in this browser in the last 30 days, most
 * recently closed first. Restoring one reopens it as it was; deleting one removes it for good.
 */
export function ClosedTabsPanel() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const telemetry = useVisionTelemetry()
  const closedTabs = useVisionSelector(selectClosedTabs)
  const formatDate = useDateTimeFormat({dateStyle: 'medium', timeStyle: 'short'})
  const [search, setSearch] = useState('')

  // Loading the tool and closing a tab purge too, but the tool can stay open for days
  useEffect(() => {
    actorRef.send({type: 'closedTabs.purge'})
  }, [actorRef])

  const untitled = t('vision.tabs.untitled')
  const items = useMemo(
    (): ClosedTabItem[] =>
      closedTabs.map((closed) => ({
        closed,
        title: closed.tab.title || deriveTabTitle(closed.tab.query) || untitled,
        preview: closed.tab.query.trim().split('\n')[0].split('{')[0].trim(),
      })),
    [closedTabs, untitled],
  )

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter(
      ({closed, title}) =>
        title.toLowerCase().includes(term) || closed.tab.query.toLowerCase().includes(term),
    )
  }, [items, search])

  const restore = useCallback(
    (id: string) => {
      telemetry.closedTab('restore')
      actorRef.send({type: 'closedTab.restore', id})
    },
    [actorRef, telemetry],
  )

  const deletePermanently = useCallback(
    (id: string) => {
      telemetry.closedTab('delete')
      actorRef.send({type: 'closedTab.delete', id})
    },
    [actorRef, telemetry],
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
              if (!search && next) telemetry.closedTabsSearched()
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
              {search.trim() ? t('vision.saved.empty-search') : t('vision.closed-tabs.empty')}
            </Text>
          </Box>
        ) : (
          <Flex flexDirection="column" minWidth="0">
            {visibleItems.map(({closed, title, preview}) => (
              <Card
                borderBottom
                className={sidebarStyles.queryRow}
                data-testid="vision-closed-tab"
                key={closed.tab.id}
                padding={1}
              >
                <Flex alignItems="flex-start" gap={1}>
                  <Box flexBasis="0%" flexGrow={1} minWidth="0">
                    <Button
                      className={cx(styles.listItemButton, sidebarStyles.pressable)}
                      data-testid="vision-closed-tab-restore"
                      justify="flex-start"
                      mode="bleed"
                      onClick={() => restore(closed.tab.id)}
                      padding={2}
                      width="fill"
                    >
                      <Flex flexDirection="column" gap={2} minWidth="0">
                        <Text size={1} truncate={1} weight="medium" as="div" trim={true}>
                          {title}
                        </Text>
                        {preview && (
                          <Box className={styles.previewCode}>
                            <Code size={0} trim>
                              {preview}
                            </Code>
                          </Box>
                        )}
                        <Text muted size={0} as="div" trim={true}>
                          {t('vision.closed-tabs.closed-at', {
                            date: formatDate.format(new Date(closed.closedAt)),
                          })}
                        </Text>
                      </Flex>
                    </Button>
                  </Box>
                  <Box className={sidebarStyles.queryRowMenu} paddingTop={1}>
                    <MenuButton
                      button={
                        <ContextMenuButton tooltipProps={{content: t('vision.actions.more')}} />
                      }
                      id={`vision-closed-tab-menu-${closed.tab.id}`}
                      menu={
                        <VisionMenu>
                          <VisionMenuItem
                            icon={RestoreIcon}
                            onClick={() => restore(closed.tab.id)}
                            text={t('vision.closed-tabs.restore')}
                          />
                          <VisionMenuDivider />
                          <VisionMenuItem
                            data-testid="vision-closed-tab-delete"
                            icon={TrashIcon}
                            onClick={() => deletePermanently(closed.tab.id)}
                            text={t('vision.closed-tabs.delete')}
                            tone="critical"
                          />
                        </VisionMenu>
                      }
                      popover={{...VISION_MENU_POPOVER, placement: 'bottom-end'}}
                    />
                  </Box>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Box>
    </Flex>
  )
}
