/* eslint-disable camelcase */
import {CloseIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, Stack, Text} from '@sanity/ui'
import {useEffect} from 'react'

import {Button, Popover} from '../../../ui-components'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {SANITY_VERSION} from '../../version'
import {ProductAnnouncementCardSeen} from './__telemetry__/studioAnnouncements.telemetry'
import * as styles from './StudioAnnouncements.css'

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
        <div className={styles.cardRootStyle} data-ui="whats-new-root">
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
          <div className={styles.cardButtonRootStyle}>
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
        </div>
      }
    />
  )
}
