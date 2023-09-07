import React, {useCallback, useState} from 'react'
import {Popover, Stack, Inline, Text, Card, Badge, Button, useClickOutside} from '@sanity/ui'
import {HelpCircleIcon} from '@sanity/icons'
import {useTranslation} from 'sanity'
import {visionLocaleNamespace} from '../i18n'
import {PerspectivePopoverContent, PerspectivePopoverLink} from './PerspectivePopover.styled'

export function PerspectivePopover() {
  const [open, setOpen] = useState(false)
  const [buttonEl, setButtonEl] = useState<HTMLElement | null>(null)
  const [popoverEl, setPopoverEl] = useState<HTMLElement | null>(null)

  const handleClick = useCallback(() => setOpen((o) => !o), [])
  const handleClickOutside = useCallback(() => setOpen(false), [])

  const {t} = useTranslation(visionLocaleNamespace)

  useClickOutside(handleClickOutside, [buttonEl, popoverEl])

  return (
    <Popover
      content={
        <PerspectivePopoverContent>
          <Stack space={4}>
            <Inline space={2}>
              <Text weight="medium">{t('settings.perspectives.title')}</Text>
              <Badge tone="primary">{t('label.new')}</Badge>
            </Inline>

            <Card>
              <Text muted>{t('settings.perspectives.description')}</Text>
            </Card>

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
      ref={setPopoverEl}
      open={open}
    >
      <Button
        icon={HelpCircleIcon}
        mode="bleed"
        padding={2}
        tone="primary"
        fontSize={1}
        ref={setButtonEl}
        onClick={handleClick}
        selected={open}
      />
    </Popover>
  )
}
