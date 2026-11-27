import {BoltIcon} from '@sanity/icons/Bolt'
import {CogIcon} from '@sanity/icons/Cog'
import {DoubleChevronLeftIcon} from '@sanity/icons/DoubleChevronLeft'
import {DoubleChevronRightIcon} from '@sanity/icons/DoubleChevronRight'
import {EditIcon} from '@sanity/icons/Edit'
import {RestoreIcon} from '@sanity/icons/Restore'
import {TransferIcon} from '@sanity/icons/Transfer'
import {UsersIcon} from '@sanity/icons/Users'
import {Button} from '@sanity/ui'
import {TooltipDelayGroupProvider, useTooltipDelayGroup} from '@sanity/ui/tooltip'
import {
  type ComponentType,
  type MouseEvent,
  useCallback,
  useRef,
  useState,
  ViewTransition,
} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Box, Flex} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {visionLocaleNamespace} from '../../../i18n'
import {useOnValueChange} from '../../hooks/useOnValueChange'
import {type VisionDrawer} from '../../store/types'
import {
  useVisionActor,
  useVisionExperience,
  useVisionSelector,
} from '../../store/VisionActorContext'
import {selectOpenDrawer} from '../../store/visionMachine'
import {cx} from '../../util/cx'
import {SIDEBAR_PANE} from '../panelTransitions'
import * as styles from '../redesign.module.css'
import {VisionTooltip} from '../VisionTooltip'
import * as sidebarStyles from './sidebar.module.css'
import {SidebarDrawer} from './SidebarDrawer'
import {useShownInSidebar} from './useShownInSidebar'

/**
 * The collapsed rail's tooltips wait before the first one opens, so a pointer crossing the rail
 * on its way elsewhere opens nothing; once one is open, its neighbours open at once
 */
const RAIL_TOOLTIP_DELAY = {open: 400}

interface SidebarItemProps {
  icon: ComponentType
  label: string
  expanded: boolean
  selected?: boolean
  testId: string
  /** Sized like the buttons of the bottom action bars, which it lines up with */
  compact?: boolean
  onClick: (event: MouseEvent<HTMLElement>) => void
}

function SidebarItem({
  icon,
  label,
  expanded,
  selected,
  testId,
  compact,
  onClick,
}: SidebarItemProps) {
  const size = compact ? ({fontSize: 1, padding: 2} as const) : undefined
  const delayGroup = useTooltipDelayGroup()
  // Only the tooltip that opens after the wait animates in. Moving along the rail swaps the
  // content right away instead, which an animation on every one would only slow down. Decided
  // when the pointer or focus arrives, before the tooltip opens: the group turns instant in the
  // same update that opens its first tooltip, which must not change its mind halfway through
  const [animateTooltip, setAnimateTooltip] = useState(true)
  const decideTooltipAnimation = useCallback(() => {
    setAnimateTooltip(!delayGroup || delayGroup.openDelay >= RAIL_TOOLTIP_DELAY.open)
  }, [delayGroup])

  if (expanded) {
    return (
      <div className={cx(styles.sidebarItem, sidebarStyles.railItemExpanded)}>
        <Button
          aria-label={label}
          className={sidebarStyles.pressable}
          data-testid={testId}
          {...size}
          icon={icon}
          justify="flex-start"
          mode="bleed"
          onClick={onClick}
          selected={selected}
          text={label}
          width="fill"
        />
      </div>
    )
  }

  return (
    <div
      className={styles.sidebarItem}
      onFocusCapture={decideTooltipAnimation}
      onMouseEnter={decideTooltipAnimation}
    >
      <VisionTooltip animate={animateTooltip} content={label} placement="right">
        <Button
          aria-label={label}
          className={sidebarStyles.pressable}
          data-testid={testId}
          {...size}
          icon={icon}
          mode="bleed"
          onClick={onClick}
          selected={selected}
          width={compact ? 'fill' : undefined}
        />
      </VisionTooltip>
    </div>
  )
}

export interface VisionSidebarProps {
  /**
   * The drawer as it shows, which follows the machine's a transition later beside the tabs area
   * (see `useShownInSidebar`). The tab that renders a tool into the drawer follows it too.
   */
  shownDrawer: VisionDrawer | null
}

export function VisionSidebar({shownDrawer}: VisionSidebarProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const telemetry = useVisionTelemetry()
  const {layout} = useVisionExperience()
  const railExpanded = useVisionSelector((snapshot) => snapshot.matches({sidebar: 'expanded'}))
  const drawer = useVisionSelector(selectOpenDrawer)
  const isMobile = layout === 'mobile'
  const expanded = useShownInSidebar(railExpanded, isMobile)

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
      if (drawer !== target) telemetry.drawerOpened(target)
      actorRef.send({type: 'drawer.toggle', drawer: target})
    },
    [actorRef, drawer, telemetry],
  )
  useOnValueChange(shownDrawer, (next, previous) => {
    if (previous === null || next !== null) return
    openerRef.current?.focus()
    openerRef.current = null
  })

  const rail = (
    <ViewTransition default={SIDEBAR_PANE}>
      <Flex
        aria-label={t('vision.sidebar.label')}
        as="nav"
        borderRight
        className={cx(
          styles.sidebarRail,
          sidebarStyles.rail,
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
      >
        <Flex flexDirection="column" gap={1} padding={2}>
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
            icon={RestoreIcon}
            label={t('vision.sidebar.closed-tabs')}
            onClick={(event) => toggleDrawer('closed-tabs', event)}
            selected={drawer === 'closed-tabs'}
            testId="vision-sidebar-closed-tabs"
          />
          <Box borderTop marginTop={1} paddingTop={1}>
            <Flex flexDirection="column" gap={1}>
              <SidebarItem
                expanded={expanded}
                icon={EditIcon}
                label={t('vision.panel.mutate')}
                onClick={(event) => toggleDrawer('mutate', event)}
                selected={drawer === 'mutate'}
                testId="vision-sidebar-mutate"
              />
              <SidebarItem
                expanded={expanded}
                icon={TransferIcon}
                label={t('vision.panel.delta')}
                onClick={(event) => toggleDrawer('delta', event)}
                selected={drawer === 'delta'}
                testId="vision-sidebar-delta"
              />
            </Flex>
          </Box>
        </Flex>
        <Flex flexDirection="column">
          <Flex flexDirection="column" gap={1} paddingBottom={1} paddingTop={2} paddingX={2}>
            <SidebarItem
              expanded={expanded}
              icon={BoltIcon}
              label={t('vision.sidebar.shortcuts')}
              onClick={() => {
                telemetry.dialogOpened('shortcuts')
                actorRef.send({type: 'dialog.open', dialog: 'shortcuts'})
              }}
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
          </Flex>
          {/* A bottom bar, so its top rule continues the action bar's and the tab header's */}
          <Flex
            className={styles.bottomBar}
            flexDirection="column"
            justifyContent="center"
            paddingX={2}
          >
            <SidebarItem
              compact
              expanded={expanded}
              icon={expanded ? DoubleChevronLeftIcon : DoubleChevronRightIcon}
              label={expanded ? t('vision.sidebar.collapse') : t('vision.sidebar.expand')}
              onClick={() => {
                telemetry.panelToggled('sidebar', !railExpanded)
                actorRef.send({type: 'sidebar.toggle'})
              }}
              testId="vision-sidebar-toggle"
            />
          </Flex>
        </Flex>
      </Flex>
    </ViewTransition>
  )

  return (
    <Flex className={sidebarStyles.sidebar} flexShrink={0} height="100%" minHeight="0">
      <TooltipDelayGroupProvider delay={RAIL_TOOLTIP_DELAY}>
        {isMobile ? <div className={styles.sidebarSlot}>{rail}</div> : rail}
      </TooltipDelayGroupProvider>
      {shownDrawer && <SidebarDrawer drawer={shownDrawer} overlay={isMobile} />}
    </Flex>
  )
}
