/* eslint-disable camelcase */
import {CloseIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Card, Stack, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useEffect} from 'react'
import {css, keyframes, styled} from 'styled-components'

import {Button, Popover} from '../../../ui-components'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {SANITY_VERSION} from '../../version'
import {ProductAnnouncementCardSeen} from './__telemetry__/studioAnnouncements.telemetry'

const keyframe = keyframes`
  0% {
    background-position: 100%;
  }
  100% {
    background-position: -100%;
  }
`

const Root = styled.div((props) => {
  const theme = getTheme_v2(props.theme)
  const cardHoverBg = theme.color.selectable.default.hovered.bg
  const cardNormalBg = theme.color.selectable.default.enabled.bg

  return css`
    position: relative;
    cursor: pointer;
    // hide the close button
    #close-floating-button {
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover {
      > [data-ui='whats-new-card'] {
        --card-bg-color: ${cardHoverBg};
        box-shadow: inset 0 0 2px 1px var(--card-skeleton-color-to);
        background-image: linear-gradient(
          to right,
          var(--card-bg-color),
          var(--card-bg-color),
          ${cardNormalBg},
          var(--card-bg-color),
          var(--card-bg-color),
          var(--card-bg-color)
        );
        background-position: 100%;
        background-size: 200% 100%;
        background-attachment: fixed;
        animation-name: ${keyframe};
        animation-timing-function: ease-in;
        animation-iteration-count: infinite;
        animation-duration: 2000ms;
      }
      #close-floating-button {
        opacity: 1;
        background: transparent;

        &:hover {
          transition: all 0.2s;
          box-shadow: 0 0 0 1px ${theme.color.selectable.default.hovered.border};
        }
      }
    }
  `
})

const ButtonRoot = styled.div`
  z-index: 1;
  position: absolute;
  top: 0px;
  right: 6px;
`

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
            <Stack space={3}>
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
          <ButtonRoot>
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
          </ButtonRoot>
        </Root>
      }
    />
  )
}
