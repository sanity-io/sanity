import {CloseIcon, InfoOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, TabList, TabPanel, Text} from '@sanity/ui'
import {useState} from 'react'
import {
  type DocumentInspectorProps,
  isReleaseDocument,
  Translate,
  usePerspective,
  useSource,
  useTranslation,
} from 'sanity'
import {styled} from 'styled-components'

import {Button, Tab, Tooltip} from '../../../../../ui-components'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {structureLocaleNamespace} from '../../../../i18n'
import {HISTORY_INSPECTOR_NAME} from '../../constants'
import {ChangesInspector} from './ChangesInspector'
import {EventsInspector} from './EventsInspector'
import {EventsSelector} from './EventsSelector'
import {HistorySelector} from './HistorySelector'

const FadeInFlex = styled(Flex)`
  opacity: 0;
  transition: opacity 200ms;
  &[data-ready] {
    opacity: 1;
  }
`
const TABS = ['history', 'review'] as const
const isValidTab = (tab: string | undefined): tab is (typeof TABS)[number] =>
  // @ts-expect-error TS doesn't understand the type guard
  tab && TABS.includes(tab)

export function ChangesTabs(props: DocumentInspectorProps) {
  const {params, setParams} = usePaneRouter()
  const source = useSource()
  const [parentRef, setParentRef] = useState<HTMLDivElement | null>(null)
  const {t} = useTranslation(structureLocaleNamespace)
  const isReady = params?.inspect === HISTORY_INSPECTOR_NAME
  const {selectedPerspective} = usePerspective()

  const paneRouterTab = isValidTab(params?.changesInspectorTab)
    ? params.changesInspectorTab
    : TABS[0]

  const setPaneRouterTab = (tab: (typeof TABS)[number]) =>
    setParams({
      ...params,
      changesInspectorTab: tab,
      // Reset the since when changing the tab, as it's not relevant for the history tab
      since: tab === 'history' ? undefined : params?.since,
    })

  const perspectiveName = isReleaseDocument(selectedPerspective)
    ? selectedPerspective.metadata.title
    : selectedPerspective === 'drafts'
      ? t('compare-versions.status.draft')
      : t('compare-versions.status.published')

  return (
    <FadeInFlex
      direction="column"
      padding={0}
      height="fill"
      data-ready={isReady ? '' : undefined}
      ref={setParentRef}
    >
      <Card paddingBottom={1}>
        <Flex align="center" padding={3} gap={2}>
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
            aria-label={t('changes.action.close-label')}
            icon={CloseIcon}
            mode="bleed"
            onClick={props.onClose}
            tooltipProps={{content: t('document-inspector.close-button.tooltip')}}
          />
        </Flex>
      </Card>
      <Card padding={2} marginBottom={3} marginX={3} tone="neutral" border radius={3}>
        <Flex gap={2} align="flex-start">
          <Tooltip
            portal
            placement="bottom-end"
            boundaryElement={parentRef}
            content={
              <Box flex={1} padding={1}>
                <Text size={1}>
                  <Translate t={t} i18nKey="changes.banner.tooltip" />
                </Text>
              </Box>
            }
          >
            <Text size={0} muted>
              <InfoOutlineIcon fontSize={1} />
            </Text>
          </Tooltip>
          <Text size={0} muted>
            <Translate
              t={t}
              values={{
                perspective: perspectiveName,
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
        {source.beta?.eventsAPI?.documents ? (
          <EventsSelector showList={paneRouterTab === 'history'} />
        ) : (
          <HistorySelector showList={paneRouterTab === 'history'} />
        )}
      </TabPanel>

      <TabPanel
        aria-labelledby="review-tab"
        hidden={paneRouterTab !== 'review'}
        id="review-panel"
        height="fill"
      >
        {source.beta?.eventsAPI?.documents ? (
          <>
            {paneRouterTab === 'review' ? (
              <EventsInspector showChanges={paneRouterTab === 'review'} />
            ) : null}
          </>
        ) : (
          <ChangesInspector showChanges={paneRouterTab === 'review'} />
        )}
      </TabPanel>
    </FadeInFlex>
  )
}
