import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {Button, Card, Dialog, Stack, Tab, TabList, TabPanel} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'sanity'
import {Text, Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {encodedQuerySize, QUERY_URL_SIZE_LIMIT} from '../../../util/queryRequestMethod'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type QueryRequest, type VisionTab} from '../../store/types'
import {useVisionSelector} from '../../store/VisionActorContext'
import {selectProjectId} from '../../store/visionMachine'
import {cx} from '../../util/cx'
import {buildExportSnippets, type ExportSnippetId} from '../../util/exportSnippets'
import * as overlays from '../overlays.module.css'
import * as styles from '../redesign.module.css'

const COPIED_FEEDBACK_MS = 1500

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
  // The snippet the copy button last copied, which it confirms with a checkmark for a moment. A
  // new object per copy restarts the moment when the same snippet is copied again.
  const [lastCopy, setLastCopy] = useState<{id: ExportSnippetId} | null>(null)

  useEffect(() => {
    if (lastCopy === null) return undefined
    const timeout = setTimeout(() => setLastCopy(null), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timeout)
  }, [lastCopy])

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
  const copied = lastCopy?.id === active.id

  const copy = async () => {
    const snippetId = active.id
    if (await copyToClipboard(active.code, t('vision.export-query.copied'))) {
      setLastCopy({id: snippetId})
    }
  }

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
          <Text muted size={1} as="div" trim={true}>
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
              className={cx(styles.codeBlock, overlays.snippet)}
              key={active.id}
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
            <Stack gap={2}>
              {active.id === 'curl' && (
                <Text muted size={1} as="div" trim={true}>
                  {t('vision.export-query.token-note')}
                </Text>
              )}
              {active.method === 'POST' && (
                <Text data-testid="vision-export-post-note" muted size={1} as="div" trim={true}>
                  {t('vision.export-query.post-body-note', {
                    size: encodedQuerySize(request.query, request.params),
                    limit: QUERY_URL_SIZE_LIMIT,
                  })}
                </Text>
              )}
            </Stack>
            <Button
              className={cx(styles.pressable, overlays.copyButton)}
              data-copied={copied ? 'true' : undefined}
              data-testid="vision-export-query-copy"
              icon={copied ? CheckmarkIcon : CopyIcon}
              mode="ghost"
              onClick={() => void copy()}
              text={t('vision.export-query.copy')}
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
