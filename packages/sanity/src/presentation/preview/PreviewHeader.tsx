import {
  CheckmarkIcon,
  ChevronDownIcon,
  DesktopIcon,
  EditIcon,
  MobileDeviceIcon,
  PanelLeftIcon,
  PublishIcon,
  RefreshIcon,
} from '@sanity/icons'
import {withoutSecretSearchParams} from '@sanity/preview-url-secret/without-secret-search-params'
import {Box, type ButtonTone, Card, Flex, Hotkeys, Menu, Stack, Switch, Text} from '@sanity/ui'
import {type ReactNode, type RefObject, useCallback, useMemo} from 'react'
import {useTranslation} from 'sanity'

import {Button, MenuButton, MenuItem, Tooltip} from '../../ui-components'
import {presentationLocaleNamespace} from '../i18n'
import {ACTION_IFRAME_RELOAD} from '../reducers/presentationReducer'
import {type HeaderOptions, type PresentationPerspective} from '../types'
import {OpenPreviewButton} from './OpenPreviewButton'
import {type PreviewProps} from './Preview'
import {PreviewLocationInput} from './PreviewLocationInput'
import {SharePreviewMenu} from './SharePreviewMenu'

const PERSPECTIVE_TITLE_KEY: Record<PresentationPerspective, string> = {
  previewDrafts: 'preview-frame.perspective.previewDrafts.title',
  published: 'preview-frame.perspective.published.title',
}

const PERSPECTIVE_TONES: Record<PresentationPerspective, ButtonTone> = {
  previewDrafts: 'caution',
  published: 'positive',
}

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
    dispatch,
    iframe,
    iframeRef,
    initialUrl,
    loadersConnection,
    navigatorEnabled,
    onPathChange,
    onRefresh,
    openPopup,
    overlaysConnection,
    perspective,
    previewUrl,
    setPerspective,
    setViewport,
    targetOrigin,
    toggleNavigator,
    toggleOverlay,
    viewport,
    visualEditing: {overlaysEnabled},
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
      dispatch({type: ACTION_IFRAME_RELOAD})
      // Funky way to reload an iframe without CORS issues
      // eslint-disable-next-line no-self-assign
      // ref.current.src = ref.current.src
      Object.assign(iframeRef.current, {src: `${targetOrigin}${previewUrl || '/'}`})
    })
  }

  const previewLocationRoute = useMemo(() => {
    const previewURL = new URL(previewUrl || '/', targetOrigin)
    const {pathname, search} = withoutSecretSearchParams(previewURL)

    return `${pathname}${search}`
  }, [previewUrl, targetOrigin])

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
                checked={overlaysEnabled}
                onChange={toggleOverlay}
                disabled={iframe.status === 'loading' || overlaysConnection !== 'connected'}
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
          prefix={
            <Box padding={1}>
              <Tooltip
                animate
                content={
                  <Text size={1}>
                    {iframe.status === 'loaded'
                      ? t('preview-frame.refresh-button.tooltip')
                      : t('preview-frame.status', {context: iframe.status})}
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
                  loading={iframe.status === 'reloading' || iframe.status === 'refreshing'}
                  onClick={handleRefresh}
                  tooltipProps={null}
                />
              </Tooltip>
            </Box>
          }
          onChange={onPathChange}
          origin={previewLocationOrigin}
          suffix={
            <Box padding={1}>
              <OpenPreviewButton
                openPopup={openPopup}
                previewLocationOrigin={previewLocationOrigin}
                previewLocationRoute={previewLocationRoute}
              />
            </Box>
          }
          value={previewLocationRoute}
        />
      </Box>

      <Flex align="center" flex="none" gap={1}>
        <MenuButton
          button={
            <Button
              iconRight={ChevronDownIcon}
              mode="bleed"
              text={t(
                PERSPECTIVE_TITLE_KEY[
                  loadersConnection === 'connected' ? perspective : 'previewDrafts'
                ],
              )}
              loading={loadersConnection === 'reconnecting' && iframe.status !== 'loaded'}
              disabled={loadersConnection !== 'connected'}
            />
          }
          id="perspective-menu"
          menu={
            <Menu style={{maxWidth: 240}}>
              <MenuItem
                onClick={() => setPerspective('previewDrafts')}
                pressed={perspective === 'previewDrafts'}
                tone={PERSPECTIVE_TONES.previewDrafts}
                renderMenuItem={() => (
                  <Flex align="flex-start" gap={3}>
                    <Box flex="none">
                      <Text size={1}>
                        <EditIcon />
                      </Text>
                    </Box>
                    <Stack flex={1} space={2}>
                      <Text size={1} weight="medium">
                        {t(PERSPECTIVE_TITLE_KEY.previewDrafts)}
                      </Text>
                      <Text muted size={1}>
                        {t('preview-frame.perspective.previewDrafts.text')}
                      </Text>
                    </Stack>
                    <Box flex="none">
                      <Text
                        muted
                        size={1}
                        style={{
                          opacity: perspective === 'previewDrafts' ? 1 : 0,
                        }}
                      >
                        <CheckmarkIcon />
                      </Text>
                    </Box>
                  </Flex>
                )}
              />
              <MenuItem
                onClick={() => setPerspective('published')}
                pressed={perspective === 'published'}
                tone={PERSPECTIVE_TONES.published}
                renderMenuItem={() => (
                  <Flex align="flex-start" gap={3}>
                    <Box flex="none">
                      <Text size={1}>
                        <PublishIcon />
                      </Text>
                    </Box>
                    <Stack flex={1} space={2}>
                      <Text size={1} weight="medium">
                        {t(PERSPECTIVE_TITLE_KEY.published)}
                      </Text>
                      <Text muted size={1}>
                        {t('preview-frame.perspective.published.text')}
                      </Text>
                    </Stack>
                    <Box flex="none">
                      <Text
                        muted
                        size={1}
                        style={{
                          opacity: perspective === 'published' ? 1 : 0,
                        }}
                      >
                        <CheckmarkIcon />
                      </Text>
                    </Box>
                  </Flex>
                )}
              />
            </Menu>
          }
          popover={{
            constrainSize: true,
            placement: 'bottom',
            portal: true,
          }}
        />
      </Flex>

      <Flex align="center" flex="none" gap={1}>
        <Tooltip
          animate
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

function PreviewHeader(
  props: Omit<PreviewHeaderProps, 'renderDefault'> & {options?: HeaderOptions},
) {
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

/** @internal */
export function usePresentationPreviewHeader(
  props: Omit<PreviewHeaderProps, 'renderDefault'> & {options?: HeaderOptions},
): () => ReactNode {
  const Component = useCallback(() => {
    return <PreviewHeader {...props} />
  }, [props])

  return Component
}
