import {
  Flex,
  Menu,
  // eslint-disable-next-line no-restricted-imports
  MenuItem,
  Text,
  usePortal,
} from '@sanity/ui'
import {useCallback} from 'react'
import {
  ContextMenuButton,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  type PublishDocumentVersionEvent,
  RELEASES_INTENT,
  Translate,
  useSetPerspective,
  useTranslation,
  VersionInlineBadge,
} from 'sanity'
import {IntentLink} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

import {MenuButton} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {TIMELINE_MENU_PORTAL} from '../timelineMenu'

export function PublishedEventMenu({event}: {event: PublishDocumentVersionEvent}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const portalContext = usePortal()
  const {params, setParams} = usePaneRouter()
  const setPerspective = useSetPerspective()

  const handleOpenReleaseDocument = useCallback(() => {
    setParams({
      ...params,
      rev: event.versionRevisionId || '@lastPublished',
      since: undefined,
      historyEvent: event.id,
      historyVersion: getVersionFromId(event.versionId),
    })
  }, [setParams, params, event])

  const handleOpenDraftDocument = useCallback(() => {
    setParams({
      ...params,
      rev: event.versionRevisionId,
      preserveRev: 'true',
      since: undefined,
    })
    setTimeout(() => {
      // A bug is generated when we change the perspective and the params at the same time
      // Resetting the params to the value it had before, because the paneRouter uses the previous value
      setPerspective('drafts')
    }, 100)
  }, [setParams, params, event.versionRevisionId, setPerspective])

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
                params={{id: getReleaseIdFromReleaseDocumentId(event.release._id)}}
                style={{textDecoration: 'none'}}
              >
                <MenuItem padding={3}>
                  <Flex align={'center'} justify="flex-start">
                    <Text size={1} style={{textDecoration: 'none'}}>
                      <Translate
                        components={{
                          VersionBadge: ({children}) => <VersionBadge>{children}</VersionBadge>,
                        }}
                        i18nKey="events.open.release"
                        values={{
                          releaseTitle:
                            event.release.metadata.title ||
                            t('release.placeholder-untitled-release'),
                        }}
                        t={t}
                      />
                    </Text>
                  </Flex>
                </MenuItem>
              </IntentLink>
              <MenuItem onClick={handleOpenReleaseDocument}>
                <Flex align={'center'} justify="flex-start">
                  <Text size={1}>
                    <Translate
                      components={{
                        VersionBadge: ({children}) => <VersionBadge>{children}</VersionBadge>,
                      }}
                      i18nKey="events.inspect.release"
                      values={{
                        releaseTitle:
                          event.release.metadata.title || t('release.placeholder-untitled-release'),
                      }}
                      t={t}
                    />
                  </Text>
                </Flex>
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={handleOpenDraftDocument} disabled={!event.versionRevisionId}>
              <Flex align={'center'}>
                <Text size={1}>
                  <Translate
                    components={{
                      VersionBadge: ({children}) => (
                        <VersionInlineBadge $tone="caution">{children}</VersionInlineBadge>
                      ),
                    }}
                    i18nKey="events.open.draft"
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
