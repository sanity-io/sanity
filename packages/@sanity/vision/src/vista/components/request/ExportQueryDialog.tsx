import {CopyIcon} from '@sanity/icons/Copy'
import {Button, Card, Dialog, Stack, Tab, TabList, TabPanel, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useMemo, useState} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type QueryRequest, type VistaTab} from '../../store/types'
import {useVistaSelector} from '../../store/VistaActorContext'
import {selectProjectId} from '../../store/vistaMachine'
import {buildExportSnippets, type ExportSnippetId} from '../../util/exportSnippets'
import {codeBlock} from '../vista.css'

export interface ExportQueryDialogProps {
  tab: VistaTab
  request: QueryRequest
  resolved: ResolvedRequest
  onClose: () => void
}

export function ExportQueryDialog({tab, request, resolved, onClose}: ExportQueryDialogProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const copyToClipboard = useCopyToClipboard()
  const projectId = useVistaSelector(selectProjectId)
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
      }),
    [projectId, request, resolved, tab.options.includeSourceMap],
  )
  const active = snippets.find((snippet) => snippet.id === activeId) || snippets[0]

  return (
    <Dialog
      data-testid="vista-export-query-dialog"
      header={t('vista.export-query.title')}
      id="vista-export-query-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      width={2}
    >
      <Box padding={4}>
        <Stack gap={4}>
          <Text muted size={1}>
            {t('vista.export-query.description')}
          </Text>
          <TabList gap={1}>
            {snippets.map((snippet) => (
              <Tab
                aria-controls={`vista-export-${snippet.id}-panel`}
                fontSize={1}
                id={`vista-export-${snippet.id}-tab`}
                key={snippet.id}
                label={snippet.title}
                onClick={() => setActiveId(snippet.id)}
                selected={snippet.id === active.id}
              />
            ))}
          </TabList>
          <TabPanel
            aria-labelledby={`vista-export-${active.id}-tab`}
            id={`vista-export-${active.id}-panel`}
          >
            <Card
              border
              className={codeBlock}
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
              {active.id === 'curl' ? t('vista.export-query.token-note') : ''}
            </Text>
            <Button
              icon={CopyIcon}
              mode="ghost"
              onClick={() => void copyToClipboard(active.code, t('vista.export-query.copied'))}
              text={t('vista.export-query.copy')}
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
