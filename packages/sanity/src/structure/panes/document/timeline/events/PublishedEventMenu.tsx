import {type BadgeTone, Flex, Text, usePortal} from '@sanity/ui'
import {
  Menu,
  // oxlint-disable-next-line no-restricted-imports
  MenuItem,
} from '@sanity/ui/menu'
import {useCallback} from 'react'
import {
  ContextMenuButton,
  getReleaseDocumentIdFromReleaseId,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  isReleaseDocument,
  type PublishDocumentVersionEvent,
  RELEASES_INTENT,
  ReleaseTitle,
  Translate,
  useAllReleases,
  useSetPerspective,
  useTranslation,
  useWorkspace,
  VersionInlineBadge,
} from 'sanity'
import {IntentLink} from 'sanity/router'

import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {TIMELINE_MENU_PORTAL} from '../timelineMenu'

function VersionBadge({children, tone}: {children?: React.ReactNode; tone?: BadgeTone}) {
  return <VersionInlineBadge $tone={tone}>{children}</VersionInlineBadge>
}

export function PublishedEventMenu({event}: {event: PublishDocumentVersionEvent}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()
  const portalContext = usePortal()
  const {params, setParams} = usePaneRouter()
  const setPerspective = useSetPerspective()
  const {document} = useWorkspace()
  const {
    drafts: {enabled: isDraftModelEnabled},
  } = document

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
      setPerspective(isDraftModelEnabled ? 'drafts' : 'published')
    }, 100)
  }, [setParams, params, event.versionRevisionId, setPerspective, isDraftModelEnabled])

  // Resolve the release behind a release publish. When the release is missing from the store
  // (e.g. it was deleted) a stub {_id} keeps the release indicated but disables the menu;
  // draft publishes have no releaseId.
  const {map: releasesMap} = useAllReleases()
  const releaseDocumentId = event.releaseId
    ? getReleaseDocumentIdFromReleaseId(event.releaseId)
    : undefined
  const release = releaseDocumentId
    ? releasesMap.get(releaseDocumentId) || {_id: releaseDocumentId, metadata: undefined}
    : undefined

  const releaseTitle = release?.metadata?.title
  const releaseFallback = tCore('release.placeholder-untitled-release')

  const releaseBadgeTone = release
    ? isReleaseDocument(release)
      ? getReleaseTone(release)
      : 'default'
    : undefined
  const isMenuDisabled = release && !isReleaseDocument(release)

  return (
    <MenuButton
      id={`timeline-item-menu-button-${event.versionId}`}
      button={
        <ContextMenuButton
          aria-label={t('timeline-item.menu-button.aria-label')}
          tooltipProps={{
            content: isMenuDisabled
              ? t('timeline-item.not-found-release.tooltip', {
                  releaseId: release?._id
                    ? getReleaseIdFromReleaseDocumentId(release._id)
                    : undefined,
                })
              : t('timeline-item.menu-button.tooltip'),
          }}
          disabled={isMenuDisabled}
        />
      }
      menu={
        <Menu padding={1}>
          {release ? (
            <>
              <IntentLink
                intent={RELEASES_INTENT}
                params={{id: getReleaseIdFromReleaseDocumentId(release._id)}}
                style={{textDecoration: 'none'}}
              >
                <MenuItem padding={3}>
                  <Flex align={'center'} justify="flex-start">
                    <Text size={1} style={{textDecoration: 'none'}}>
                      <ReleaseTitle title={releaseTitle} fallback={releaseFallback}>
                        {({displayTitle}) => (
                          <Translate
                            components={{VersionBadge}}
                            componentProps={{tone: releaseBadgeTone}}
                            i18nKey="events.open.release"
                            values={{
                              releaseTitle: displayTitle,
                            }}
                            t={t}
                          />
                        )}
                      </ReleaseTitle>
                    </Text>
                  </Flex>
                </MenuItem>
              </IntentLink>
              <MenuItem onClick={handleOpenReleaseDocument}>
                <Flex align={'center'} justify="flex-start">
                  <Text size={1}>
                    <ReleaseTitle title={releaseTitle} fallback={releaseFallback}>
                      {({displayTitle}) => (
                        <Translate
                          components={{VersionBadge}}
                          componentProps={{tone: releaseBadgeTone}}
                          i18nKey="events.inspect.release"
                          values={{
                            releaseTitle: displayTitle,
                          }}
                          t={t}
                        />
                      )}
                    </ReleaseTitle>
                  </Text>
                </Flex>
              </MenuItem>
            </>
          ) : (
            <MenuItem onClick={handleOpenDraftDocument} disabled={!event.versionRevisionId}>
              <Flex align={'center'}>
                <Text size={1}>
                  <Translate
                    components={{VersionBadge}}
                    componentProps={{tone: 'caution' as const}}
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
