import {CloseIcon} from '@sanity/icons/Close'
import {Button} from '@sanity/ui'
import {type KeyboardEvent, type ReactNode, useCallback, ViewTransition} from 'react'
import TrapFocus from 'react-focus-lock'
import {type TFunction} from 'sanity'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VisionDrawer} from '../../store/types'
import {useTabDrawerSlot, useVisionActor} from '../../store/VisionActorContext'
import {cx} from '../../util/cx'
import {DRAWER_ENTER, DRAWER_EXIT, SIDEBAR_PANE} from '../panelTransitions'
import * as styles from '../redesign.module.css'
import {ClosedTabsPanel} from './ClosedTabsPanel'
import {QueryListPanel} from './QueryListPanel'
import {SettingsPanel} from './SettingsPanel'
import * as sidebarStyles from './sidebar.module.css'

/** The lock's own element takes no part in the layout; the drawer is positioned by its class */
const TRAP_FOCUS_PROPS = {style: {display: 'contents'}}

function drawerTitle(drawer: VisionDrawer, t: TFunction<'vision'>): string {
  switch (drawer) {
    case 'closed-tabs':
      return t('vision.sidebar.closed-tabs')
    case 'shared':
      return t('vision.sidebar.shared-queries')
    case 'delta':
      return t('vision.panel.delta')
    case 'mutate':
      return t('vision.panel.mutate')
    case 'settings':
      return t('vision.settings.title')
    default: {
      const unknownDrawer: never = drawer
      return String(unknownDrawer)
    }
  }
}

/**
 * Shows the element the active tab renders its tool into (see `TabDrawerSlot`). It is attached
 * in the commit that mounts the drawer, so a view transition already pictures the tool in it
 */
function TabDrawerSlotElement({drawer}: {drawer: VisionDrawer}) {
  const {element} = useTabDrawerSlot()
  const attach = useCallback(
    (container: HTMLDivElement | null) => {
      if (!container) return undefined
      container.append(element)
      return () => element.remove()
    },
    [element],
  )
  return (
    <Box
      className={styles.nestedScroll}
      data-testid={`vision-drawer-${drawer}-content`}
      flexBasis="0%"
      flexGrow={1}
      minHeight="0"
      overflow="auto"
      ref={attach}
    />
  )
}

function DrawerContent({drawer}: {drawer: VisionDrawer}): ReactNode {
  switch (drawer) {
    case 'closed-tabs':
      return <ClosedTabsPanel />
    case 'shared':
      return <QueryListPanel />
    case 'settings':
      return (
        <Box
          className={styles.nestedScroll}
          flexBasis="0%"
          flexGrow={1}
          minHeight="0"
          overflow="auto"
        >
          <SettingsPanel />
        </Box>
      )
    case 'delta':
    case 'mutate':
      return <TabDrawerSlotElement drawer={drawer} />
    default: {
      const unknownDrawer: never = drawer
      return String(unknownDrawer)
    }
  }
}

export interface SidebarDrawerProps {
  drawer: VisionDrawer
  /** Float over the whole tool instead of taking a column, for phones */
  overlay: boolean
}

export function SidebarDrawer({drawer, overlay}: SidebarDrawerProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const close = useCallback(() => actorRef.send({type: 'drawer.close'}), [actorRef])
  const title = drawerTitle(drawer, t)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (overlay && event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    },
    [close, overlay],
  )

  // Swapping one drawer for another resizes it, like the tabs area next to it
  const drawerElement = (
    <ViewTransition default={SIDEBAR_PANE} enter={DRAWER_ENTER} exit={DRAWER_EXIT}>
      <Flex
        aria-label={overlay ? title : undefined}
        aria-modal={overlay || undefined}
        borderRight
        className={cx(
          styles.sidebarDrawer,
          sidebarStyles.drawer,
          drawer !== 'closed-tabs' && drawer !== 'shared' && styles.sidebarDrawerWide,
          overlay && styles.sidebarDrawerOverlay,
          overlay && sidebarStyles.drawerOverlay,
        )}
        data-testid={`vision-drawer-${drawer}`}
        flexDirection="column"
        height="100%"
        onKeyDown={handleKeyDown}
        role={overlay ? 'dialog' : undefined}
      >
        <Flex
          alignItems="center"
          borderBottom
          flexShrink={0}
          gap={2}
          justifyContent="space-between"
          paddingLeft={3}
          paddingRight={2}
          paddingY={2}
        >
          <Text size={1} weight="medium" as="div" trim={true}>
            {title}
          </Text>
          <Button
            aria-label={t('vision.drawer.close')}
            className={sidebarStyles.pressable}
            icon={CloseIcon}
            mode="bleed"
            onClick={close}
            padding={2}
          />
        </Flex>
        <DrawerContent drawer={drawer} />
      </Flex>
    </ViewTransition>
  )

  // Floating over the tool, the drawer is a modal dialog: the rest of the tool is inert (see
  // VisionRedesign and VisionSidebar), focus moves to its close button on open, Tab stays inside it (the
  // studio chrome above is not inert), and focus returns to the opener on close (VisionSidebar).
  // Beside the tabs area it is not, and stays out of the lock: inside the lock's wrapper, React does
  // not see the drawer come in or go in a view transition, which then leaves it out of the picture
  return overlay ? (
    <TrapFocus autoFocus lockProps={TRAP_FOCUS_PROPS}>
      {drawerElement}
    </TrapFocus>
  ) : (
    drawerElement
  )
}
