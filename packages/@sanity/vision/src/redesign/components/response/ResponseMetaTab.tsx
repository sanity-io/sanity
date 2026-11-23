import {CopyIcon} from '@sanity/icons/Copy'
import {Badge, Button, Stack, TextInput} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type CSSProperties, type ReactNode, useMemo} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex, Grid} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {useVisionTelemetry} from '../../../telemetry/useVisionTelemetry'
import {formatDuration} from '../../../util/formatDuration'
import {isApiCdnHost} from '../../../util/parseQueryUrl'
import {encodedQuerySizeOfUrl, QUERY_URL_SIZE_LIMIT} from '../../../util/queryRequestMethod'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type VisionResponseMeta} from '../../store/types'
import {regionOfShard} from '../../util/apiRegions'
import {formatBytes} from '../../util/payloadSize'
import {sortSyncTags} from '../../util/syncTags'
import {browserLocation} from '../../util/timeZoneLocation'
import {CdnBlockedNotice} from '../CdnBlockedNotice'
import {InfoTooltip} from '../InfoTooltip'
import {NetworkGlobe} from './NetworkGlobe'

const CENTERED_LABEL: CSSProperties = {alignSelf: 'center'}
/** Keeps the info button from making its row taller than the text next to it */
const INLINE_ICON: CSSProperties = {height: 0, display: 'flex', alignItems: 'center'}
/** Narrower than this, the details wrap below the globe */
const DETAILS_MIN_WIDTH: CSSProperties = {minWidth: 280}
const MUTED: CSSProperties = {color: 'var(--card-muted-fg-color)'}

function MetaRow({
  label,
  children,
  centerLabel = false,
}: {
  label: string
  children: ReactNode
  /** For a value taller than a line of text, such as an input */
  centerLabel?: boolean
}) {
  return (
    <>
      <Text muted size={1} as="div" trim={true} style={centerLabel ? CENTERED_LABEL : undefined}>
        {label}
      </Text>
      <Box minWidth="0">{children}</Box>
    </>
  )
}

function isCdnUrl(url: string): boolean {
  try {
    return isApiCdnHost(new URL(url).hostname)
  } catch {
    return false
  }
}

export interface ResponseMetaTabProps {
  meta: VisionResponseMeta | undefined
  url: string | undefined
  resolved: Pick<ResolvedRequest, 'useCdn' | 'isCdnBlockedByPerspective'>
  /** The tab's perspective as the perspective select names it, for why the CDN is not used */
  perspectiveName: string
}

/**
 * The shown response and how it travelled: its timing and size, which endpoint answered it,
 * whether from the CDN's cache, and where the query ran, on a globe from roughly where you are
 */
export function ResponseMetaTab({meta, url, resolved, perspectiveName}: ResponseMetaTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const copyToClipboard = useCopyToClipboard()
  const telemetry = useVisionTelemetry()
  const you = useMemo(() => browserLocation(), [])
  const network = meta?.network
  const region = useMemo(() => regionOfShard(network?.shard), [network?.shard])
  const notApplicable = t('result.timing-not-applicable')

  if (!meta && !url) {
    return (
      <Box padding={3}>
        <Text muted size={1} as="div" trim={true}>
          {t('vision.response.empty')}
        </Text>
      </Box>
    )
  }

  const viaCdn = meta ? (network ? network.viaCdn : isCdnUrl(meta.url)) : false
  const cacheHit = Boolean(network?.cacheHit)
  let cache = t('vision.network.cache.none')
  if (viaCdn) cache = cacheHit ? t('vision.network.cache.hit') : t('vision.network.cache.miss')
  const showCdnHint = !viaCdn && !resolved.useCdn && !resolved.isCdnBlockedByPerspective

  return (
    <Box data-testid="vision-response-meta" padding={3}>
      <Flex alignItems="flex-start" flexWrap="wrap" gap={4}>
        {meta && (
          <Stack gap={2}>
            <NetworkGlobe api={region} reachedApi={!cacheHit} you={you} />
            <Flex alignItems="center" gap={2} justifyContent="center">
              <Badge fontSize={0} tone="primary">
                {t('vision.network.you')}
              </Badge>
              {region && (
                <Badge fontSize={0} tone="caution">
                  {region.id}
                </Badge>
              )}
            </Flex>
          </Stack>
        )}
        <Box flexBasis="0%" flexGrow={1} style={DETAILS_MIN_WIDTH}>
          <Stack gap={4}>
            <Grid columnGap={4} gridTemplateColumns="max-content minmax(0, 1fr)" rowGap={2}>
              <MetaRow label={t('vision.network.timing')}>
                <Text size={1} as="div" trim={true}>
                  <span style={MUTED}>{t('result.execution-time-label')}</span>{' '}
                  <span data-testid="vision-meta-execution">
                    {meta ? formatDuration(meta.ms) : notApplicable}
                  </span>
                  <span style={MUTED}>
                    {' · '}
                    {t('result.end-to-end-time-label')}
                  </span>{' '}
                  <span data-testid="vision-meta-e2e">
                    {meta ? formatDuration(meta.e2eMs) : notApplicable}
                  </span>
                </Text>
              </MetaRow>
              <MetaRow label={t('vision.response.payload-size')}>
                <Text data-testid="vision-meta-payload" size={1} as="div" trim={true}>
                  {meta ? formatBytes(meta.payloadBytes) : notApplicable}
                </Text>
              </MetaRow>
              {meta && (
                <>
                  <MetaRow label={t('vision.network.endpoint')}>
                    <Flex alignItems="center" gap={2}>
                      <Text
                        data-testid="vision-network-endpoint"
                        size={1}
                        weight="medium"
                        as="div"
                        trim={true}
                      >
                        {viaCdn
                          ? t('vision.network.endpoint.cdn')
                          : t('vision.network.endpoint.api')}
                      </Text>
                      {showCdnHint && (
                        <span style={INLINE_ICON}>
                          <InfoTooltip
                            content={t('vision.network.use-cdn-hint')}
                            label={t('vision.network.use-cdn-hint.label')}
                            testId="vision-network-endpoint-info"
                          />
                        </span>
                      )}
                    </Flex>
                  </MetaRow>
                  <MetaRow label={t('vision.network.cache')}>
                    <Stack gap={2}>
                      <Text data-testid="vision-network-cache" size={1} as="div" trim={true}>
                        {cache}
                      </Text>
                      {network?.cacheControl && (
                        <Text muted size={0} as="div" trim={true}>
                          {`Cache-Control: ${network.cacheControl}`}
                        </Text>
                      )}
                    </Stack>
                  </MetaRow>
                  <MetaRow label={t('vision.network.method')}>
                    <Stack gap={2}>
                      <Text data-testid="vision-network-method" size={1} as="div" trim={true}>
                        {meta.method === 'POST'
                          ? t('vision.network.method.post')
                          : t('vision.network.method.get')}
                      </Text>
                      {meta.method === 'POST' && (
                        <Text
                          data-testid="vision-network-method-explained"
                          muted
                          size={0}
                          as="div"
                          trim={true}
                        >
                          {t('vision.network.method.post-explained', {
                            size: encodedQuerySizeOfUrl(meta.url),
                            limit: QUERY_URL_SIZE_LIMIT,
                          })}
                        </Text>
                      )}
                    </Stack>
                  </MetaRow>
                  <MetaRow label={t('vision.network.region')}>
                    <Stack gap={2}>
                      <Text data-testid="vision-network-region" size={1} as="div" trim={true}>
                        {region
                          ? `${region.id} (${region.location})`
                          : (network?.shard ?? t('vision.network.region.unknown'))}
                      </Text>
                      {region && network?.shard && (
                        <Text muted size={0} as="div" trim={true}>
                          {network.shard}
                        </Text>
                      )}
                    </Stack>
                  </MetaRow>
                </>
              )}
              <MetaRow label={t('vision.response.sync-tags')}>
                {meta && meta.syncTags.length > 0 ? (
                  <Flex data-testid="vision-meta-sync-tags" flexWrap="wrap" gap={1}>
                    {sortSyncTags(meta.syncTags).map((tag) => (
                      <Badge fontSize={0} key={tag}>
                        {tag}
                      </Badge>
                    ))}
                  </Flex>
                ) : (
                  <Text muted size={1} as="div" trim={true}>
                    {meta ? t('vision.response.sync-tags.none') : notApplicable}
                  </Text>
                )}
              </MetaRow>
              {network?.traceId && (
                <MetaRow label={t('vision.network.trace')}>
                  <Text size={1} truncate={1} as="div" trim={true}>
                    <code>{network.traceId}</code>
                  </Text>
                </MetaRow>
              )}
              {url && (
                <MetaRow centerLabel label={t('query.url')}>
                  <Flex gap={1}>
                    <Box flexBasis="0%" flexGrow={1} minWidth="0">
                      <TextInput
                        aria-label={t('query.url')}
                        data-testid="vision-query-url"
                        fontSize={1}
                        padding={2}
                        readOnly
                        type="url"
                        value={url}
                      />
                    </Box>
                    <Tooltip
                      animate
                      content={
                        <Text size={1} as="div" trim={true}>
                          {t('action.copy-url-to-clipboard')}
                        </Text>
                      }
                      portal
                    >
                      <Button
                        aria-label={t('action.copy-url-to-clipboard')}
                        icon={CopyIcon}
                        mode="ghost"
                        onClick={() =>
                          void copyToClipboard(url, t('action.copy-url-to-clipboard')).then(
                            (copied) => {
                              if (copied) telemetry.copied('url')
                            },
                          )
                        }
                        padding={2}
                      />
                    </Tooltip>
                  </Flex>
                </MetaRow>
              )}
            </Grid>
            {meta?.method === 'POST' && url && (
              <Text data-testid="vision-query-url-posted" muted size={1} as="div" trim={true}>
                {t('vision.response.url.sent-as-post')}
              </Text>
            )}
            {cacheHit && (
              <Text muted size={1} as="div" trim={true}>
                {t('vision.network.cache.hit-explained')}
              </Text>
            )}
            {resolved.isCdnBlockedByPerspective && (
              <CdnBlockedNotice
                perspectiveName={perspectiveName}
                testId="vision-network-cdn-blocked"
              />
            )}
          </Stack>
        </Box>
      </Flex>
    </Box>
  )
}
