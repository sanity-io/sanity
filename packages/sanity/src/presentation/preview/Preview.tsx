/* eslint-disable react/no-unused-prop-types,no-nested-ternary */
import {
  urlSearchParamPreviewPerspective,
  urlSearchParamVercelProtectionBypass,
  urlSearchParamVercelSetBypassCookie,
  type VercelSetBypassCookieValue,
} from '@sanity/preview-url-secret/constants'
import {Card, Code, Flex, Label, Spinner, Stack, Text, usePrefersReducedMotion} from '@sanity/ui'
import {AnimatePresence, motion, MotionConfig} from 'framer-motion'
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {flushSync} from 'react-dom'
import {useTranslation} from 'sanity'

import {Button, TooltipDelayGroupProvider} from '../../ui-components'
import {ErrorCard} from '../components/ErrorCard'
import {MAX_TIME_TO_OVERLAYS_CONNECTION} from '../constants'
import {presentationLocaleNamespace} from '../i18n'
import {
  ACTION_IFRAME_LOADED,
  ACTION_IFRAME_RELOAD,
  type DispatchPresentationAction,
  type PresentationState,
} from '../reducers/presentationReducer'
import {
  type ConnectionStatus,
  type HeaderOptions,
  type PresentationPerspective,
  type PresentationViewport,
} from '../types'
import {usePresentationTool} from '../usePresentationTool'
import {encodeStudioPerspective} from '../util/encodeStudioPerspective'
import {IFrame} from './IFrame'
import {PreviewHeader} from './PreviewHeader'

const MotionFlex = motion.create(Flex)

/** @public */
export interface PreviewProps extends Pick<PresentationState, 'iframe' | 'visualEditing'> {
  canSharePreviewAccess: boolean
  canToggleSharePreviewAccess: boolean
  canUseSharedPreviewAccess: boolean
  dispatch: DispatchPresentationAction
  header?: HeaderOptions
  initialUrl: URL
  loadersConnection: ConnectionStatus
  navigatorEnabled: boolean
  onPathChange: (nextPath: string) => void
  onRefresh: (fallback: () => void) => void
  openPopup: (url: string) => void
  overlaysConnection: ConnectionStatus
  perspective: PresentationPerspective
  previewUrl?: string
  setViewport: (mode: 'desktop' | 'mobile') => void
  targetOrigin: string
  toggleNavigator?: () => void
  toggleOverlay: () => void
  viewport: PresentationViewport
  vercelProtectionBypass: string | null
}

export const Preview = memo(
  forwardRef<HTMLIFrameElement, PreviewProps>(function PreviewComponent(props, forwardedRef) {
    const {
      dispatch,
      iframe,
      header,
      initialUrl,
      loadersConnection,
      overlaysConnection,
      perspective,
      viewport,
      vercelProtectionBypass,
    } = props

    const [stablePerspective, setStablePerspective] = useState<typeof perspective | null>(null)
    const urlPerspective = encodeStudioPerspective(
      stablePerspective === null ? perspective : stablePerspective,
    )
    const previewUrl = useMemo(() => {
      const url = new URL(initialUrl)
      // Always set the perspective that's being used, even if preview mode isn't configured
      if (!url.searchParams.get(urlSearchParamPreviewPerspective)) {
        url.searchParams.set(urlSearchParamPreviewPerspective, urlPerspective)
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
    }, [initialUrl, urlPerspective, vercelProtectionBypass])

    useEffect(() => {
      /**
       * If the preview iframe is connected to the loader, we know that switching the perspective can be done without reloading the iframe.
       */
      if (loadersConnection === 'connected') {
        /**
         * Only set the stable perspective if it hasn't been set yet.
         */
        setStablePerspective((prev) => (prev === null ? perspective : prev))
      }
    }, [loadersConnection, perspective])

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

    const loading = iframe.status === 'loading' || iframe.status === 'reloading'
    const [timedOut, setTimedOut] = useState(false)
    const refreshing = iframe.status === 'refreshing'
    const [somethingIsWrong, setSomethingIsWrong] = useState(false)
    const iframeIsBusy = loading || refreshing || overlaysConnection === 'connecting'

    const handleRetry = useCallback(() => {
      if (!ref.current) {
        return
      }

      ref.current.src = previewUrl.toString()

      dispatch({type: ACTION_IFRAME_RELOAD})
    }, [dispatch, previewUrl])
    const handleContinueAnyway = useCallback(() => {
      setContinueAnyway(true)
    }, [])

    const [continueAnyway, setContinueAnyway] = useState(false)
    const [showOverlaysConnectionStatus, setShowOverlaysConnectionState] = useState(false)
    useEffect(() => {
      if (loading || refreshing) {
        return undefined
      }

      if (overlaysConnection === 'connecting' || overlaysConnection === 'reconnecting') {
        const timeout = setTimeout(() => {
          setShowOverlaysConnectionState(true)
        }, 5_000)
        return () => clearTimeout(timeout)
      }
      return undefined
    }, [overlaysConnection, loading, refreshing])

    useEffect(() => {
      if (loading || refreshing || !showOverlaysConnectionStatus) {
        return undefined
      }
      if (overlaysConnection === 'connected') {
        setSomethingIsWrong(false)
        setShowOverlaysConnectionState(false)
        setTimedOut(false)
        setContinueAnyway(false)
      }
      if (overlaysConnection === 'connecting') {
        const timeout = setTimeout(() => {
          setTimedOut(true)
          // eslint-disable-next-line no-console
          console.error(
            `Unable to connect to visual editing. Make sure you've setup '@sanity/visual-editing' correctly`,
          )
        }, MAX_TIME_TO_OVERLAYS_CONNECTION)
        return () => clearTimeout(timeout)
      }
      if (overlaysConnection === 'reconnecting') {
        const timeout = setTimeout(() => {
          setTimedOut(true)
          setSomethingIsWrong(true)
        }, MAX_TIME_TO_OVERLAYS_CONNECTION)
        return () => clearTimeout(timeout)
      }
      return undefined
    }, [loading, overlaysConnection, refreshing, showOverlaysConnectionStatus])

    const onIFrameLoad = useCallback(() => {
      dispatch({type: ACTION_IFRAME_LOADED})
    }, [dispatch])

    /**
     * Ensure that clicking outside of menus and dialogs will close as focus shifts to the iframe
     */
    useEffect(() => {
      if (!ref.current) {
        return undefined
      }
      const instance = ref.current
      function handleBlur() {
        if (instance !== document.activeElement) {
          return
        }

        instance.dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true}))
      }
      window.addEventListener('blur', handleBlur)
      return () => {
        window.removeEventListener('blur', handleBlur)
      }
    }, [])

    const preventIframeInteraction = useMemo(() => {
      return (
        (loading || (overlaysConnection === 'connecting' && iframe.status !== 'refreshing')) &&
        !continueAnyway
      )
    }, [continueAnyway, iframe.status, loading, overlaysConnection])

    const canUseViewTransition = useSyncExternalStore(
      // eslint-disable-next-line no-empty-function
      useCallback(() => () => {}, []),
      () => CSS.supports(`(view-transition-name: test)`),
    )
    const iframeAnimations = useMemo(() => {
      return [
        preventIframeInteraction ? 'background' : 'active',
        loading ? 'reloading' : 'idle',
        // If CSS View Transitions are supported, then transition iframe viewport dimensions with that instead of Motion
        canUseViewTransition ? '' : viewport,
        showOverlaysConnectionStatus && !continueAnyway ? 'timedOut' : '',
      ]
    }, [
      canUseViewTransition,
      continueAnyway,
      loading,
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
          document.startViewTransition(() => flushSync(() => update()))
        } else {
          update()
        }
      }
    }, [canUseViewTransition, prefersReducedMotion, currentViewport, viewport])

    return (
      <MotionConfig transition={prefersReducedMotion ? {duration: 0} : undefined}>
        <TooltipDelayGroupProvider>
          {previewHeader}

          {/* @TODO: Move this to <PreviewFrame /> */}
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
                {!somethingIsWrong &&
                !loading &&
                !refreshing &&
                // viewport, // using CSS View Transitions instead of framer motion to drive this
                showOverlaysConnectionStatus &&
                !continueAnyway ? (
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
                      backdropFilter: timedOut
                        ? 'blur(16px) saturate(0.5) grayscale(0.5)'
                        : 'blur(2px)',
                      ['transition' as string]: 'backdrop-filter 0.2s ease-in-out',
                      // @TODO Because of Safari we have to do this
                      WebkitBackdropFilter: timedOut
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
                      {timedOut && (
                        <Button
                          disabled
                          mode="ghost"
                          text={t('preview-frame.continue-button.text')}
                          style={{opacity: 0}}
                        />
                      )}
                      <Card
                        radius={2}
                        tone={timedOut ? 'caution' : 'inherit'}
                        padding={4}
                        shadow={1}
                      >
                        <Flex justify="center" align="center" direction="column" gap={4}>
                          <Spinner muted />
                          <Text muted size={1}>
                            {timedOut
                              ? t('preview-frame.status', {context: 'timeout'})
                              : t('preview-frame.status', {context: 'connecting'})}
                          </Text>
                        </Flex>
                      </Card>
                      {timedOut && (
                        <Button
                          // mode="ghost"
                          tone="critical"
                          onClick={handleContinueAnyway}
                          text={t('preview-frame.continue-button.text')}
                        />
                      )}
                    </Flex>
                  </MotionFlex>
                ) : (loading ||
                    (overlaysConnection === 'connecting' && iframe.status !== 'refreshing')) &&
                  !continueAnyway ? (
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
                ) : somethingIsWrong && !continueAnyway ? (
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
                              <Stack space={3}>
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
                              <Stack space={3}>
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
  }),
)
Preview.displayName = 'Memo(ForwardRef(Preview))'

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
