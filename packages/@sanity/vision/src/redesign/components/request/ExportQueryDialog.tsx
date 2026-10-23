import {CopyIcon} from '@sanity/icons/Copy'
import {Button, Card, Dialog, Stack, Tab, TabList, TabPanel, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useMemo, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type QueryRequest, type VisionTab} from '../../store/types'
import {useVisionSelector} from '../../store/VisionActorContext'
import {selectProjectId} from '../../store/visionMachine'
import {buildExportSnippets, type ExportSnippetId} from '../../util/exportSnippets'
import * as styles from '../redesign.module.css'

export interface ExportQueryDialogProps {
  tab: VisionTab
  request: QueryRequest
  resolved: ResolvedRequest
  onClose: () => void
}

export function ExportQueryDialog({tab, request, resolved, onClose}: ExportQueryDialogProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const copyToClipboard = useCopyToClipboard()
  const projectId = useVisionSelector(selectProjectId)
  const [activeId, setActiveId] = useState<ExportSnippetId>('client')

  const snippets = useMemo(
    () =>
      buildExportSnippets({
        query: request.query,
        params: request.params,
        url: request.url,
        projectId,
        dataset: resolved.dataset,
        apiVersion: resolved.apiVersion,
        perspective: resolved.perspective,
        variant: resolved.variant,
        includeSourceMap: tab.options.includeSourceMap,
        useCdn: request.useCdn,
      }),
    [projectId, request, resolved, tab.options.includeSourceMap],
  )
  const active = snippets.find((snippet) => snippet.id === activeId) || snippets[0]

  return (
    <Dialog
      animate
      data-testid="vision-export-query-dialog"
      header={t('vision.export-query.title')}
      id="vision-export-query-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={2}
    >
      <Box padding={4}>
        <Stack gap={4}>
          <Text muted size={1}>
            {t('vision.export-query.description')}
          </Text>
          <TabList gap={1}>
            {snippets.map((snippet) => (
              <Tab
                aria-controls={`vision-export-${snippet.id}-panel`}
                fontSize={1}
                id={`vision-export-${snippet.id}-tab`}
                key={snippet.id}
                label={snippet.title}
                onClick={() => setActiveId(snippet.id)}
                selected={snippet.id === active.id}
              />
            ))}
          </TabList>
          <TabPanel
            aria-labelledby={`vision-export-${active.id}-tab`}
            id={`vision-export-${active.id}-panel`}
          >
            <Card
              border
              className={styles.codeBlock}
              overflow="auto"
              padding={3}
              radius={2}
              tone="transparent"
            >
              <Code language={active.language} size={1}>
                {active.code}
              </Code>
            </Card>
          </TabPanel>
          <Flex alignItems="center" gap={3} justifyContent="space-between">
            <Text muted size={1}>
              {active.id === 'curl' ? t('vision.export-query.token-note') : ''}
            </Text>
            <Button
              icon={CopyIcon}
              mode="ghost"
              onClick={() => void copyToClipboard(active.code, t('vision.export-query.copied'))}
              text={t('vision.export-query.copy')}
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
