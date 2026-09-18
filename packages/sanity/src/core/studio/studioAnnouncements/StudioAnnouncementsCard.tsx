import {CloseIcon} from '@sanity/icons/Close'
import {useTelemetry} from '@sanity/telemetry/react'
import {Card, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, useEffect} from 'react'
import {Box} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {Popover} from '../../../ui-components/popover/Popover'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {SANITY_VERSION} from '../../version'
import {ProductAnnouncementCardSeen} from './__telemetry__/studioAnnouncements.telemetry'
import {
  buttonRoot,
  cardHoverBgVar,
  cardNormalBgVar,
  closeButtonHoverBorderVar,
  root,
} from './StudioAnnouncementsCard.css'

function Root(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {color} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(root, className)}
      style={{
        ...assignInlineVars({
          [cardHoverBgVar]: color.selectable.default.hovered.bg,
          [cardNormalBgVar]: color.selectable.default.enabled.bg,
          [closeButtonHoverBorderVar]: color.selectable.default.hovered.border,
        }),
        ...style,
      }}
    />
  )
}

interface StudioAnnouncementCardProps {
  title: string
  id: string
  name: string
  isOpen: boolean
  preHeader: string
  onCardClick: () => void
  onCardDismiss: () => void
}

/**
 * @internal
 * @hidden
 */
export function StudioAnnouncementsCard({
  title,
  id,
  isOpen,
  name,
  preHeader,
  onCardClick,
  onCardDismiss,
}: StudioAnnouncementCardProps) {
  const {t} = useTranslation()
  const telemetry = useTelemetry()

  useEffect(() => {
    if (isOpen) {
      telemetry.log(ProductAnnouncementCardSeen, {
        announcement_id: id,
        announcement_title: title,
        announcement_internal_name: name,
        source: 'studio',
        studio_version: SANITY_VERSION,
      })
    }
  }, [telemetry, id, title, isOpen, name])

  return (
    <Popover
      open={isOpen}
      shadow={3}
      portal
      style={{
        bottom: 12,
        left: 12,
        top: 'none',
      }}
      width={0}
      placement="bottom-start"
      content={
        <Root data-ui="whats-new-root">
          <Card
            data-ui="whats-new-card"
            padding={3}
            radius={3}
            onClick={onCardClick}
            role="button"
            aria-label={t('announcement.floating-button.open-label')}
          >
            <Stack gap={3}>
              <Box marginRight={6}>
                <Text as={'h3'} size={1} muted>
                  {preHeader}
                </Text>
              </Box>
              <Text size={1} weight="medium">
                {title}
              </Text>
            </Stack>
          </Card>
          <div className={buttonRoot}>
            <Button
              id="close-floating-button"
              mode="bleed"
              onClick={onCardDismiss}
              icon={CloseIcon}
              tone="default"
              aria-label={t('announcement.floating-button.dismiss-label')}
              tooltipProps={{
                content: t('announcement.floating-button.dismiss'),
              }}
            />
          </div>
        </Root>
      }
    />
  )
}
