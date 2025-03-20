import {CloseIcon} from '@sanity/icons'
import {Card, Flex, TabList, TabPanel} from '@sanity/ui'
import {type DocumentInspectorProps, useSource, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Button, Tab} from '../../../../../ui-components'
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

  const {t} = useTranslation(structureLocaleNamespace)
  const isReady = params?.inspect === HISTORY_INSPECTOR_NAME

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

  return (
    <FadeInFlex direction="column" padding={0} height="fill" data-ready={isReady ? '' : undefined}>
      <Card paddingBottom={1}>
        <Flex align="center" padding={3} gap={2}>
          <TabList space={1} flex={1}>
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
