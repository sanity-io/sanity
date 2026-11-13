import {Badge, Stack} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'
import {useTranslation} from 'sanity'
import {Text, Box, Flex, Grid} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {formatDuration} from '../../../util/formatDuration'
import {isApiCdnHost} from '../../../util/parseQueryUrl'
import {encodedQuerySizeOfUrl, QUERY_URL_SIZE_LIMIT} from '../../../util/queryRequestMethod'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type VisionResponseMeta} from '../../store/types'
import {regionOfShard} from '../../util/apiRegions'
import {type LocalAnswer, LOCAL_TIMING_PARTS} from '../../util/queryNetwork'
import {browserLocation} from '../../util/timeZoneLocation'
import {CdnBlockedNotice} from '../CdnBlockedNotice'
import {NetworkGlobe} from './NetworkGlobe'

function Row({label, children}: {label: string; children: ReactNode}) {
  return (
    <>
      <Text muted size={1} as="div" trim={true}>
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

/** `302841856` bytes as `289 MiB` */
function formatMebibytes(bytes: number): string {
  const mebibytes = bytes / 1024 / 1024
  return `${mebibytes >= 10 ? Math.round(mebibytes) : Math.round(mebibytes * 10) / 10} MiB`
}

/** The local copy's size: how many documents, in how much WebAssembly memory, as far as known */
function localCopyKey(
  local: LocalAnswer,
): {key: string; options: Record<string, unknown>} | undefined {
  const documents =
    local.documents === undefined ? undefined : new Intl.NumberFormat().format(local.documents)
  const memory = local.memoryBytes === undefined ? undefined : formatMebibytes(local.memoryBytes)
  if (documents && memory) {
    return {key: 'vision.network.region.local-copy', options: {documents, memory}}
  }
  if (documents) return {key: 'vision.network.region.local-copy-documents', options: {documents}}
  if (memory) return {key: 'vision.network.region.local-copy-memory', options: {memory}}
  return undefined
}

export interface NetworkTabProps {
  meta: VisionResponseMeta | undefined
  resolved: Pick<ResolvedRequest, 'useCdn' | 'isCdnBlockedByPerspective'>
  /** The tab's perspective as the perspective select names it, for why the CDN is not used */
  perspectiveName: string
}

/**
 * How the shown response travelled: which endpoint answered it, whether from the CDN's cache,
 * and where the query ran, on a globe from roughly where you are
 */
export function NetworkTab({meta, resolved, perspectiveName}: NetworkTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const you = useMemo(() => browserLocation(), [])
  const network = meta?.network
  const region = useMemo(() => regionOfShard(network?.shard), [network?.shard])

  if (!meta) {
    return (
      <Box padding={3}>
        <Text muted size={1} as="div" trim={true}>
          {t('vision.network.empty')}
        </Text>
      </Box>
    )
  }

  const viaCdn = network ? network.viaCdn : isCdnUrl(meta.url)
  // groq-store-wasm's service worker answered from the copy of the dataset on this device
  const local = network?.local
  const cacheHit = Boolean(network?.cacheHit)
  let cache = t('vision.network.cache.none')
  if (viaCdn) cache = cacheHit ? t('vision.network.cache.hit') : t('vision.network.cache.miss')
  if (local) cache = t('vision.network.cache.local')
  let endpoint = viaCdn ? t('vision.network.endpoint.cdn') : t('vision.network.endpoint.api')
  if (local) endpoint = t('vision.network.endpoint.service-worker')
  const hint =
    !local && !viaCdn && !resolved.useCdn && !resolved.isCdnBlockedByPerspective
      ? t('vision.network.use-cdn-hint')
      : undefined
  const localCopy = local ? localCopyKey(local) : undefined

  return (
    <Box data-testid="vision-network" padding={3}>
      <Flex alignItems="flex-start" flexWrap="wrap" gap={4}>
        <Stack gap={2}>
          <NetworkGlobe api={region} local={Boolean(local)} reachedApi={!cacheHit} you={you} />
          {/* For local answers the crab on the globe is you; it needs no label */}
          {!local && (
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
          )}
        </Stack>
        <Box flexBasis="0%" flexGrow={1} minWidth="0">
          <Stack gap={4}>
            <Grid gap={3} gridTemplateColumns="max-content minmax(0, 1fr)">
              <Row label={t('vision.network.endpoint')}>
                <Text
                  data-testid="vision-network-endpoint"
                  size={1}
                  weight="medium"
                  as="div"
                  trim={true}
                >
                  {endpoint}
                </Text>
              </Row>
              <Row label={t('vision.network.method')}>
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
              </Row>
              <Row label={t('vision.network.cache')}>
                <Stack gap={2}>
                  <Text data-testid="vision-network-cache" size={1} as="div" trim={true}>
                    {cache}
                  </Text>
                  {!local && network?.cacheControl && (
                    <Text muted size={0} as="div" trim={true}>
                      {`Cache-Control: ${network.cacheControl}`}
                    </Text>
                  )}
                </Stack>
              </Row>
              <Row label={t('vision.network.region')}>
                {local ? (
                  <Stack gap={2}>
                    <Text data-testid="vision-network-region" size={1} as="div" trim={true}>
                      {t('vision.network.region.local')}
                    </Text>
                    {localCopy && (
                      <Text
                        data-testid="vision-network-local-copy"
                        muted
                        size={0}
                        as="div"
                        trim={true}
                      >
                        {t(localCopy.key, localCopy.options)}
                      </Text>
                    )}
                  </Stack>
                ) : (
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
                )}
              </Row>
              <Row label={t('vision.network.timing')}>
                {local ? (
                  <Stack gap={2}>
                    <Text data-testid="vision-network-timing" size={1} as="div" trim={true}>
                      {t('vision.network.timing.local', {e2e: formatDuration(meta.e2eMs)})}
                    </Text>
                    {local.timings.map((timing) => (
                      <Box
                        key={timing.name}
                        paddingLeft={LOCAL_TIMING_PARTS.has(timing.name) ? 3 : 0}
                      >
                        <Text
                          data-testid={`vision-network-timing-${timing.name}`}
                          muted
                          size={0}
                          as="div"
                          trim={true}
                        >
                          {t('vision.network.timing.entry', {
                            label: timing.desc || timing.name,
                            ms: timing.dur,
                          })}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Text size={1} as="div" trim={true}>
                    {t('vision.network.timing.value', {
                      e2e: formatDuration(meta.e2eMs),
                      server: formatDuration(meta.ms),
                    })}
                  </Text>
                )}
              </Row>
              {!local && network?.traceId && (
                <Row label={t('vision.network.trace')}>
                  <Text size={1} truncate={1} as="div" trim={true}>
                    <code>{network.traceId}</code>
                  </Text>
                </Row>
              )}
            </Grid>
            {!local && cacheHit && (
              <Text muted size={1} as="div" trim={true}>
                {t('vision.network.cache.hit-explained')}
              </Text>
            )}
            {hint && (
              <Text data-testid="vision-network-hint" muted size={1} as="div" trim={true}>
                {hint}
              </Text>
            )}
            {!local && resolved.isCdnBlockedByPerspective && (
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
