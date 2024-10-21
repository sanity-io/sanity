import {InfoOutlineIcon, ReadOnlyIcon} from '@sanity/icons'
import {Badge, Box, Card, Flex, Heading, Stack, Text, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useRef, useState} from 'react'

import {Button, Popover} from '../../../ui-components'
import {Translate, useTranslation} from '../../i18n'
import {createLocaleNamespace} from '../i18n'
import {type CreateLinkedDocumentBannerProps} from '../types'
import {CreateLearnMoreButton} from './CreateLearnMoreButton'
import {CreateInfoSvg} from './media/CreateInfoSvg'

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
    <Stack space={0} ref={popoverRef}>
      <CreateInfoSvg />
      <Stack space={4} padding={4}>
        <Flex gap={2} align="center">
          <Text size={1} weight="semibold">
            {t('create-link-info-popover.eyebrow-title')}
          </Text>
          <Badge size={1}>{t('create-link-info-popover.eyebrow-badge')}</Badge>
        </Flex>
        <Box>
          <Heading>{t('create-link-info-popover.header')}</Heading>
        </Box>
        <Box>
          <Text size={1}>
            <Translate t={t} i18nKey={'create-link-info-popover.text'} />
          </Text>
        </Box>
        <Flex flex={1} justify="flex-end">
          <Box>
            <CreateLearnMoreButton />
          </Box>
        </Flex>
      </Stack>
    </Stack>
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
          radius={3}
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
