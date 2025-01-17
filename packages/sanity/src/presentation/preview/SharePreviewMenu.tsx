/* eslint-disable @typescript-eslint/no-shadow,no-negated-condition,no-nested-ternary */
import {type ClientPerspective, type SyncTag} from '@sanity/client'
import {CopyIcon, ShareIcon} from '@sanity/icons'
import {SanityMonogram} from '@sanity/logos'
import {fetchSharedAccessQuery} from '@sanity/preview-url-secret/constants'
import {
  disablePreviewAccessSharing,
  enablePreviewAccessSharing,
} from '@sanity/preview-url-secret/toggle-preview-access-sharing'
import {setSecretSearchParams} from '@sanity/preview-url-secret/without-secret-search-params'
import {
  Box,
  Card,
  Grid,
  Menu,
  MenuDivider,
  Spinner,
  Stack,
  Switch,
  Text,
  useToast,
} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {lazy, memo, Suspense, useCallback, useEffect, useMemo, useState} from 'react'
import {useClient, useCurrentUser, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Button, MenuButton, MenuItem, Tooltip} from '../../ui-components'
import {API_VERSION} from '../constants'
import {presentationLocaleNamespace} from '../i18n'
import {encodeStudioPerspective} from '../util/encodeStudioPerspective'
import {type PreviewProps} from './Preview'

const QRCodeSVG = lazy(() => import('./QRCodeSVG'))

export interface SharePreviewMenuProps {
  canToggleSharePreviewAccess: boolean
  canUseSharedPreviewAccess: boolean
  previewLocationRoute: string
  initialUrl: PreviewProps['initialUrl']
  perspective: ClientPerspective
}

const QrCodeLogoSize = 24
const QrCodeLogoPadding = 16
const QrSize = 224

const StyledSanityMonogram = styled(SanityMonogram)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  height: ${QrCodeLogoSize}px;
  width: ${QrCodeLogoSize}px;
`

const MotionSpinner = motion.create(Spinner)
const MotionText = motion.create(Text)
const MotionMonogram = motion.create(StyledSanityMonogram)

export const SharePreviewMenu = memo(function SharePreviewMenuComponent(
  props: SharePreviewMenuProps,
) {
  const {
    canToggleSharePreviewAccess,
    canUseSharedPreviewAccess,
    initialUrl,
    previewLocationRoute,
    perspective,
  } = props
  const {t} = useTranslation(presentationLocaleNamespace)
  const {push: pushToast} = useToast()
  const client = useClient({apiVersion: API_VERSION})
  const currentUser = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [enabling, setEnabling] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const busy = enabling || disabling || loading
  const url = useMemo(
    () =>
      secret
        ? setSecretSearchParams(
            initialUrl,
            secret,
            previewLocationRoute,
            encodeStudioPerspective(perspective),
          )
        : null,
    [initialUrl, perspective, previewLocationRoute, secret],
  )

  const [error, setError] = useState<unknown>(null)
  if (error) {
    throw error
  }

  const handleUnableToToggle = useCallback(() => {
    pushToast({
      closable: true,
      status: 'warning',
      title: t('share-preview-menu.error_toggle-sharing', {context: 'toggle-sharing'}),
    })
  }, [pushToast, t])

  const handleDisableSharing = useCallback(async () => {
    try {
      setDisabling(true)
      await disablePreviewAccessSharing(
        client,
        '@sanity/presentation',
        typeof window === 'undefined' ? '' : location.href,
        currentUser?.id,
      )
      setSecret(null)
    } catch (error) {
      setError(error)
    } finally {
      setDisabling(false)
    }
  }, [client, currentUser?.id])
  const handleEnableSharing = useCallback(async () => {
    try {
      setEnabling(true)

      const previewUrlSecret = await enablePreviewAccessSharing(
        client,
        '@sanity/presentation',
        typeof window === 'undefined' ? '' : location.href,
        currentUser?.id,
      )
      setSecret(previewUrlSecret.secret)
    } catch (error) {
      setError(error)
    } finally {
      setEnabling(false)
    }
  }, [client, currentUser?.id])

  const handleCopyUrl = useCallback(() => {
    try {
      if (!url) {
        throw new Error('No URL to copy')
      }
      navigator.clipboard.writeText(url.toString())
      pushToast({
        closable: true,
        status: 'success',
        title: t('share-url.clipboard.status', {context: 'success'}),
      })
    } catch (error) {
      setError(error)
    }
  }, [pushToast, t, url])

  useEffect(() => {
    let controller = new AbortController()
    let usedTags: SyncTag[] = []
    async function fetchShareSecret(lastLiveEventId: string | null, signal: AbortSignal) {
      const {result, syncTags} = await client.fetch<string | null>(
        fetchSharedAccessQuery,
        {},
        {filterResponse: false, lastLiveEventId, tag: 'presentation.fetch-shared-access-secret'},
      )
      if (Array.isArray(syncTags)) {
        usedTags = syncTags
      }
      if (!signal.aborted) {
        setSecret(result)
      }
    }
    const subscription = client.live.events().subscribe({
      next: (event) => {
        if (event.type === 'message') {
          controller.abort()
          controller = new AbortController()
          if (event.tags.some((tag) => usedTags.includes(tag))) {
            fetchShareSecret(event.id, controller.signal)
          }
        }
      },
      error: setError,
    })

    fetchShareSecret(null, controller.signal).finally(() => setLoading(false))

    return () => {
      subscription.unsubscribe()
      controller.abort()
    }
  }, [client])

  return (
    <MenuButton
      button={
        <Button
          aria-label={t('preview-frame.share-button.aria-label')}
          icon={ShareIcon}
          mode="bleed"
          tooltipProps={null}
        />
      }
      id="share-menu"
      menu={
        <Menu style={{maxWidth: 248}} padding={canUseSharedPreviewAccess ? undefined : 0}>
          {canUseSharedPreviewAccess ? (
            <>
              <label style={{cursor: 'pointer'}}>
                <Grid
                  columns={2}
                  rows={2}
                  gapX={3}
                  gapY={1}
                  style={{
                    justifyContent: 'center',
                    alignItems: 'center',
                    gridTemplateColumns: 'min-content 1fr',
                    gridTemplateRows: 'min-content',
                  }}
                  paddingTop={3}
                  paddingX={3}
                >
                  <Tooltip
                    animate
                    content={
                      <Text size={1}>
                        {t('share-preview-menu.toggle-button.tooltip', {
                          context: url ? 'disable' : 'enable',
                        })}
                      </Text>
                    }
                    fallbackPlacements={['bottom-start']}
                    placement="bottom"
                    portal
                  >
                    <Switch
                      checked={enabling || (url !== null && !disabling)}
                      readOnly={enabling || disabling}
                      indeterminate={loading}
                      onChange={
                        !canToggleSharePreviewAccess
                          ? handleUnableToToggle
                          : url
                            ? handleDisableSharing
                            : handleEnableSharing
                      }
                    />
                  </Tooltip>
                  <Text size={1} weight="medium">
                    {t('share-preview-menu.toggle-button.label', {context: 'first-line'})}
                  </Text>
                  <span />
                  <Text muted size={1}>
                    {t('share-preview-menu.toggle-button.label', {context: 'second-line'})}
                  </Text>
                </Grid>
              </label>
              <Box padding={3} paddingTop={2}>
                <Stack space={3}>
                  <Card
                    tone={busy || !url ? 'transparent' : undefined}
                    style={{
                      position: 'relative',
                      aspectRatio: '1 / 1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AnimatePresence>
                      {busy ? (
                        <MotionSpinner
                          muted
                          initial={{opacity: 0}}
                          animate={{opacity: 1}}
                          exit={{opacity: 0}}
                        />
                      ) : url ? (
                        <>
                          <Suspense fallback={<Spinner />}>
                            <QRCodeSVG
                              title={t('share-preview-menu.qr-code.title', {url: url.toString()})}
                              value={url.toString()}
                              size={QrSize}
                              color="var(--card-fg-color)"
                              logoSize={QrCodeLogoSize + QrCodeLogoPadding}
                            />
                            <MotionMonogram
                              initial={{opacity: -0.5}}
                              animate={{opacity: 1.5}}
                              exit={{opacity: 0}}
                            />
                          </Suspense>
                        </>
                      ) : (
                        <MotionText
                          muted
                          size={1}
                          style={{maxWidth: '100px', textWrap: 'pretty', textAlign: 'center'}}
                          initial={{opacity: 0}}
                          animate={{opacity: 1}}
                          exit={{opacity: 0}}
                        >
                          {t('share-preview-menu.qr-code.placeholder')}
                        </MotionText>
                      )}
                    </AnimatePresence>
                  </Card>
                  <Text muted size={1}>
                    {t('share-preview-menu.qr-code.instructions')}
                  </Text>
                </Stack>
              </Box>
              <MenuDivider />
              <MenuItem
                disabled={!url || disabling}
                icon={CopyIcon}
                onClick={handleCopyUrl}
                text={t('share-preview-menu.copy-url.text')}
              />
            </>
          ) : (
            <Card padding={2} tone="caution" radius={3}>
              <Text style={{textWrap: 'pretty'}}>
                {t('share-preview-menu.error', {context: 'missing-grants'})}
              </Text>
            </Card>
          )}
        </Menu>
      }
      popover={{
        constrainSize: true,
        placement: 'bottom',
        portal: true,
      }}
    />
  )
})
SharePreviewMenu.displayName = 'Memo(SharePreviewMenu)'
