import {LaunchIcon} from '@sanity/icons/Launch'
import {
  urlSearchParamPreviewPathname,
  urlSearchParamPreviewPerspective,
  urlSearchParamPreviewSecret,
  urlSearchParamPreviewVariant,
} from '@sanity/preview-url-secret/constants'
import {Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {useCallback, useMemo} from 'react'
import {useTranslation} from 'sanity'

import {Button} from '../../ui-components/button/Button'
import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {presentationLocaleNamespace} from '../i18n'
import {type PresentationPerspective, type PreviewUrlPreviewMode} from '../types'
import {encodeStudioPerspective} from '../util/encodeStudioPerspective'
import {type PreviewProps} from './Preview'

interface OpenPreviewUrlOptions {
  previewLocationOrigin?: string
  previewLocationRoute: string
  perspective: PresentationPerspective
  previewMode: PreviewUrlPreviewMode | null
  previewUrlSecret: string | null
  targetOrigin: string
  variant: string | undefined
}

/** @internal */
export function resolveOpenPreviewUrl(options: OpenPreviewUrlOptions): string {
  const {
    perspective,
    previewLocationOrigin,
    previewLocationRoute,
    previewMode,
    previewUrlSecret,
    targetOrigin,
    variant,
  } = options
  const previewUrl = new URL(previewLocationRoute, previewLocationOrigin || targetOrigin)

  previewUrl.searchParams.set(
    urlSearchParamPreviewPerspective,
    encodeStudioPerspective(perspective),
  )
  if (variant) {
    previewUrl.searchParams.set(urlSearchParamPreviewVariant, variant)
  } else {
    previewUrl.searchParams.delete(urlSearchParamPreviewVariant)
  }

  if (!previewMode || !previewUrlSecret) {
    const {pathname, search} = previewUrl
    return `${previewLocationOrigin}${pathname}${search}`
  }

  const enableUrl = new URL(previewMode.enable, previewUrl)
  enableUrl.searchParams.set(urlSearchParamPreviewSecret, previewUrlSecret)
  enableUrl.searchParams.set(
    urlSearchParamPreviewPathname,
    `${previewUrl.pathname}${previewUrl.search}${previewUrl.hash}`,
  )
  enableUrl.searchParams.set(urlSearchParamPreviewPerspective, encodeStudioPerspective(perspective))
  if (variant) {
    enableUrl.searchParams.set(urlSearchParamPreviewVariant, variant)
  } else {
    enableUrl.searchParams.delete(urlSearchParamPreviewVariant)
  }

  return enableUrl.toString()
}

/** @internal */
export function OpenPreviewButton(
  props: Pick<PreviewProps, 'openPopup' | 'previewUrlRef'> & {
    previewLocationOrigin?: string
    previewLocationRoute: string
    perspective: PresentationPerspective
    variant: string | undefined
    targetOrigin: string
  },
): React.ReactNode {
  const {
    openPopup,
    previewLocationOrigin,
    previewLocationRoute,
    previewUrlRef,
    perspective,
    variant,
    targetOrigin,
  } = props
  const previewMode = useSelector(previewUrlRef, (state) => state.context.previewMode)
  const previewUrlSecret = useSelector(
    previewUrlRef,
    (state) => state.context.previewUrlSecret?.secret ?? null,
  )

  const openPreviewLink = useMemo(
    () =>
      resolveOpenPreviewUrl({
        perspective,
        previewLocationOrigin,
        previewLocationRoute,
        previewMode,
        previewUrlSecret,
        targetOrigin,
        variant,
      }),
    [
      perspective,
      previewLocationOrigin,
      previewLocationRoute,
      previewMode,
      previewUrlSecret,
      targetOrigin,
      variant,
    ],
  )

  const {t} = useTranslation(presentationLocaleNamespace)

  const handleOpenPopup = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      openPopup(event.currentTarget.href)
    },
    [openPopup],
  )

  return (
    <Tooltip
      animate
      content={<Text size={1}>{t('share-url.menu-item.open.text')}</Text>}
      fallbackPlacements={['bottom-start']}
      placement="bottom"
      portal
    >
      <Button
        as="a"
        aria-label={t('share-url.menu-item.open.text')}
        icon={LaunchIcon}
        mode="bleed"
        href={openPreviewLink}
        rel="opener"
        target="_blank"
        tooltipProps={null}
        // @ts-expect-error the `as="a"` prop isn't enough to change the type of event.target from <div> to <a>
        onClick={handleOpenPopup}
      />
    </Tooltip>
  )
}
