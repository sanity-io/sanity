import {CloseIcon} from '@sanity/icons/Close'
import {Button, Text} from '@sanity/ui'
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
  datasets: string[]
  /** Float over the tabs area instead of taking a column, for phones */
  overlay: boolean
}

export function SidebarDrawer({drawer, datasets, overlay}: SidebarDrawerProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVistaActor()

  return (
    <Flex
      borderRight
      className={cx(sidebarDrawer, overlay && sidebarDrawerOverlay)}
      data-testid={`vista-drawer-${drawer}`}
      flexDirection="column"
      height="100%"
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
          {drawer === 'saved'
            ? t('vista.sidebar.saved-queries')
            : t('vista.sidebar.shared-queries')}
        </Text>
        <Button
          aria-label={t('vista.drawer.close')}
          icon={CloseIcon}
          mode="bleed"
          onClick={() => actorRef.send({type: 'drawer.close'})}
          padding={2}
        />
      </Flex>
      <QueryListPanel key={drawer} mode={drawer} datasets={datasets} />
    </Flex>
  )
}
