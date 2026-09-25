import {BoltIcon} from '@sanity/icons/Bolt'
import {BookmarkIcon} from '@sanity/icons/Bookmark'
import {CogIcon} from '@sanity/icons/Cog'
import {DoubleChevronLeftIcon} from '@sanity/icons/DoubleChevronLeft'
import {DoubleChevronRightIcon} from '@sanity/icons/DoubleChevronRight'
import {RestoreIcon} from '@sanity/icons/Restore'
import {UsersIcon} from '@sanity/icons/Users'
import {Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ComponentType, useCallback} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VistaDrawer} from '../../store/types'
import {useVistaActor, useVistaExperience, useVistaSelector} from '../../store/VistaActorContext'
import {selectOpenDrawer} from '../../store/vistaMachine'
import {cx} from '../../util/cx'
import {
  sidebarRail,
  sidebarRailCollapsed,
  sidebarRailExpanded,
  sidebarRailOverlay,
  sidebarSlot,
} from '../vista.css'
import {SidebarDrawer} from './SidebarDrawer'

interface SidebarItemProps {
  icon: ComponentType
  label: string
  expanded: boolean
  selected?: boolean
  testId: string
  onClick: () => void
}

function SidebarItem({icon, label, expanded, selected, testId, onClick}: SidebarItemProps) {
  if (expanded) {
    return (
      <Button
        aria-label={label}
        data-testid={testId}
        icon={icon}
        justify="flex-start"
        mode="bleed"
        onClick={onClick}
        selected={selected}
        text={label}
        width="fill"
      />
    )
  }

  return (
    <Tooltip content={<Text size={1}>{label}</Text>} placement="right" portal>
      <Button
        aria-label={label}
        data-testid={testId}
        icon={icon}
        mode="bleed"
        onClick={onClick}
        selected={selected}
      />
    </Tooltip>
  )
}

export function VistaSidebar() {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
  const {layout, switchToClassic} = useVistaExperience()
  const expanded = useVistaSelector((snapshot) => snapshot.matches({sidebar: 'expanded'}))
  const drawer = useVistaSelector(selectOpenDrawer)
  const isMobile = layout === 'mobile'

  const toggleDrawer = useCallback(
    (target: VistaDrawer) => actorRef.send({type: 'drawer.toggle', drawer: target}),
    [actorRef],
  )

  const rail = (
    <Flex
      aria-label={t('vista.sidebar.label')}
      as="nav"
      borderRight
      className={cx(
        sidebarRail,
        expanded ? sidebarRailExpanded : sidebarRailCollapsed,
        isMobile && expanded && sidebarRailOverlay,
      )}
      data-testid="vista-sidebar"
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
          label={t('vista.sidebar.shared-queries')}
          onClick={() => toggleDrawer('shared')}
          selected={drawer === 'shared'}
          testId="vista-sidebar-shared"
        />
        <SidebarItem
          expanded={expanded}
          icon={BookmarkIcon}
          label={t('vista.sidebar.saved-queries')}
          onClick={() => toggleDrawer('saved')}
          selected={drawer === 'saved'}
          testId="vista-sidebar-saved"
        />
      </Flex>
      <Flex flexDirection="column" gap={1}>
        <SidebarItem
          expanded={expanded}
          icon={BoltIcon}
          label={t('vista.sidebar.shortcuts')}
          onClick={() => actorRef.send({type: 'dialog.open', dialog: 'shortcuts'})}
          testId="vista-sidebar-shortcuts"
        />
        <SidebarItem
          expanded={expanded}
          icon={CogIcon}
          label={t('vista.sidebar.settings')}
          onClick={() => actorRef.send({type: 'dialog.open', dialog: 'settings'})}
          testId="vista-sidebar-settings"
        />
        <SidebarItem
          expanded={expanded}
          icon={RestoreIcon}
          label={t('vista.redesign.switch-to-classic')}
          onClick={switchToClassic}
          testId="vista-sidebar-classic"
        />
        <Box borderTop paddingTop={1}>
          <SidebarItem
            expanded={expanded}
            icon={expanded ? DoubleChevronLeftIcon : DoubleChevronRightIcon}
            label={expanded ? t('vista.sidebar.collapse') : t('vista.sidebar.expand')}
            onClick={() => actorRef.send({type: 'sidebar.toggle'})}
            testId="vista-sidebar-toggle"
          />
        </Box>
      </Flex>
    </Flex>
  )

  return (
    <Flex flexShrink={0} height="100%" minHeight="0">
      {isMobile ? <div className={sidebarSlot}>{rail}</div> : rail}
      {drawer && <SidebarDrawer drawer={drawer} overlay={isMobile} />}
    </Flex>
  )
}
