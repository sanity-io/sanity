import {CloseIcon} from '@sanity/icons/Close'
import {Button, Text} from '@sanity/ui'
import {type KeyboardEvent, useCallback, useEffect, useRef} from 'react'
import TrapFocus from 'react-focus-lock'
import {useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VistaDrawer} from '../../store/types'
import {useVistaActor} from '../../store/VistaActorContext'
import {cx} from '../../util/cx'
import {sidebarDrawer, sidebarDrawerOverlay} from '../vista.css'
import {QueryListPanel} from './QueryListPanel'

/** The lock's own element takes no part in the layout; the drawer is positioned by its class */
const TRAP_FOCUS_PROPS = {style: {display: 'contents'}}

export interface SidebarDrawerProps {
  drawer: VistaDrawer
  /** Float over the whole tool instead of taking a column, for phones */
  overlay: boolean
}

export function SidebarDrawer({drawer, overlay}: SidebarDrawerProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
  const close = useCallback(() => actorRef.send({type: 'drawer.close'}), [actorRef])
  const title =
    drawer === 'saved' ? t('vista.sidebar.saved-queries') : t('vista.sidebar.shared-queries')

  // The control that opened the drawer, read when the lock activates, which is before it moves
  // focus inside. Focus goes back to it from a passive effect cleanup rather than through the
  // lock's own `returnFocus`: that resolves its target while the drawer unmounts, when the rail
  // still carries `inert` from the same commit and focus-lock sees nothing focusable there.
  const openerRef = useRef<HTMLElement | null>(null)
  const rememberOpener = useCallback(() => {
    openerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
  }, [])
  useEffect(() => {
    if (!overlay) return undefined
    return () => openerRef.current?.focus()
  }, [overlay])

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
  // studio chrome above is not inert), and focus returns to the opener on close
  return (
    <TrapFocus
      autoFocus
      disabled={!overlay}
      lockProps={TRAP_FOCUS_PROPS}
      onActivation={rememberOpener}
    >
      <Flex
        aria-label={overlay ? title : undefined}
        aria-modal={overlay || undefined}
        borderRight
        className={cx(sidebarDrawer, overlay && sidebarDrawerOverlay)}
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
        <QueryListPanel key={drawer} mode={drawer} />
      </Flex>
    </TrapFocus>
  )
}
