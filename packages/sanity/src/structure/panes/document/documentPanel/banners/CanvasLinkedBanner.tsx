import {ComposeSparklesIcon, InfoOutlineIcon, LaunchIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Heading, Text, useClickOutsideEvent} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {
  getDocumentVariantType,
  useCanvasCompanionDoc,
  useNavigateToCanvasDoc,
  useTranslation,
} from 'sanity'
import {styled} from 'styled-components'

import {Popover} from '../../../../../ui-components'
import {Button} from '../../../../../ui-components/button/Button'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {Banner} from './Banner'

const Image = styled.img`
  object-fit: cover;
  width: 100%;
  height: 100%;
  height: 180px;
  display: flex;
`
const CANVAS_IMAGE_URL =
  'https://cdn.sanity.io/images/pyrmmpch/production/b47224e2f3a7d1747e43b9da1ac31739250e628b-632x376.png'

const CANVAS_APP_NAME = 'Canvas'
const CanvasPopoverContent = ({onClose}: {onClose: () => void}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const ref = useRef<HTMLDivElement | null>(null)
  useClickOutsideEvent(onClose, () => [ref.current])

  return (
    <Card radius={3} overflow={'hidden'} width={0} ref={ref}>
      <Container width={0}>
        <Image src={CANVAS_IMAGE_URL} alt={'Canvas'} />
        <Flex paddingX={4} paddingBottom={4} paddingTop={3} direction={'column'}>
          <Flex paddingY={1} gap={2}>
            <Text size={1} weight="semibold">
              {CANVAS_APP_NAME}
            </Text>
            <Text size={1} muted>
              <ComposeSparklesIcon />
            </Text>
          </Flex>
          <Box paddingTop={3}>
            <Heading size={1}>{t('canvas.banner.popover-heading')}</Heading>
          </Box>
          <Box paddingTop={4}>
            <Text size={1}>{t('canvas.banner.popover-description')}</Text>
          </Box>
        </Flex>
        <Flex width="fill" gap={3} justify="flex-end" paddingX={4} paddingBottom={4}>
          <Button
            mode="bleed"
            text={t('canvas.banner.popover-button-text')}
            autoFocus
            tone="primary"
            href="https://snty.link/canvas-docs"
            target="_blank"
            rel="noopener noreferrer"
            as="a"
            iconRight={LaunchIcon}
          />
        </Flex>
      </Container>
    </Card>
  )
}
const CanvasLinkedBannerContent = ({documentId}: {documentId: string}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const [open, setOpen] = useState(false)
  const documentVariantType = getDocumentVariantType(documentId)
  const variantText = useMemo(() => {
    if (documentVariantType === 'published') return t('canvas.banner.linked-text.published')
    if (documentVariantType === 'draft') return t('canvas.banner.linked-text.draft')
    return t('canvas.banner.linked-text.version')
  }, [documentVariantType, t])

  const togglePopover = useCallback(() => setOpen((prev) => !prev), [])
  const onClose = useCallback(() => setOpen(false), [])
  return (
    <Flex align={'center'} gap={2}>
      <Text size={1} weight="medium">
        {variantText}
      </Text>
      <Popover
        open={open}
        size={0}
        tone="default"
        portal
        placement="bottom-start"
        content={<CanvasPopoverContent onClose={onClose} />}
      >
        <Button
          tooltipProps={null}
          mode="bleed"
          tone="default"
          icon={InfoOutlineIcon}
          onClick={togglePopover}
        />
      </Popover>
    </Flex>
  )
}

export function CanvasLinkedBanner() {
  const {documentId, displayed} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)
  const id = displayed?._id || documentId
  const {companionDoc} = useCanvasCompanionDoc(id)
  const navigateToCanvas = useNavigateToCanvasDoc(companionDoc?.canvasDocumentId, 'banner')

  if (!companionDoc) return null

  return (
    <Banner
      tone="neutral"
      data-test-id="canvas-linked-banner"
      paddingY={0}
      content={<CanvasLinkedBannerContent documentId={id} />}
      action={{
        mode: 'ghost',
        text: t('canvas.banner.edit-in-canvas-action'),
        onClick: navigateToCanvas,
      }}
    />
  )
}
