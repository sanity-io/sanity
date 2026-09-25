import {CloseIcon} from '@sanity/icons/Close'
import {Button, Text} from '@sanity/ui'
import {type KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react'
import {useTranslation} from 'sanity'
import {Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VistaDrawer} from '../../store/types'
import {useVistaActor} from '../../store/VistaActorContext'
import {cx} from '../../util/cx'
import {sidebarDrawer, sidebarDrawerOverlay} from '../vista.css'
import {QueryListPanel} from './QueryListPanel'

export interface SidebarDrawerProps {
  drawer: VistaDrawer
  /** Float over the whole tool instead of taking a column, for phones */
  overlay: boolean
}

export function SidebarDrawer({drawer, overlay}: SidebarDrawerProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => actorRef.send({type: 'drawer.close'}), [actorRef])
  const title =
    drawer === 'saved' ? t('vista.sidebar.saved-queries') : t('vista.sidebar.shared-queries')

  // The opener has to be read while rendering: the commit that mounts the drawer also makes the
  // rail and the tabs area inert, and that blurs the control that opened the drawer before any
  // effect runs
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )

  // Floating over the tool, the drawer behaves like a dialog: the rest of the tool is inert
  // (see VistaGui and VistaSidebar), focus moves in on open and back to the opener on close
  useEffect(() => {
    if (!overlay) return undefined
    closeButtonRef.current?.focus()
    return () => opener?.focus()
  }, [opener, overlay])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (overlay && event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    },
    [close, overlay],
  )

  return (
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
          ref={closeButtonRef}
        />
      </Flex>
      <QueryListPanel key={drawer} mode={drawer} />
    </Flex>
  )
}
