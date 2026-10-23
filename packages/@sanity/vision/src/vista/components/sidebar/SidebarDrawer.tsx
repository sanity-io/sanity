import {CloseIcon} from '@sanity/icons/Close'
import {Button, Text} from '@sanity/ui'
import {type KeyboardEvent, type ReactNode, useCallback} from 'react'
import TrapFocus from 'react-focus-lock'
import {type TFunction, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VistaDrawer} from '../../store/types'
import {useTabDrawerSlot, useVistaActor} from '../../store/VistaActorContext'
import {cx} from '../../util/cx'
import * as styles from '../vista.module.css'
import {QueryListPanel} from './QueryListPanel'
import {SettingsPanel} from './SettingsPanel'

/** The lock's own element takes no part in the layout; the drawer is positioned by its class */
const TRAP_FOCUS_PROPS = {style: {display: 'contents'}}

function drawerTitle(drawer: VistaDrawer, t: TFunction<'vision'>): string {
  switch (drawer) {
    case 'saved':
      return t('vista.sidebar.saved-queries')
    case 'shared':
      return t('vista.sidebar.shared-queries')
    case 'lint':
      return t('vista.panel.lint')
    case 'functions':
      return t('vista.panel.functions')
    case 'delta':
      return t('vista.panel.delta')
    case 'mutate':
      return t('vista.panel.mutate')
    case 'settings':
      return t('vista.settings.title')
    default: {
      const unknownDrawer: never = drawer
      return String(unknownDrawer)
    }
  }
}

/** The active tab renders its tool into this element (see `TabDrawerSlot`) */
function TabDrawerSlotElement({drawer}: {drawer: VistaDrawer}) {
  const {setElement} = useTabDrawerSlot()
  return (
    <Box
      data-testid={`vista-drawer-${drawer}-content`}
      flexBasis="0%"
      flexGrow={1}
      minHeight="0"
      overflow="auto"
      ref={setElement}
    />
  )
}

function DrawerContent({drawer}: {drawer: VistaDrawer}): ReactNode {
  switch (drawer) {
    case 'saved':
    case 'shared':
      return <QueryListPanel key={drawer} mode={drawer} />
    case 'settings':
      return (
        <Box flexBasis="0%" flexGrow={1} minHeight="0" overflow="auto">
          <SettingsPanel />
        </Box>
      )
    case 'lint':
    case 'functions':
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
  drawer: VistaDrawer
  /** Float over the whole tool instead of taking a column, for phones */
  overlay: boolean
}

export function SidebarDrawer({drawer, overlay}: SidebarDrawerProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
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

  // Floating over the tool, the drawer is a modal dialog: the rest of the tool is inert (see
  // VistaGui and VistaSidebar), focus moves to its close button on open, Tab stays inside it (the
  // studio chrome above is not inert), and focus returns to the opener on close (VistaSidebar)
  return (
    <TrapFocus autoFocus disabled={!overlay} lockProps={TRAP_FOCUS_PROPS}>
      <Flex
        aria-label={overlay ? title : undefined}
        aria-modal={overlay || undefined}
        borderRight
        className={cx(
          styles.sidebarDrawer,
          drawer !== 'saved' && drawer !== 'shared' && styles.sidebarDrawerWide,
          overlay && styles.sidebarDrawerOverlay,
        )}
        data-testid={`vista-drawer-${drawer}`}
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
          <Text size={1} weight="medium">
            {title}
          </Text>
          <Button
            aria-label={t('vista.drawer.close')}
            icon={CloseIcon}
            mode="bleed"
            onClick={close}
            padding={2}
          />
        </Flex>
        <DrawerContent drawer={drawer} />
      </Flex>
    </TrapFocus>
  )
}
