import {
  Flex,
  Menu,
  // eslint-disable-next-line no-restricted-imports
  MenuItem,
  Text,
  usePortal,
} from '@sanity/ui'
import {type PropsWithChildren} from 'react'
import {
  ContextMenuButton,
  getReleaseTone,
  type PublishDocumentVersionEvent,
  useTranslation,
} from 'sanity'
import {IntentLink} from 'sanity/router'

import {RELEASES_INTENT} from '../../../../../core/releases/plugin'
import {MenuButton} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {TIMELINE_MENU_PORTAL} from '../timelineMenu'
import {VersionInlineBadge} from './VersionInlineBadge'

export function PublishedEventMenu({event}: {event: PublishDocumentVersionEvent}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const portalContext = usePortal()

  const handleOpenReleaseDocument = () => {
    // Do something
  }
  const handleOpenDraftDocument = () => {
    // Do something
  }

  return (
    <MenuButton
      id={`timeline-item-menu-button-${event.versionId}`}
      button={
        <ContextMenuButton
          aria-label={t('timeline-item.menu-button.aria-label')}
          tooltipProps={{content: t('timeline-item.menu-button.tooltip')}}
        />
      }
      menu={
        <Menu padding={1}>
          {event.release ? (
            <>
              <IntentLink
                intent={RELEASES_INTENT}
                params={{id: event.release?.name}}
                style={{textDecoration: 'none'}}
              >
                <MenuItem padding={3}>
                  <Flex align={'center'}>
                    <Text size={1} style={{textDecoration: 'none'}}>
                      Open{' '}
                      <VersionInlineBadge $tone={getReleaseTone(event.release)}>
                        {event.release.metadata.title}
                      </VersionInlineBadge>{' '}
                      release
                    </Text>
                  </Flex>
                </MenuItem>
              </IntentLink>
              <MenuItem
                onClick={handleOpenReleaseDocument}
                // This needs to be added
                disabled
              >
                <Flex align={'center'}>
                  <Text size={1}>
                    Inspect{' '}
                    <VersionInlineBadge $tone={getReleaseTone(event.release)}>
                      {event.release.metadata.title}
                    </VersionInlineBadge>{' '}
                    document
                  </Text>
                </Flex>
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={handleOpenDraftDocument}>
              <Flex align={'center'}>
                <Text size={1}>
                  Open <VersionInlineBadge $tone={'caution'}>draft</VersionInlineBadge> document
                </Text>
              </Flex>
            </MenuItem>
          )}
        </Menu>
      }
      popover={{
        // when used inside the timeline menu we want to keep the element inside the popover, to avoid closing the popover when clicking expand.
        portal: portalContext.elements?.[TIMELINE_MENU_PORTAL] ? TIMELINE_MENU_PORTAL : true,
        placement: 'bottom',
        fallbackPlacements: ['bottom-end', 'bottom-start'],
      }}
    />
  )
}
