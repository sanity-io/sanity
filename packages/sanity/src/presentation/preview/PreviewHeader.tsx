import {DesktopIcon, MobileDeviceIcon, PanelLeftIcon, RefreshIcon} from '@sanity/icons'
import {withoutSecretSearchParams} from '@sanity/preview-url-secret/without-secret-search-params'
import {Box, Card, Flex, Hotkeys, Switch, Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type RefObject, useCallback, useMemo} from 'react'
import {useTranslation} from 'sanity'

import {Button} from '../../ui-components/button/Button'
import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {presentationLocaleNamespace} from '../i18n'
import {type HeaderOptions} from '../types'
import {useId} from '../useId'
import {OpenPreviewButton} from './OpenPreviewButton'
import {type PreviewProps} from './Preview'
import {PreviewLocationInput} from './PreviewLocationInput'
import {SharePreviewMenu} from './SharePreviewMenu'

/** @public */
export interface PreviewHeaderProps extends PreviewProps {
  iframeRef: RefObject<HTMLIFrameElement | null>
  renderDefault: (props: PreviewHeaderProps) => React.JSX.Element
}

const PreviewHeaderDefault = (props: Omit<PreviewHeaderProps, 'renderDefault'>) => {
  const {
    canSharePreviewAccess,
    canToggleSharePreviewAccess,
    canUseSharedPreviewAccess,
    iframeRef,
    initialUrl,
    navigatorEnabled,
    onPathChange,
    onRefresh,
    openPopup,
    overlaysConnection,
    presentationRef,
    perspective,
    previewUrl,
    setViewport,
    targetOrigin,
    toggleNavigator,
    toggleOverlay,
    viewport,
    previewUrlRef,
  } = props

  const {t} = useTranslation(presentationLocaleNamespace)

  const toggleViewportSize = useCallback(
    () => setViewport(viewport === 'desktop' ? 'mobile' : 'desktop'),
    [setViewport, viewport],
  )

  const previewLocationOrigin = useMemo(() => {
    return targetOrigin === location.origin ? '' : targetOrigin
  }, [targetOrigin])

  const handleRefresh = () => {
    onRefresh(() => {
      if (!iframeRef.current) {
        return
      }
      presentationRef.send({type: 'iframe reload'})
      // Funky way to reload an iframe without CORS issues
      // ref.current.src = ref.current.src
      Object.assign(iframeRef.current, {src: `${targetOrigin}${previewUrl || '/'}`})
    })
  }

  const isLoading = useSelector(presentationRef, (state) => state.matches('loading'))
  const isLoaded = useSelector(presentationRef, (state) => state.matches('loaded'))
  const isRefreshing = useSelector(presentationRef, (state) =>
    state.matches({loaded: 'refreshing'}),
  )
  const isReloading = useSelector(presentationRef, (state) => state.matches({loaded: 'reloading'}))
  const overlaysEnabled = useSelector(
    presentationRef,
    (state) => state.context.visualEditingOverlaysEnabled,
  )

  const previewLocationRoute = useMemo(() => {
    const previewURL = new URL(previewUrl || '/', targetOrigin)
    const {pathname, search} = withoutSecretSearchParams(previewURL)

    return `${pathname}${search}`
  }, [previewUrl, targetOrigin])

  const perspectiveToggleTooltipId = useId()

  /**
   * If the preview URL machine is busy it means it's about to change the target origin and reload the iframe,
   * so we show a spinner
   */
  const previewUrlBusy = useSelector(previewUrlRef, (state) => state.hasTag('busy'))

  return (
    <Flex align="center" gap={1} paddingX={1} style={{width: '100%'}}>
      {toggleNavigator && (
        <Button
          aria-label={t('preview-frame.navigator.toggle-button.aria-label')}
          icon={PanelLeftIcon}
          mode="bleed"
          onClick={toggleNavigator}
          selected={navigatorEnabled}
          tooltipProps={{
            content: <Text size={1}>{t('preview-frame.navigator.toggle-button.tooltip')}</Text>,
            fallbackPlacements: ['bottom-start'],
            placement: 'bottom',
          }}
        />
      )}

      <Tooltip
        animate
        content={
          <Flex align="center" style={{whiteSpace: 'nowrap'}}>
            <Box padding={1}>
              <Text size={1}>
                {t('preview-frame.overlay.toggle-button.tooltip', {
                  context: overlaysEnabled ? 'disable' : 'enable',
                })}
              </Text>
            </Box>
            <Box paddingY={1}>
              <Hotkeys keys={['Alt']} style={{marginTop: -4, marginBottom: -4}} />
            </Box>
          </Flex>
        }
        fallbackPlacements={['bottom-start']}
        placement="bottom"
        portal
      >
        <Card
          as="label"
          flex="none"
          padding={3}
          marginX={1}
          style={{
            lineHeight: 0,
            borderRadius: 999,
            userSelect: 'none',
          }}
          tone={overlaysEnabled ? 'transparent' : undefined}
        >
          <Flex align="center" gap={3}>
            <div style={{margin: -4}}>
              <Switch
                indeterminate={!isLoaded}
                checked={overlaysEnabled}
                onChange={toggleOverlay}
                disabled={isLoading || overlaysConnection !== 'connected'}
              />
            </div>
            <Box>
              <Text muted={!overlaysEnabled} size={1} weight="medium">
                {t('preview-frame.overlay.toggle-button.text')}
              </Text>
            </Box>
          </Flex>
        </Card>
      </Tooltip>

      <Box flex={1}>
        <PreviewLocationInput
          previewUrlRef={previewUrlRef}
          prefix={
            <Box padding={1}>
              <Tooltip
                animate
                content={
                  <Text size={1}>
                    {isLoaded
                      ? t('preview-frame.refresh-button.tooltip')
                      : t('preview-frame.status', {
                          context: isLoading
                            ? 'loading'
                            : isRefreshing
                              ? 'refreshing'
                              : isReloading
                                ? 'reloading'
                                : 'unknown',
                        })}
                  </Text>
                }
                fallbackPlacements={['bottom-end']}
                placement="bottom"
                portal
              >
                <Button
                  aria-label={t('preview-frame.refresh-button.aria-label')}
                  icon={RefreshIcon}
                  mode="bleed"
                  loading={isReloading || isRefreshing || previewUrlBusy}
                  onClick={handleRefresh}
                  tooltipProps={null}
                />
              </Tooltip>
            </Box>
          }
          onChange={onPathChange}
          suffix={
            <Box padding={1}>
              <OpenPreviewButton
                openPopup={openPopup}
                previewLocationOrigin={previewLocationOrigin}
                previewLocationRoute={previewLocationRoute}
                perspective={perspective}
                targetOrigin={targetOrigin}
              />
            </Box>
          }
          value={previewLocationRoute}
        />
      </Box>

      <Flex align="center" flex="none" gap={1}>
        <Tooltip
          animate
          // eslint-disable-next-line react/jsx-no-bind
          ref={(node) => {
            node?.style.setProperty('view-transition-name', perspectiveToggleTooltipId)
          }}
          content={
            <Text size={1}>
              {t('preview-frame.viewport-button.tooltip', {
                context: viewport === 'desktop' ? 'narrow' : 'full',
              })}
            </Text>
          }
          fallbackPlacements={['bottom-start']}
          placement="bottom"
          portal
        >
          <Button
            data-testid="preview-viewport-toggle"
            data-viewport={viewport}
            aria-label={t('preview-frame.viewport-button.aria-label')}
            icon={viewport === 'desktop' ? MobileDeviceIcon : DesktopIcon}
            mode="bleed"
            onClick={toggleViewportSize}
            tooltipProps={null}
          />
        </Tooltip>
      </Flex>

      {canSharePreviewAccess && (
        <Flex align="center" flex="none" gap={1}>
          <SharePreviewMenu
            canToggleSharePreviewAccess={canToggleSharePreviewAccess}
            canUseSharedPreviewAccess={canUseSharedPreviewAccess}
            previewLocationRoute={previewLocationRoute}
            initialUrl={initialUrl}
            perspective={perspective}
          />
        </Flex>
      )}
    </Flex>
  )
}

/** @internal */
export function PreviewHeader(
  props: Omit<PreviewHeaderProps, 'renderDefault'> & {options?: HeaderOptions},
): React.JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const renderDefault = useCallback((props: Omit<PreviewHeaderProps, 'renderDefault'>) => {
    return <PreviewHeaderDefault {...props} />
  }, [])

  const HeaderComponent = props.options?.component
  const header = HeaderComponent ? (
    <HeaderComponent {...props} renderDefault={renderDefault} />
  ) : (
    renderDefault(props)
  )

  return (
    <Card flex="none" padding={2} borderBottom style={{position: 'relative'}}>
      <Flex align="center" style={{minHeight: 0}}>
        {header}
      </Flex>
    </Card>
  )
}
