import {BoltIcon} from '@sanity/icons/Bolt'
import {BookmarkIcon} from '@sanity/icons/Bookmark'
import {CodeIcon} from '@sanity/icons/Code'
import {CogIcon} from '@sanity/icons/Cog'
import {DoubleChevronLeftIcon} from '@sanity/icons/DoubleChevronLeft'
import {DoubleChevronRightIcon} from '@sanity/icons/DoubleChevronRight'
import {EditIcon} from '@sanity/icons/Edit'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {RestoreIcon} from '@sanity/icons/Restore'
import {TransferIcon} from '@sanity/icons/Transfer'
import {UsersIcon} from '@sanity/icons/Users'
import {Badge, Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ComponentType, type MouseEvent, useCallback, useRef, useSyncExternalStore} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useOnValueChange} from '../../hooks/useOnValueChange'
import {type VisionDrawer} from '../../store/types'
import {
  type SidebarBadge,
  useSidebarBadges,
  useVisionActor,
  useVisionExperience,
  useVisionSelector,
} from '../../store/VisionActorContext'
import {selectOpenDrawer} from '../../store/visionMachine'
import {cx} from '../../util/cx'
import * as styles from '../redesign.module.css'
import {SidebarDrawer} from './SidebarDrawer'

interface SidebarItemProps {
  icon: ComponentType
  label: string
  expanded: boolean
  selected?: boolean
  /** A count, such as the active tab's lint findings */
  badge?: SidebarBadge
  testId: string
  onClick: (event: MouseEvent<HTMLElement>) => void
}

function SidebarItem({icon, label, expanded, selected, badge, testId, onClick}: SidebarItemProps) {
  const name = badge ? `${label} (${badge.count})` : label
  const count = badge && (
    <Badge
      aria-hidden
      className={cx(styles.sidebarItemBadge, expanded && styles.sidebarItemBadgeExpanded)}
      data-testid={`${testId}-badge`}
      fontSize={0}
      tone={badge.tone}
    >
      {badge.count}
    </Badge>
  )
  if (expanded) {
    return (
      <div className={styles.sidebarItem}>
        <Button
          aria-label={name}
          data-testid={testId}
          icon={icon}
          justify="flex-start"
          mode="bleed"
          onClick={onClick}
          selected={selected}
          text={label}
          width="fill"
        />
        {count}
      </div>
    )
  }

  return (
    <div className={styles.sidebarItem}>
      <Tooltip animate content={<Text size={1}>{name}</Text>} placement="right" portal>
        <Button
          aria-label={name}
          data-testid={testId}
          icon={icon}
          mode="bleed"
          onClick={onClick}
          selected={selected}
        />
      </Tooltip>
      {count}
    </div>
  )
}

export function VisionSidebar() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const {layout, switchToClassic} = useVisionExperience()
  const expanded = useVisionSelector((snapshot) => snapshot.matches({sidebar: 'expanded'}))
  const drawer = useVisionSelector(selectOpenDrawer)
  const sidebarBadges = useSidebarBadges()
  const badges = useSyncExternalStore(sidebarBadges.subscribe, sidebarBadges.get)
  const isMobile = layout === 'mobile'

  // The rail button that opened the drawer, remembered from its click: the drawer is a modal
  // dialog on phones, and focus goes back there once it has closed. Not read when the drawer's
  // focus lock activates, which happens again when a hidden `<Activity>` shows the tool with the
  // drawer still open (focus is elsewhere by then), and not restored from an effect cleanup, which
  // also runs when the tool is hidden. The lock's own `returnFocus` is no use either: it resolves
  // its target while the drawer unmounts, when the rail still carries `inert` from the same
  // commit and focus-lock sees nothing focusable there
  const openerRef = useRef<HTMLElement | null>(null)
  const toggleDrawer = useCallback(
    (target: VisionDrawer, event: MouseEvent<HTMLElement>) => {
      if (drawer === null) openerRef.current = event.currentTarget
      actorRef.send({type: 'drawer.toggle', drawer: target})
    },
    [actorRef, drawer],
  )
  useOnValueChange(drawer, (next, previous) => {
    if (previous === null || next !== null) return
    openerRef.current?.focus()
    openerRef.current = null
  })

  const rail = (
    <Flex
      aria-label={t('vision.sidebar.label')}
      as="nav"
      borderRight
      className={cx(
        styles.sidebarRail,
        expanded ? styles.sidebarRailExpanded : styles.sidebarRailCollapsed,
        isMobile && expanded && styles.sidebarRailOverlay,
      )}
      data-testid="vision-sidebar"
      flexDirection="column"
      gap={1}
      height="100%"
      // Under a phone's full-width drawer the rail is covered and must not take focus
      inert={isMobile && drawer !== null}
      justifyContent="space-between"
      padding={2}
    >
      <Flex flexDirection="column" gap={1}>
        <SidebarItem
          expanded={expanded}
          icon={UsersIcon}
          label={t('vision.sidebar.shared-queries')}
          onClick={(event) => toggleDrawer('shared', event)}
          selected={drawer === 'shared'}
          testId="vision-sidebar-shared"
        />
        <SidebarItem
          expanded={expanded}
          icon={BookmarkIcon}
          label={t('vision.sidebar.saved-queries')}
          onClick={(event) => toggleDrawer('saved', event)}
          selected={drawer === 'saved'}
          testId="vision-sidebar-saved"
        />
        <Box borderTop marginTop={1} paddingTop={1}>
          <Flex flexDirection="column" gap={1}>
            <SidebarItem
              badge={badges.lint}
              expanded={expanded}
              icon={ErrorOutlineIcon}
              label={t('vision.panel.lint')}
              onClick={(event) => toggleDrawer('lint', event)}
              selected={drawer === 'lint'}
              testId="vision-sidebar-lint"
            />
            <SidebarItem
              badge={badges.functions}
              expanded={expanded}
              icon={CodeIcon}
              label={t('vision.panel.functions')}
              onClick={(event) => toggleDrawer('functions', event)}
              selected={drawer === 'functions'}
              testId="vision-sidebar-functions"
            />
            <SidebarItem
              expanded={expanded}
              icon={TransferIcon}
              label={t('vision.panel.delta')}
              onClick={(event) => toggleDrawer('delta', event)}
              selected={drawer === 'delta'}
              testId="vision-sidebar-delta"
            />
            <SidebarItem
              expanded={expanded}
              icon={EditIcon}
              label={t('vision.panel.mutate')}
              onClick={(event) => toggleDrawer('mutate', event)}
              selected={drawer === 'mutate'}
              testId="vision-sidebar-mutate"
            />
          </Flex>
        </Box>
      </Flex>
      <Flex flexDirection="column" gap={1}>
        <SidebarItem
          expanded={expanded}
          icon={BoltIcon}
          label={t('vision.sidebar.shortcuts')}
          onClick={() => actorRef.send({type: 'dialog.open', dialog: 'shortcuts'})}
          testId="vision-sidebar-shortcuts"
        />
        <SidebarItem
          expanded={expanded}
          icon={CogIcon}
          label={t('vision.sidebar.settings')}
          onClick={(event) => toggleDrawer('settings', event)}
          selected={drawer === 'settings'}
          testId="vision-sidebar-settings"
        />
        <SidebarItem
          expanded={expanded}
          icon={RestoreIcon}
          label={t('vision.redesign.switch-to-classic')}
          onClick={switchToClassic}
          testId="vision-sidebar-classic"
        />
        <Box borderTop paddingTop={1}>
          <SidebarItem
            expanded={expanded}
            icon={expanded ? DoubleChevronLeftIcon : DoubleChevronRightIcon}
            label={expanded ? t('vision.sidebar.collapse') : t('vision.sidebar.expand')}
            onClick={() => actorRef.send({type: 'sidebar.toggle'})}
            testId="vision-sidebar-toggle"
          />
        </Box>
      </Flex>
    </Flex>
  )

  return (
    <Flex flexShrink={0} height="100%" minHeight="0">
      {isMobile ? <div className={styles.sidebarSlot}>{rail}</div> : rail}
      {drawer && <SidebarDrawer drawer={drawer} overlay={isMobile} />}
    </Flex>
  )
}
