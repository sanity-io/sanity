import {Badge, Stack, Text} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex, Grid} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {isApiCdnHost} from '../../../util/parseQueryUrl'
import {encodedQuerySizeOfUrl, QUERY_URL_SIZE_LIMIT} from '../../../util/queryRequestMethod'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type VistaResponseMeta} from '../../store/types'
import {regionOfShard} from '../../util/apiRegions'
import {browserLocation} from '../../util/timeZoneLocation'
import {CdnBlockedNotice} from '../CdnBlockedNotice'
import {NetworkGlobe} from './NetworkGlobe'

function Row({label, children}: {label: string; children: ReactNode}) {
  return (
    <>
      <Text muted size={1}>
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

export interface NetworkTabProps {
  meta: VistaResponseMeta | undefined
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
        <Text muted size={1}>
          {t('vista.network.empty')}
        </Text>
      </Box>
    )
  }

  const viaCdn = network ? network.viaCdn : isCdnUrl(meta.url)
  const cacheHit = Boolean(network?.cacheHit)
  let cache = t('vista.network.cache.none')
  if (viaCdn) cache = cacheHit ? t('vista.network.cache.hit') : t('vista.network.cache.miss')
  const hint =
    !viaCdn && !resolved.useCdn && !resolved.isCdnBlockedByPerspective
      ? t('vista.network.use-cdn-hint')
      : undefined

  return (
    <Box data-testid="vista-network" padding={3}>
      <Flex alignItems="flex-start" flexWrap="wrap" gap={4}>
        <Stack gap={2}>
          <NetworkGlobe api={region} reachedApi={!cacheHit} you={you} />
          <Flex alignItems="center" gap={2} justifyContent="center">
            <Badge fontSize={0} tone="primary">
              {t('vista.network.you')}
            </Badge>
            {region && (
              <Badge fontSize={0} tone="caution">
                {region.id}
              </Badge>
            )}
          </Flex>
        </Stack>
        <Box flexBasis="0%" flexGrow={1} minWidth="0">
          <Stack gap={4}>
            <Grid gap={3} gridTemplateColumns="max-content minmax(0, 1fr)">
              <Row label={t('vista.network.endpoint')}>
                <Text data-testid="vista-network-endpoint" size={1} weight="medium">
                  {viaCdn ? t('vista.network.endpoint.cdn') : t('vista.network.endpoint.api')}
                </Text>
              </Row>
              <Row label={t('vista.network.method')}>
                <Stack gap={2}>
                  <Text data-testid="vista-network-method" size={1}>
                    {meta.method === 'POST'
                      ? t('vista.network.method.post')
                      : t('vista.network.method.get')}
                  </Text>
                  {meta.method === 'POST' && (
                    <Text data-testid="vista-network-method-explained" muted size={0}>
                      {t('vista.network.method.post-explained', {
                        size: encodedQuerySizeOfUrl(meta.url),
                        limit: QUERY_URL_SIZE_LIMIT,
                      })}
                    </Text>
                  )}
                </Stack>
              </Row>
              <Row label={t('vista.network.cache')}>
                <Stack gap={2}>
                  <Text data-testid="vista-network-cache" size={1}>
                    {cache}
                  </Text>
                  {network?.cacheControl && (
                    <Text muted size={0}>
                      {`Cache-Control: ${network.cacheControl}`}
                    </Text>
                  )}
                </Stack>
              </Row>
              <Row label={t('vista.network.region')}>
                <Stack gap={2}>
                  <Text data-testid="vista-network-region" size={1}>
                    {region
                      ? `${region.id} (${region.location})`
                      : (network?.shard ?? t('vista.network.region.unknown'))}
                  </Text>
                  {region && network?.shard && (
                    <Text muted size={0}>
                      {network.shard}
                    </Text>
                  )}
                </Stack>
              </Row>
              <Row label={t('vista.network.timing')}>
                <Text size={1}>
                  {t('vista.network.timing.value', {e2e: meta.e2eMs, server: meta.ms})}
                </Text>
              </Row>
              {network?.traceId && (
                <Row label={t('vista.network.trace')}>
                  <Text size={1} textOverflow="ellipsis">
                    <code>{network.traceId}</code>
                  </Text>
                </Row>
              )}
            </Grid>
            {cacheHit && (
              <Text muted size={1}>
                {t('vista.network.cache.hit-explained')}
              </Text>
            )}
            {hint && (
              <Text data-testid="vista-network-hint" muted size={1}>
                {hint}
              </Text>
            )}
            {resolved.isCdnBlockedByPerspective && (
              <CdnBlockedNotice
                perspectiveName={perspectiveName}
                testId="vista-network-cdn-blocked"
              />
            )}
          </Stack>
        </Box>
      </Flex>
    </Box>
  )
}
