import {CloseIcon} from '@sanity/icons'
import {Box, Flex, TabList, TabPanel} from '@sanity/ui'
import {useState} from 'react'
import {type DocumentInspectorProps, useTranslation} from 'sanity'

import {Button, Tab} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {ChangesInspector} from './ChangesInspector'
import {HistorySelector} from './HistorySelector'

export function ChangesTabs(props: DocumentInspectorProps) {
  const [id, setId] = useState<'history' | 'review'>('history')
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Flex direction="column" padding={0} height="fill">
      <Flex align="center" padding={3} gap={2}>
        <TabList space={1} flex={1}>
          <Tab
            aria-controls="history-panel"
            id="history-tab"
            label={t('changes.tab.history')}
            onClick={() => setId('history')}
            selected={id === 'history'}
          />
          <Tab
            aria-controls="review-changes-panel"
            id="changes-tab"
            label={t('changes.tab.review-changes')}
            onClick={() => setId('review')}
            selected={id === 'review'}
          />
        </TabList>
        <Box flex="none">
          <Button
            aria-label={t('changes.action.close-label')}
            icon={CloseIcon}
            mode="bleed"
            onClick={props.onClose}
            tooltipProps={{content: t('document-inspector.close-button.tooltip')}}
          />
        </Box>
      </Flex>

      <TabPanel
        aria-labelledby="history-tab"
        height="fill"
        hidden={id !== 'history'}
        id="history-panel"
      >
        <HistorySelector showList={id === 'history'} />
      </TabPanel>

      <TabPanel
        aria-labelledby="review-tab"
        hidden={id !== 'review'}
        id="review-panel"
        height="fill"
      >
        <ChangesInspector />
      </TabPanel>
    </Flex>
  )
}
