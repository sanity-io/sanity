import {
  Flex,
  Menu,
  // eslint-disable-next-line no-restricted-imports
  MenuItem,
  Text,
  usePortal,
} from '@sanity/ui'
import {
  ContextMenuButton,
  getReleaseTone,
  getVersionFromId,
  type PublishDocumentVersionEvent,
  RELEASES_INTENT,
  Translate,
  usePerspective,
  useTranslation,
} from 'sanity'
import {IntentLink} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

import {MenuButton} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {TIMELINE_MENU_PORTAL} from '../timelineMenu'
import {VersionInlineBadge} from './VersionInlineBadge'

export function PublishedEventMenu({event}: {event: PublishDocumentVersionEvent}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const portalContext = usePortal()
  const {params, setParams} = usePaneRouter()
  const {setPerspective} = usePerspective()
  const handleOpenReleaseDocument = () => {
    setParams({
      ...params,
      rev: '@lastEdited',
      since: undefined,
      historyEvent: event.id,
      historyVersion: getVersionFromId(event.versionId),
    })
  }
  const handleOpenDraftDocument = () => {
    // Do something
    setParams({
      ...params,
      // TODO: Event.versionREvisionId should be defined for this type of events, CL is missing this property
      rev: event.versionRevisionId || event.revisionId,
      preserveRev: 'true',
      since: undefined,
    })
    setTimeout(() => {
      // A bug is produced when we change the perspective and the params at the same time
      setPerspective('drafts')
    }, 100)
  }

  const VersionBadge = ({children}: {children: React.ReactNode}) => {
    return (
      <VersionInlineBadge $tone={event.release ? getReleaseTone(event.release) : undefined}>
        {children}
      </VersionInlineBadge>
    )
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
                      <Translate
                        components={{
                          VersionBadge: ({children}) => <VersionBadge>{children} </VersionBadge>,
                        }}
                        i18nKey="events.open.release"
                        values={{
                          releaseTitle: event.release.metadata.title,
                        }}
                        t={t}
                      />
                    </Text>
                  </Flex>
                </MenuItem>
              </IntentLink>
              <MenuItem onClick={handleOpenReleaseDocument}>
                <Flex align={'center'}>
                  <Text size={1}>
                    <Translate
                      components={{
                        VersionBadge: ({children}) => <VersionBadge>{children} </VersionBadge>,
                      }}
                      i18nKey="events.inspect.release"
                      values={{
                        releaseTitle: event.release.metadata.title,
                      }}
                      t={t}
                    />
                  </Text>
                </Flex>
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={handleOpenDraftDocument}>
              <Flex align={'center'}>
                <Text size={1}>
                  <Translate
                    components={{
                      VersionBadge: ({children}) => (
                        <VersionInlineBadge $tone="caution">{children}</VersionInlineBadge>
                      ),
                    }}
                    i18nKey="events.open.draft"
                    values={{
                      releaseTitle: 'draft',
                    }}
                    t={t}
                  />
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
