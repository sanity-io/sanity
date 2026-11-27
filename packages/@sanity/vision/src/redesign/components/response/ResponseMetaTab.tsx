import {type SyncTag} from '@sanity/client'
import {CopyIcon} from '@sanity/icons/Copy'
import {Badge, Button, Stack, TextInput} from '@sanity/ui'
import {type CSSProperties, type ReactNode, useMemo} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Badge as Ui5Badge, Text, Box, Flex, Grid} from 'ui5'

import {useVisionTelemetry} from '../../../__telemetry__/useVisionTelemetry'
import {visionLocaleNamespace} from '../../../i18n'
import {formatDuration} from '../../../util/formatDuration'
import {isApiCdnHost} from '../../../util/parseQueryUrl'
import {encodedQuerySizeOfUrl, QUERY_URL_SIZE_LIMIT} from '../../../util/queryRequestMethod'
import {useCopyToClipboard} from '../../hooks/useCopyToClipboard'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {type SyncTagLookupSource, useSyncTagLookup} from '../../hooks/useSyncTagLookup'
import {type VisionResponseMeta} from '../../store/types'
import {regionOfShard} from '../../util/apiRegions'
import {API_CDN_DOCS_URL} from '../../util/docsUrls'
import {formatBytes} from '../../util/payloadSize'
import {formatSyncTagMeaning, MAX_SYNC_TAG_PROBES} from '../../util/syncTagLookup'
import {isWildcardSyncTag, sortSyncTags} from '../../util/syncTags'
import {browserLocation} from '../../util/timeZoneLocation'
import {CdnBlockedNotice} from '../CdnBlockedNotice'
import {HelpPopover} from '../HelpPopover'
import {VisionTooltip} from '../VisionTooltip'
import {NetworkGlobe} from './NetworkGlobe'
import * as styles from './syncTagsToggle.module.css'

const LABEL: CSSProperties = {whiteSpace: 'nowrap'}
/** Keeps the info button from making its row taller than the text next to it */
const INLINE_ICON: CSSProperties = {height: 0, display: 'flex', alignItems: 'center'}
/** Narrower than this, the details wrap below the globe */
const DETAILS_MIN_WIDTH: CSSProperties = {minWidth: 280}
/** Wraps the explanation instead of stretching the tooltip across the page */
const WILDCARD_TOOLTIP: CSSProperties = {maxWidth: 280}
const MUTED: CSSProperties = {color: 'var(--card-muted-fg-color)'}

/** A row of the grid, whose label sits on the baseline of the first line of its value */
function MetaRow({label, children}: {label: ReactNode; children: ReactNode}) {
  return (
    <>
      <Text
        data-testid="vision-response-meta-label"
        muted
        size={1}
        as="div"
        trim={true}
        style={LABEL}
      >
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
  /** Where the Sync tags row looks up what the tags stand for; absent while the setting is off */
  syncTagLookup?: SyncTagLookupSource
}

const NO_SYNC_TAGS: readonly SyncTag[] = []

/**
 * The response's sync tags. With the lookup on, the label is a button that switches between the
 * tags as they came and what they stand for; a tag the lookup could not find stays as it came.
 */
function SyncTagsRow(props: {
  meta: VisionResponseMeta | undefined
  lookup: SyncTagLookupSource | undefined
  notApplicable: string
}) {
  const {meta, lookup, notApplicable} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const tags = useMemo(() => (meta ? sortSyncTags(meta.syncTags) : NO_SYNC_TAGS), [meta])
  const {pressed, toggle, state} = useSyncTagLookup(lookup, tags)
  const label = t('vision.response.sync-tags')

  if (tags.length === 0) {
    return (
      <MetaRow label={label}>
        <Text muted size={1} as="div" trim={true}>
          {meta ? t('vision.response.sync-tags.none') : notApplicable}
        </Text>
      </MetaRow>
    )
  }

  const resolved = state.status === 'resolved' ? state.resolved : undefined
  const unresolvedCount = resolved ? tags.filter((tag) => !resolved.has(tag)).length : 0
  let note: ReactNode = null
  if (state.status === 'loading') note = t('vision.response.sync-tags.resolving')
  else if (state.status === 'failed') {
    note = t('vision.response.sync-tags.resolve-failed', {message: state.message})
  } else if (unresolvedCount > 0) {
    note = t('vision.response.sync-tags.partly-resolved', {
      count: unresolvedCount,
      total: tags.length,
    })
  }

  return (
    <MetaRow
      label={
        lookup ? (
          <VisionTooltip
            content={
              pressed
                ? t('vision.response.sync-tags.show-raw')
                : t('vision.response.sync-tags.show-resolved')
            }
          >
            <button
              aria-pressed={pressed}
              className={styles.toggle}
              data-testid="vision-meta-sync-tags-toggle"
              onClick={toggle}
              type="button"
            >
              {label}
            </button>
          </VisionTooltip>
        ) : (
          label
        )
      }
    >
      <Stack gap={2}>
        <Flex
          aria-busy={state.status === 'loading' || undefined}
          data-testid="vision-meta-sync-tags"
          flexWrap="wrap"
          gap={1}
        >
          {tags.map((tag) => {
            const meaning = resolved?.get(tag)
            const shown = meaning ? formatSyncTagMeaning(meaning) : tag
            // A tag that covers a whole dataset: this one, or another read through a reference
            let wholeDataset: string | undefined
            if (isWildcardSyncTag(shown) || isWildcardSyncTag(tag)) {
              wholeDataset = t('vision.response.sync-tags.wildcard')
            } else if (meaning?.kind === 'dataset') {
              wholeDataset = t('vision.response.sync-tags.other-dataset', {
                dataset: meaning.dataset,
              })
            }
            if (wholeDataset) {
              return (
                <VisionTooltip
                  content={
                    <Box style={WILDCARD_TOOLTIP}>
                      <Text size={1} as="div" trim={true}>
                        {wholeDataset}
                      </Text>
                    </Box>
                  }
                  key={tag}
                >
                  <Ui5Badge
                    data-resolved={resolved ? meaning !== undefined : undefined}
                    data-wildcard=""
                    tone="critical"
                  >
                    <Text size={0} as="span" trim={true}>
                      {shown}
                    </Text>
                  </Ui5Badge>
                </VisionTooltip>
              )
            }
            return (
              <Ui5Badge
                data-resolved={resolved ? meaning !== undefined : undefined}
                key={tag}
                title={
                  resolved
                    ? meaning
                      ? tag
                      : t('vision.response.sync-tags.unresolved', {budget: MAX_SYNC_TAG_PROBES})
                    : undefined
                }
                tone={meaning ? 'positive' : undefined}
              >
                <Text size={0} as="span" trim={true}>
                  {shown}
                </Text>
              </Ui5Badge>
            )
          })}
        </Flex>
        {note && (
          <Text
            data-testid="vision-meta-sync-tags-note"
            muted
            size={0}
            as="div"
            role="status"
            trim={true}
          >
            {note}
          </Text>
        )}
      </Stack>
    </MetaRow>
  )
}

/**
 * The shown response and how it travelled: its timing and size, which endpoint answered it,
 * whether from the CDN's cache, and where the query ran, on a globe from roughly where you are
 */
export function ResponseMetaTab(props: ResponseMetaTabProps) {
  const {meta, url, resolved, perspectiveName, syncTagLookup} = props
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
            <Grid
              alignItems="baseline"
              columnGap={4}
              data-testid="vision-response-meta-rows"
              gridTemplateColumns="max-content minmax(0, 1fr)"
              rowGap={3}
            >
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
                          <HelpPopover
                            content={t('vision.network.use-cdn-hint')}
                            docsUrl={API_CDN_DOCS_URL}
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
              <SyncTagsRow lookup={syncTagLookup} meta={meta} notApplicable={notApplicable} />
              {network?.traceId && (
                <MetaRow label={t('vision.network.trace')}>
                  <Text size={1} truncate={1} as="div" trim={true}>
                    <code>{network.traceId}</code>
                  </Text>
                </MetaRow>
              )}
              {url && (
                <MetaRow label={t('query.url')}>
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
                    <VisionTooltip content={t('action.copy-url-to-clipboard')}>
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
                    </VisionTooltip>
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
