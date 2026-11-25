import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {
  Button,
  Card,
  Dialog,
  rem,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text as SanityText,
  useTheme,
} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {createHighlightSpecs} from '../../../codemirror/useCodemirrorTheme'
import {visionLocaleNamespace} from '../../../i18n'
import {useVisionTelemetry} from '../../../telemetry/useVisionTelemetry'
import {encodedQuerySize, QUERY_URL_SIZE_LIMIT} from '../../../util/queryRequestMethod'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type QueryRequest} from '../../store/types'
import {useVisionSelector} from '../../store/VisionActorContext'
import {selectProjectId} from '../../store/visionMachine'
import {cx} from '../../util/cx'
import {
  buildExportSnippets,
  effectivePerspectiveLabel,
  type ExportSnippetFile,
  type ExportSnippetId,
  exportSnippetText,
} from '../../util/exportSnippets'
import {highlightSnippet} from '../../util/highlightSnippet'
import {CopyButton} from '../CopyButton'
import * as overlays from '../overlays.module.css'
import * as styles from '../redesign.module.css'
import * as themeStyles from '../themeTokens.module.css'

const COPIED_FEEDBACK_MS = 1500

export interface ExportQueryDialogProps {
  request: QueryRequest
  resolved: ResolvedRequest
  onClose: () => void
}

/**
 * The code of a snippet file, colored like the editors, with the GROQ of its query highlighted as
 * GROQ rather than as one string. Display only: copying takes `file.code`.
 */
function HighlightedCode(props: {file: ExportSnippetFile}) {
  const {file} = props
  const theme = useTheme()
  const specs = useMemo(() => createHighlightSpecs(theme), [theme])
  const spans = useMemo(() => highlightSnippet(file, specs), [file, specs])
  // oxlint-disable-next-line no-deprecated -- the editors' theme reads the same v1 fonts
  const {family, sizes} = theme.sanity.fonts.code
  const size = sizes[1]
  return (
    <pre
      className={styles.exportCodeBlock}
      data-language={file.language}
      style={{fontFamily: family, fontSize: rem(size.fontSize), lineHeight: rem(size.lineHeight)}}
    >
      <code>
        {spans.map((span, index) => {
          const spec = span.style === undefined ? undefined : specs[span.style]
          return spec ? (
            <span
              // The spans of a file never reorder, they only change all at once
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              style={{
                color: spec.color as string | undefined,
                fontWeight: spec.fontWeight as string | number | undefined,
                fontStyle: spec.fontStyle as string | undefined,
              }}
            >
              {span.text}
            </span>
          ) : (
            span.text
          )
        })}
      </code>
    </pre>
  )
}

function SnippetFile(props: {
  file: ExportSnippetFile
  index: number
  onCopy: (code: string) => Promise<boolean>
}) {
  const {file, index, onCopy} = props
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <Card border data-testid="vision-export-file" overflow="hidden" radius={2} tone="transparent">
      {file.path && (
        <Flex
          alignItems="center"
          className={styles.exportFileHeader}
          gap={2}
          justifyContent="space-between"
          paddingLeft={3}
          paddingRight={1}
          paddingY={1}
        >
          <Box flexGrow={1} style={{minWidth: 0}}>
            <SanityText muted size={1} textOverflow="ellipsis">
              <code data-testid="vision-export-file-path">{file.path}</code>
            </SanityText>
          </Box>
          <CopyButton
            label={t('vision.export-query.copy-file')}
            onCopy={() => onCopy(file.code)}
            testId={`vision-export-file-copy-${index}`}
          />
        </Flex>
      )}
      <Box className={cx(styles.codeBlock, styles.exportCode)} padding={3}>
        <HighlightedCode file={file} />
      </Box>
    </Card>
  )
}

export function ExportQueryDialog({request, resolved, onClose}: ExportQueryDialogProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const copyToClipboard = useCopyToClipboard()
  const telemetry = useVisionTelemetry()
  const projectId = useVisionSelector(selectProjectId)
  const {order, hidden} = useVisionSelector((snapshot) => snapshot.context.exportSnippets)
  const [activeId, setActiveId] = useState<ExportSnippetId | null>(null)
  // The snippet the copy button last copied, which it confirms with a checkmark for a moment. A
  // new object per copy restarts the moment when the same snippet is copied again.
  const [lastCopy, setLastCopy] = useState<{id: ExportSnippetId} | null>(null)

  useEffect(() => {
    if (lastCopy === null) return undefined
    const timeout = setTimeout(() => setLastCopy(null), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timeout)
  }, [lastCopy])

  const input = useMemo(
    () => ({
      query: request.query,
      params: request.params,
      url: request.url,
      projectId,
      dataset: resolved.dataset,
      apiVersion: resolved.apiVersion,
      perspective: resolved.perspective,
      variant: resolved.variant,
      resultSourceMap: request.resultSourceMap,
      // What the user asked for: a perspective that keeps the request off the CDN in Vision does
      // the same in the snippets' clients, which should still say what the user chose
      useCdn: resolved.useCdn || resolved.isCdnBlockedByPerspective,
    }),
    [projectId, request, resolved],
  )
  const snippets = useMemo(
    () =>
      buildExportSnippets(
        input,
        order.filter((id) => !hidden.includes(id)),
      ),
    [hidden, input, order],
  )
  const active = snippets.find((snippet) => snippet.id === activeId) || snippets[0]
  const copied = lastCopy?.id === active.id

  const copyFile = async (code: string) => {
    const copiedFile = await copyToClipboard(code, t('vision.export-query.copied'))
    if (copiedFile) telemetry.snippetCopied(active.id)
    return copiedFile
  }

  const copyAll = async () => {
    const snippetId = active.id
    if (await copyToClipboard(exportSnippetText(active), t('vision.export-query.copied'))) {
      telemetry.snippetCopied(snippetId)
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
      <Box className={themeStyles.themeTokens} padding={4}>
        <Stack gap={4}>
          <Text muted size={1} as="div" trim={true}>
            {t('vision.export-query.description')}
          </Text>
          <Box className={styles.exportTabs}>
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
          </Box>
          <TabPanel
            aria-labelledby={`vision-export-${active.id}-tab`}
            id={`vision-export-${active.id}-panel`}
          >
            <Stack className={overlays.snippet} gap={3} key={active.id}>
              {active.files.map((file, index) => (
                <SnippetFile file={file} index={index} key={file.path ?? index} onCopy={copyFile} />
              ))}
            </Stack>
          </TabPanel>
          <Flex alignItems="center" gap={3} justifyContent="space-between">
            <Stack gap={3}>
              {active.usesToken && (
                <Text data-testid="vision-export-token-note" muted size={1} as="div">
                  {t('vision.export-query.token-env-note', {
                    perspective: effectivePerspectiveLabel(input),
                  })}
                </Text>
              )}
              {active.method === 'POST' && (
                <Text data-testid="vision-export-post-note" muted size={1} as="div">
                  {t('vision.export-query.post-body-note', {
                    size: encodedQuerySize(request.query, request.params),
                    limit: QUERY_URL_SIZE_LIMIT,
                  })}
                </Text>
              )}
            </Stack>
            <Box flexShrink={0}>
              <Button
                className={overlays.copyButton}
                data-copied={copied ? 'true' : undefined}
                data-testid="vision-export-query-copy"
                icon={copied ? CheckmarkIcon : CopyIcon}
                mode="ghost"
                onClick={() => void copyAll()}
                text={
                  active.files.length > 1
                    ? t('vision.export-query.copy-all')
                    : t('vision.export-query.copy')
                }
              />
            </Box>
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
