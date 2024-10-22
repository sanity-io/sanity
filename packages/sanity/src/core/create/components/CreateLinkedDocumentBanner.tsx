import {InfoOutlineIcon, ReadOnlyIcon} from '@sanity/icons'
import {Badge, Box, Card, Flex, Heading, Stack, Text, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useRef, useState} from 'react'

import {Button, Popover} from '../../../ui-components'
import {Translate, useTranslation} from '../../i18n'
import {createLocaleNamespace} from '../i18n'
import {type CreateLinkedDocumentBannerProps} from '../types'
import {CreateLearnMoreButton} from './CreateLearnMoreButton'
import {CreateSvg} from './media/CreateSvg'

const POPOVER_RADIUS = 3

export function CreateLinkedDocumentBanner(props: CreateLinkedDocumentBannerProps) {
  const {metadata} = props
  const [infoOpen, setInfoOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const infoButtonRef = useRef<HTMLButtonElement | null>(null)
  const {t} = useTranslation(createLocaleNamespace)
  const toggleOpen = useCallback(() => setInfoOpen((current) => !current), [])

  useClickOutsideEvent(
    () => setInfoOpen(false),
    () => [popoverRef.current, infoButtonRef.current],
  )

  if (metadata?.ejected !== false) {
    return null
  }

  const popoverContent = (
    <Card overflow="hidden" radius={POPOVER_RADIUS} ref={popoverRef}>
      <CreateSvg />
      <Stack space={3} paddingX={4} paddingY={3}>
        <Flex gap={1} align="center">
          <Text size={1} weight="semibold">
            {t('create-link-info-popover.eyebrow-title')}
          </Text>
          <Badge fontSize={1}>{t('create-link-info-popover.eyebrow-badge')}</Badge>
        </Flex>
        <Stack space={4}>
          <Heading size={2}>{t('create-link-info-popover.header')}</Heading>
          <Text size={1}>
            <Translate t={t} i18nKey={'create-link-info-popover.text'} />
          </Text>
          <Flex flex={1} justify="flex-end">
            <CreateLearnMoreButton />
          </Flex>
        </Stack>
      </Stack>
    </Card>
  )

  return (
    <Card border padding={3} tone="transparent">
      <Flex gap={2} align="center">
        <Text size={0} weight="medium">
          <ReadOnlyIcon />
        </Text>
        <Box>
          <Text size={1} weight="medium">
            {t('studio-create-link-banner.text')}
          </Text>
        </Box>
        <Popover
          content={popoverContent}
          open={infoOpen}
          radius={POPOVER_RADIUS}
          style={{width: 320}}
          tone="default"
          placement="bottom-start"
          fallbackPlacements={['bottom', 'bottom-end', 'right-start', 'right', 'right-end']}
        >
          <Button
            ref={infoButtonRef}
            icon={InfoOutlineIcon}
            mode="bleed"
            onClick={toggleOpen}
            tooltipProps={{
              content: t('create-link-info.tooltip'),
            }}
          />
        </Popover>
      </Flex>
    </Card>
  )
}
