import {CopyIcon} from '@sanity/icons/Copy'
import {Badge, Button, Stack, Text, TextInput} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ReactNode} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex, Grid} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {type VistaResponseMeta} from '../../store/types'
import {formatBytes} from '../../util/payloadSize'

function MetaRow({label, children}: {label: string; children: ReactNode}) {
  return (
    <>
      <Text muted size={1}>
        {label}
      </Text>
      <Box>{children}</Box>
    </>
  )
}

export interface ResponseMetaTabProps {
  meta: VistaResponseMeta | undefined
  url: string | undefined
}

export function ResponseMetaTab({meta, url}: ResponseMetaTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const copyToClipboard = useCopyToClipboard()
  const notApplicable = t('result.timing-not-applicable')

  if (!meta && !url) {
    return (
      <Box padding={3}>
        <Text muted size={1}>
          {t('vista.response.empty')}
        </Text>
      </Box>
    )
  }

  return (
    <Box data-testid="vista-response-meta" padding={3}>
      <Stack gap={4}>
        <Grid gap={3} gridTemplateColumns="max-content minmax(0, 1fr)">
          <MetaRow label={t('result.execution-time-label')}>
            <Text data-testid="vista-meta-execution" size={1}>
              {meta ? `${meta.ms}ms` : notApplicable}
            </Text>
          </MetaRow>
          <MetaRow label={t('result.end-to-end-time-label')}>
            <Text data-testid="vista-meta-e2e" size={1}>
              {meta ? `${meta.e2eMs}ms` : notApplicable}
            </Text>
          </MetaRow>
          <MetaRow label={t('vista.response.payload-size')}>
            <Text data-testid="vista-meta-payload" size={1}>
              {meta ? formatBytes(meta.payloadBytes) : notApplicable}
            </Text>
          </MetaRow>
          <MetaRow label={t('vista.response.sync-tags')}>
            {meta && meta.syncTags.length > 0 ? (
              <Flex data-testid="vista-meta-sync-tags" flexWrap="wrap" gap={1}>
                {meta.syncTags.map((tag) => (
                  <Badge fontSize={0} key={tag}>
                    {tag}
                  </Badge>
                ))}
              </Flex>
            ) : (
              <Text muted size={1}>
                {meta ? t('vista.response.sync-tags.none') : notApplicable}
              </Text>
            )}
          </MetaRow>
        </Grid>

        {url && (
          <Stack gap={2}>
            <Text muted size={1}>
              {t('query.url')}
            </Text>
            <Flex gap={1}>
              <Box flexBasis="0%" flexGrow={1}>
                <TextInput
                  data-testid="vista-query-url"
                  fontSize={1}
                  padding={2}
                  readOnly
                  type="url"
                  value={url}
                />
              </Box>
              <Tooltip content={<Text size={1}>{t('action.copy-url-to-clipboard')}</Text>} portal>
                <Button
                  aria-label={t('action.copy-url-to-clipboard')}
                  icon={CopyIcon}
                  mode="ghost"
                  onClick={() => void copyToClipboard(url, t('action.copy-url-to-clipboard'))}
                  padding={2}
                />
              </Tooltip>
            </Flex>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
