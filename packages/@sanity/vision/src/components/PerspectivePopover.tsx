import {HelpCircleIcon} from '@sanity/icons'
import {
  Badge,
  Box,
  Button,
  Card,
  type CardTone,
  Inline,
  Popover,
  Stack,
  Text,
  useClickOutsideEvent,
} from '@sanity/ui'
import {useCallback, useRef, useState} from 'react'
import {Translate, useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {visionLocaleNamespace} from '../i18n'
import {PerspectivePopoverContent, PerspectivePopoverLink} from './PerspectivePopover.styled'

const Dot = styled.div<{tone: CardTone}>`
  width: 4px;
  height: 4px;
  border-radius: 3px;
  box-shadow: 0 0 0 1px var(--card-bg-color);
  background-color: ${({tone}) => `var(--card-badge-${tone}-dot-color)`};
`

const SHOW_DEFAULT_PERSPECTIVE_NOTIFICATION = false

export function PerspectivePopover() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const handleClick = useCallback(() => setOpen((o) => !o), [])

  const {t} = useTranslation(visionLocaleNamespace)

  useClickOutsideEvent(
    () => setOpen(false),
    () => [buttonRef.current, popoverRef.current],
  )

  return (
    <Popover
      content={
        <PerspectivePopoverContent>
          <Stack space={4}>
            <Inline space={2}>
              <Text weight="medium">{t('settings.perspectives.title')}</Text>
            </Inline>

            <Card>
              <Text muted>{t('settings.perspectives.description')}</Text>
            </Card>
            <Card>
              <Stack space={2}>
                <Box>
                  <Badge tone="primary">{t('label.new')}</Badge>
                </Box>
                <Text muted>
                  <Translate
                    t={t}
                    i18nKey="settings.perspective.preview-drafts-renamed-to-drafts.description"
                  />
                </Text>
              </Stack>
            </Card>
            {SHOW_DEFAULT_PERSPECTIVE_NOTIFICATION ? (
              <Card>
                <Badge tone="caution">{t('label.new')}</Badge>
                <Card>
                  <Text muted>
                    <Translate t={t} i18nKey="settings.perspectives.new-default.description" />
                  </Text>
                </Card>
              </Card>
            ) : null}

            <Card>
              <Text>
                <PerspectivePopoverLink href="https://sanity.io/docs/perspectives" target="_blank">
                  {t('settings.perspectives.action.docs-link')} &rarr;
                </PerspectivePopoverLink>
              </Text>
            </Card>
          </Stack>
        </PerspectivePopoverContent>
      }
      placement="bottom-start"
      portal
      padding={3}
      ref={popoverRef}
      open={open}
    >
      <Button
        icon={HelpCircleIcon}
        mode="bleed"
        padding={2}
        paddingRight={1}
        tone="primary"
        fontSize={1}
        ref={buttonRef}
        onClick={handleClick}
        selected={open}
      >
        <Dot tone={SHOW_DEFAULT_PERSPECTIVE_NOTIFICATION ? 'caution' : 'primary'} />
      </Button>
    </Popover>
  )
}
