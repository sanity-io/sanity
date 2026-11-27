import {CloseIcon} from '@sanity/icons/Close'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Card, TabList, TabPanel} from '@sanity/ui'
import {useState} from 'react'
import {type DocumentInspectorProps, type TargetPerspective, usePerspective} from 'sanity'
import {Translate, useTranslation, type TFunction} from 'sanity/i18n'
import {Text, Flex, Box, Icon} from 'ui5'

import {isReleaseDocument} from '../../../../../core/releases/store/types'
import {Button} from '../../../../../ui-components/button/Button'
import {Tab} from '../../../../../ui-components/tab/Tab'
import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {
  type ChangesInspectorTab,
  HISTORY_INSPECTOR_NAME,
  resolveChangesInspectorTab,
} from '../../constants'
import {fadeInFlex} from './ChangesTabs.css'
import {EventsInspector} from './EventsInspector'
import {EventsSelector} from './EventsSelector'

export function ChangesTabs(props: DocumentInspectorProps) {
  const {params, setParams} = usePaneRouter()
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null)
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()
  const isReady = params?.inspect === HISTORY_INSPECTOR_NAME
  const {selectedPerspective} = usePerspective()

  const paneRouterTab = resolveChangesInspectorTab(params?.changesInspectorTab)

  const setPaneRouterTab = (tab: ChangesInspectorTab) =>
    setParams({
      ...params,
      changesInspectorTab: tab,
      // Reset the since when changing the tab, as it's not relevant for the history tab
      since: tab === 'history' ? undefined : params?.since,
    })

  return (
    <Flex
      className={fadeInFlex}
      flexDirection="column"
      padding={0}
      height="100%"
      data-ready={isReady ? '' : undefined}
      ref={setParentRef}
    >
      <Card paddingBottom={1}>
        <Flex alignItems="center" padding={3} gap={2}>
          <TabList gap={1} flex={1}>
            <Tab
              aria-controls="history-panel"
              id="history-tab"
              label={t('changes.tab.history')}
              onClick={() => setPaneRouterTab('history')}
              selected={paneRouterTab === 'history'}
            />
            <Tab
              aria-controls="review-changes-panel"
              id="changes-tab"
              label={t('changes.tab.review-changes')}
              onClick={() => setPaneRouterTab('review')}
              selected={paneRouterTab === 'review'}
            />
          </TabList>
          <Button
            aria-label={tCore('changes.action.close-label')}
            icon={CloseIcon}
            mode="bleed"
            onClick={props.onClose}
            tooltipProps={{content: t('document-inspector.close-button.tooltip')}}
          />
        </Flex>
      </Card>
      <Card padding={2} marginBottom={3} marginX={3} tone="neutral" border radius={3}>
        <Flex gap={2} alignItems="flex-start">
          <Tooltip
            portal
            placement="bottom-end"
            boundaryElement={parentRef}
            content={
              <Box flexBasis="0%" flexGrow={1} padding={1}>
                <Text size={1} as="div" trim={true}>
                  <Translate t={t} i18nKey="changes.banner.tooltip" />
                </Text>
              </Box>
            }
          >
            <Icon size={0} muted icon={InfoOutlineIcon} style={{margin: '-0.3125rem'}} />
          </Tooltip>
          <Text size={0} muted as="div" trim={true}>
            <Translate
              t={t}
              values={{
                perspective: perspectiveLabel(selectedPerspective, {t, tCore}),
              }}
              i18nKey="changes.banner.description"
            />
          </Text>
        </Flex>
      </Card>

      <TabPanel
        aria-labelledby="history-tab"
        height="fill"
        hidden={paneRouterTab !== 'history'}
        id="history-panel"
      >
        <EventsSelector showList={paneRouterTab === 'history'} />
      </TabPanel>

      <TabPanel
        aria-labelledby="review-tab"
        hidden={paneRouterTab !== 'review'}
        id="review-panel"
        height="fill"
      >
        {paneRouterTab === 'review' ? (
          <EventsInspector showChanges={paneRouterTab === 'review'} />
        ) : null}
      </TabPanel>
    </Flex>
  )
}

function perspectiveLabel(
  perspective: TargetPerspective,
  {t, tCore}: {t: TFunction; tCore: TFunction},
): string {
  if (isReleaseDocument(perspective)) {
    return perspective.metadata.title || tCore('release.placeholder-untitled-release')
  }

  if (perspective === 'drafts') {
    return t('compare-versions.status.draft')
  }

  if (perspective === 'published') {
    return t('compare-versions.status.published')
  }

  return perspective
}
