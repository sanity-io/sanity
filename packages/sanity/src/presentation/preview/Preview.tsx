import {createConnectionMachine, createController} from '@sanity/comlink'
import {
  createCompatibilityActors,
  type VisualEditingControllerMsg,
  type VisualEditingNodeMsg,
} from '@sanity/presentation-comlink'
import {
  urlSearchParamPreviewPerspective,
  urlSearchParamPreviewVariant,
  urlSearchParamVercelProtectionBypass,
  urlSearchParamVercelSetBypassCookie,
  type VercelSetBypassCookieValue,
} from '@sanity/preview-url-secret/constants'
import {Card, Flex, Label, Spinner, Stack, Text, usePrefersReducedMotion} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import {AnimatePresence, motion, MotionConfig} from 'motion/react'
import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefAttributes,
} from 'react'
import {flushSync} from 'react-dom'
import {Translate, useTranslation} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {Button} from '../../ui-components/button/Button'
import {TooltipDelayGroupProvider} from '../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {ErrorCard} from '../components/ErrorCard'
import {presentationLocaleNamespace} from '../i18n'
import {type PresentationMachineRef} from '../machines/presentation-machine'
import {type PreviewUrlRef} from '../machines/preview-url'
import {
  type ConnectionStatus,
  type HeaderOptions,
  type PresentationPerspective,
  type PresentationViewport,
} from '../types'
import {useAllowPatterns} from '../useAllowPatterns'
import {usePresentationNavigate} from '../usePresentationNavigate'
import {usePresentationTool} from '../usePresentationTool'
import {encodeStudioPerspective} from '../util/encodeStudioPerspective'
import {IFrame} from './IFrame'
import {PreviewHeader} from './PreviewHeader'

const MotionFlex = motion.create(Flex)

/** @public */
export interface PreviewProps {
  canSharePreviewAccess: boolean
  canToggleSharePreviewAccess: boolean
  canUseSharedPreviewAccess: boolean
  header?: HeaderOptions
  initialUrl: URL
  loadersConnection: ConnectionStatus
  navigatorEnabled: boolean
  onPathChange: (nextPath: string) => void
  onRefresh: (fallback: () => void) => void
  openPopup: (url: string) => void
  overlaysConnection: ConnectionStatus
  presentationRef: PresentationMachineRef
  perspective: PresentationPerspective
  /**
   * The selected editing variant as a bare variant id, or `undefined` when no variant is selected
   */
  variant: string | undefined
  previewUrl?: string
  setViewport: (mode: 'desktop' | 'mobile') => void
  targetOrigin: string
  toggleNavigator?: () => void
  toggleOverlay: () => void
  viewport: PresentationViewport
  vercelProtectionBypass: string | null
  previewUrlRef: PreviewUrlRef
  handlesPerspectiveChange: boolean
  handlesVariantChange: boolean
}

export const Preview = memo(function PreviewComponent(
  props: PreviewProps & RefAttributes<HTMLIFrameElement>,
) {
  const {
    ref: forwardedRef,
    header,
    initialUrl,
    loadersConnection,
    overlaysConnection,
    perspective,
    variant,
    viewport,
    vercelProtectionBypass,
    presentationRef,
    previewUrlRef,
    handlesPerspectiveChange,
    handlesVariantChange,
  } = props

  const [stablePerspective, setStablePerspective] = useState<typeof perspective | null>(null)
  const urlPerspective = encodeStudioPerspective(
    stablePerspective === null ? perspective : stablePerspective,
  )
  /**
   * `null` means "not frozen yet" — distinct from `undefined`, which is a valid frozen value
   * meaning "no variant selected"
   */
  const [stableVariant, setStableVariant] = useState<string | undefined | null>(null)
  const urlVariant = stableVariant === null ? variant : stableVariant
  const previewUrl = useMemo(() => {
    const url = new URL(initialUrl)

    // Always set the perspective, even if it's provided in the initial URL.
    // The perspective can change over time, even in the brief time between the iframe starting to load,
    // and a comlink node connecting to the iframe and reporting whether perspective switching is handled by the preview,
    // or if perspective switching should reload the iframe.
    url.searchParams.set(urlSearchParamPreviewPerspective, urlPerspective)

    // Same for the editing variant, except the param is only present while a variant is selected
    if (urlVariant) {
      url.searchParams.set(urlSearchParamPreviewVariant, urlVariant)
    } else {
      url.searchParams.delete(urlSearchParamPreviewVariant)
    }

    if (vercelProtectionBypass || url.searchParams.get(urlSearchParamVercelProtectionBypass)) {
      // samesitenone is required since the request is from an iframe
      url.searchParams.set(
        urlSearchParamVercelSetBypassCookie,
        'samesitenone' satisfies VercelSetBypassCookieValue,
      )
    }
    // If there's a vercel protection bypass secret in the context, set it if none exists already
    if (vercelProtectionBypass && !url.searchParams.get(urlSearchParamVercelProtectionBypass)) {
      url.searchParams.set(urlSearchParamVercelProtectionBypass, vercelProtectionBypass)
    }

    return url
  }, [initialUrl, urlPerspective, urlVariant, vercelProtectionBypass])

  useEffect(() => {
    /**
     * Once we know the preview can handle perspective changes in-place — either because the iframe reported it
     * over comlink, or because a loader is connected (legacy fallback) — we capture the perspective that was used
     * to load the preview, so `src` on `iframe` no longer changes when the perspective changes. Otherwise the
     * iframe would do a full page reload, which is what we're trying to avoid unless absolutely necessary.
     */
    if (handlesPerspectiveChange) {
      /**
       * Only set the stable perspective if it hasn't been set yet.
       */
      // oxlint-disable-next-line react/react-compiler
      setStablePerspective((prev) => (prev === null ? perspective : prev))
    }
  }, [handlesPerspectiveChange, perspective])

  useEffect(() => {
    /**
     * Same freeze mechanism for the editing variant: once the preview can handle variant changes
     * in-place — reported over comlink, or implied by a connected loader — we stop reflecting
     * variant changes in `src` so they no longer cause a full page reload.
     */
    if (handlesVariantChange) {
      // oxlint-disable-next-line react/react-compiler
      setStableVariant((prev) => (prev === null ? variant : prev))
    }
  }, [handlesVariantChange, variant])

  const {t} = useTranslation(presentationLocaleNamespace)
  const {devMode} = usePresentationTool()
  const prefersReducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLIFrameElement | null>(null)

  const previewHeader = <PreviewHeader {...props} iframeRef={ref} options={header} />

  // Forward the iframe ref to the parent component
  useImperativeHandle<HTMLIFrameElement | null, HTMLIFrameElement | null>(
    forwardedRef,
    () => ref.current,
  )

  const isLoading = useSelector(
    presentationRef,
    (state) => state.matches('loading') || state.matches({loaded: 'reloading'}),
  )
  const isRefreshing = useSelector(presentationRef, (state) =>
    state.matches({loaded: 'refreshing'}),
  )
  /**
   * The presentation machine models the iframe load and overlays connection lifecycle — the load
   * timeout, the escalating overlays connection status, and "continue anyway" dismissals — so the
   * loading and error UI is derived from its state tags instead of ad-hoc timers.
   */
  const showLoadingOverlay = useSelector(presentationRef, (state) =>
    state.hasTag('show loading overlay'),
  )
  const showOverlaysConnectionStatus = useSelector(presentationRef, (state) =>
    state.hasTag('show overlays connection status'),
  )
  const overlaysConnectionTimedOut = useSelector(presentationRef, (state) =>
    state.hasTag('overlays connection timed out'),
  )
  const showErrorCard = useSelector(presentationRef, (state) => state.hasTag('show error card'))
  const preventIframeInteraction = useSelector(presentationRef, (state) =>
    state.hasTag('prevent iframe interaction'),
  )
  const iframeIsBusy = isLoading || isRefreshing || overlaysConnection === 'connecting'

  const handleContinueAnyway = useCallback(() => {
    presentationRef.send({type: 'continue anyway'})
  }, [presentationRef])

  const handleRetry = useCallback(() => {
    if (!ref.current) {
      return
    }

    ref.current.src = previewUrl.toString()

    presentationRef.send({type: 'iframe reload'})
  }, [presentationRef, previewUrl])

  const onIFrameLoad = useCallback(() => {
    presentationRef.send({type: 'iframe loaded'})
  }, [presentationRef])

  const canUseViewTransition = useSyncExternalStore(
    useCallback(() => () => {}, []),
    () => CSS.supports(`(view-transition-name: test)`),
  )
  const iframeAnimations = useMemo(() => {
    return [
      preventIframeInteraction ? 'background' : 'active',
      isLoading ? 'reloading' : 'idle',
      // If CSS View Transitions are supported, then transition iframe viewport dimensions with that instead of Motion
      canUseViewTransition ? '' : viewport,
      showOverlaysConnectionStatus ? 'timedOut' : '',
    ]
  }, [
    canUseViewTransition,
    isLoading,
    preventIframeInteraction,
    showOverlaysConnectionStatus,
    viewport,
  ])

  const [currentViewport, setCurrentViewport] = useState(viewport)
  const [iframeStyle, setIframeStyle] = useState(iframeVariants[viewport])
  useEffect(() => {
    if (canUseViewTransition && viewport !== currentViewport) {
      const update = () => {
        setCurrentViewport(viewport)
        setIframeStyle(iframeVariants[viewport])
      }
      if (
        !prefersReducedMotion &&
        'startViewTransition' in document &&
        typeof document.startViewTransition === 'function'
      ) {
        document.startViewTransition({
          update: () => flushSync(() => update()),
          types: ['sanity-iframe-viewport'],
        })
      } else {
        update()
      }
    }
  }, [canUseViewTransition, prefersReducedMotion, currentViewport, viewport])

  const toast = useToast()
  const allowOrigins = useAllowPatterns(previewUrlRef)
  const [checkOrigin, setCheckOrigin] = useState<false | string>(false)
  const [reportedMismatches] = useState(new Set<string>())
  const reportMismatchingOrigin = useEffectEvent((reportedOrigin: string) => {
    if (allowOrigins.some((allow) => allow.test(reportedOrigin))) {
      setCheckOrigin(reportedOrigin)
      return
    }
    if (reportedMismatches.has(reportedOrigin)) return
    reportedMismatches.add(reportedOrigin)
    console.warn('Visual Editing is here but misconfigured', {reportedOrigin})
    toast.push({
      closable: true,
      id: `presentation-iframe-origin-mismatch-${reportedOrigin}`,
      status: 'error',
      duration: Infinity,
      title: t('preview-frame.configuration.error.title'),
      description: (
        <Translate
          t={t}
          i18nKey="preview-frame.configuration.error.description"
          components={{Code: 'code'}}
          values={{
            targetOrigin: previewUrl.origin,
            reportedOrigin,
          }}
        />
      ),
    })
  })
  const navigate = usePresentationNavigate()
  const navigateEvent = useEffectEvent((url: string) => {
    if (!checkOrigin) return
    const nextUrl = new URL(url, checkOrigin)
    navigate(`${checkOrigin}${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`)
  })
  useEffect(() => {
    if (!checkOrigin) {
      return undefined
    }
    const target = ref.current?.contentWindow
    if (!target) {
      return undefined
    }
    const controller = createController({targetOrigin: checkOrigin})
    controller.addTarget(target)
    const comlink = controller.createChannel<VisualEditingControllerMsg, VisualEditingNodeMsg>(
      {
        name: 'presentation',
        heartbeat: true,
        connectTo: 'visual-editing',
      },
      createConnectionMachine<VisualEditingControllerMsg, VisualEditingNodeMsg>().provide({
        actors: createCompatibilityActors<VisualEditingControllerMsg>(),
      }),
    )

    comlink.on('visual-editing/navigate', (data) => {
      navigateEvent(data.url)
    })
    const stop = comlink.start()

    return () => {
      stop()
      controller.destroy()
    }
  }, [checkOrigin])
  useEffect(() => {
    if (overlaysConnection === 'connecting' || overlaysConnection === 'reconnecting') {
      const interval = setInterval(() => {
        ref.current?.contentWindow?.postMessage(
          {domain: 'sanity/channels', from: 'presentation', type: 'presentation/status'},
          /**
           * The targetOrigin is set to '*' intentionally here, as we need to find out if the iframe is misconfigured and has the wrong origin
           */
          '*',
        )
      }, 1_000)

      const controller = new AbortController()
      window.addEventListener(
        'message',
        ({data}: MessageEvent<unknown>) => {
          /**
           * Listen for replies to presentation/status
           */
          if (
            data &&
            typeof data === 'object' &&
            'domain' in data &&
            data.domain === 'sanity/channels' &&
            'type' in data &&
            data.type === 'visual-editing/status' &&
            'data' in data &&
            typeof data.data === 'object' &&
            data.data &&
            'origin' in data.data &&
            typeof data.data.origin === 'string'
          ) {
            reportMismatchingOrigin(data.data.origin)
          }
        },
        {signal: controller.signal},
      )

      return () => {
        controller.abort()
        clearInterval(interval)
      }
    }
    return undefined
  }, [overlaysConnection])

  return (
    <MotionConfig transition={prefersReducedMotion ? {duration: 0} : undefined}>
      <TooltipDelayGroupProvider>
        {previewHeader}
        <Card flex={1} tone="transparent">
          <Flex
            align="center"
            height="fill"
            justify="center"
            padding={(canUseViewTransition ? currentViewport : viewport) === 'desktop' ? 0 : 2}
            sizing="border"
            style={{
              position: 'relative',
              cursor: iframeIsBusy ? 'wait' : undefined,
            }}
          >
            <AnimatePresence>
              {showOverlaysConnectionStatus ? (
                <MotionFlex
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={spinnerVariants}
                  justify="center"
                  align="center"
                  style={{
                    inset: '0',
                    position: 'absolute',
                    backdropFilter: overlaysConnectionTimedOut
                      ? 'blur(16px) saturate(0.5) grayscale(0.5)'
                      : 'blur(2px)',
                    ['transition' as string]: 'backdrop-filter 0.2s ease-in-out',
                    // @TODO Because of Safari we have to do this
                    WebkitBackdropFilter: overlaysConnectionTimedOut
                      ? 'blur(16px) saturate(0.5) grayscale(0.5)'
                      : 'blur(2px)',
                    WebkitTransition: '-webkit-backdrop-filter 0.2s ease-in-out',
                    zIndex: 1,
                  }}
                >
                  <Flex
                    style={{...sizes[viewport]}}
                    justify="center"
                    align="center"
                    direction="column"
                    gap={4}
                  >
                    {overlaysConnectionTimedOut && (
                      <Button
                        disabled
                        mode="ghost"
                        text={t('preview-frame.continue-button.text')}
                        style={{opacity: 0}}
                      />
                    )}
                    <Card
                      radius={2}
                      tone={overlaysConnectionTimedOut ? 'caution' : 'inherit'}
                      padding={4}
                      shadow={1}
                    >
                      <Flex justify="center" align="center" direction="column" gap={4}>
                        <Spinner muted />
                        <Text muted size={1}>
                          {overlaysConnectionTimedOut
                            ? t('preview-frame.status', {context: 'timeout'})
                            : t('preview-frame.status', {context: 'connecting'})}
                        </Text>
                      </Flex>
                    </Card>
                    {overlaysConnectionTimedOut && (
                      <Button
                        // mode="ghost"
                        tone="critical"
                        onClick={handleContinueAnyway}
                        text={t('preview-frame.continue-button.text')}
                      />
                    )}
                  </Flex>
                </MotionFlex>
              ) : showLoadingOverlay ? (
                <MotionFlex
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={spinnerVariants}
                  justify="center"
                  align="center"
                  style={{
                    inset: '0',
                    position: 'absolute',
                    // boxShadow: '0 0 0 1px var(--card-shadow-outline-color)',
                  }}
                >
                  <Flex
                    style={{...sizes[viewport]}}
                    justify="center"
                    align="center"
                    direction="column"
                    gap={4}
                  >
                    <Spinner muted />
                    <Text muted size={1}>
                      {t('preview-frame.status', {context: 'loading'})}
                    </Text>
                  </Flex>
                </MotionFlex>
              ) : showErrorCard ? (
                <MotionFlex
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={errorVariants}
                  justify="center"
                  align="center"
                  style={{
                    background: 'var(--card-bg-color)',
                    inset: '0',
                    position: 'absolute',
                    // Stay above the click-prevention overlay so "Retry" stays clickable while
                    // the iframe is still considered busy (e.g. a load that never finishes)
                    zIndex: 1,
                  }}
                >
                  <ErrorCard
                    flex={1}
                    message={t('preview-frame.connection.error.text')}
                    onRetry={handleRetry}
                    onContinueAnyway={handleContinueAnyway}
                  >
                    {devMode && (
                      <>
                        {overlaysConnection !== 'connected' && (
                          <Card padding={3} radius={2} tone="critical">
                            <Stack gap={3}>
                              <Label muted size={0}>
                                {t('preview-frame.overlay.connection-status.label')}
                              </Label>
                              <Code size={1}>
                                {t('channel.status', {context: overlaysConnection})}
                              </Code>
                            </Stack>
                          </Card>
                        )}

                        {loadersConnection !== 'connected' && (
                          <Card padding={3} radius={2} tone="critical">
                            <Stack gap={3}>
                              <Label muted size={0}>
                                {t('preview-frame.loader.connection-status.label')}
                              </Label>
                              <Code size={1}>
                                {t('channel.status', {context: loadersConnection})}
                              </Code>
                            </Stack>
                          </Card>
                        )}
                      </>
                    )}
                  </ErrorCard>
                </MotionFlex>
              ) : null}
            </AnimatePresence>
            <IFrame
              animate={iframeAnimations}
              initial={['background']}
              onLoad={onIFrameLoad}
              preventClick={preventIframeInteraction}
              ref={ref}
              src={previewUrl.toString()}
              style={iframeStyle}
              variants={iframeVariants}
            />
          </Flex>
        </Card>
      </TooltipDelayGroupProvider>
    </MotionConfig>
  )
})
Preview.displayName = 'Memo(Preview)'

const sizes = {
  desktop: {
    width: '100%',
    height: '100%',
  },
  mobile: {
    width: 375,
    height: 650,
  },
}

const spinnerVariants = {
  initial: {opacity: 1},
  animate: {opacity: [0, 0, 1]},
  exit: {opacity: [1, 0, 0]},
}

const errorVariants = {
  initial: {opacity: 1},
  animate: {opacity: [0, 0, 1]},
  exit: {opacity: [1, 0, 0]},
}

const iframeVariants = {
  desktop: {
    ...sizes.desktop,
    boxShadow: '0 0 0 0px var(--card-border-color)',
  },
  mobile: {
    ...sizes.mobile,
    boxShadow: '0 0 0 1px var(--card-border-color)',
  },
  background: {
    opacity: 0,
    scale: 1,
  },
  idle: {
    scale: 1,
  },
  reloading: {
    scale: [1, 1, 1, 0.98],
  },
  active: {
    opacity: [0, 0, 1],
    scale: 1,
  },
  timedOut: {
    opacity: [0, 0, 1],
  },
}
