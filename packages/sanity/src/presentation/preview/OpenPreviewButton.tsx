import {LaunchIcon} from '@sanity/icons/Launch'
import {Text} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {useCallback, useMemo} from 'react'
import {useTranslation} from 'sanity'

import {Button} from '../../ui-components/button/Button'
import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {presentationLocaleNamespace} from '../i18n'
import {type PresentationPerspective} from '../types'
import {type PreviewProps} from './Preview'
import {resolveOpenPreviewUrl} from './resolveOpenPreviewUrl'

/** @internal */
export function OpenPreviewButton(
  props: Pick<PreviewProps, 'openPopup' | 'openPreviewUrlRef'> & {
    previewLocationOrigin?: string
    previewLocationRoute: string
    perspective: PresentationPerspective
    variant: string | undefined
    targetOrigin: string
  },
): React.ReactNode {
  const {
    openPopup,
    openPreviewUrlRef,
    previewLocationOrigin,
    previewLocationRoute,
    perspective,
    variant,
    targetOrigin,
  } = props
  /**
   * The link goes through the enable route while preview mode is on for the current target origin and
   * there is a valid secret for it, and opens the preview directly otherwise
   */
  const previewMode = useSelector(openPreviewUrlRef, (state) => state.context.previewMode)
  const previewUrlSecret = useSelector(
    openPreviewUrlRef,
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
