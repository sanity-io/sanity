import {HelpCircleIcon} from '@sanity/icons'
import {Badge, Button, Card, Inline, Popover, Stack, Text, useClickOutside} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type TFunction} from 'sanity'

import {TypesPopoverContent, TypesPopoverLink} from './QueryTypesPopover.styled'

const newLabelExpiresAt = new Date('2024-07-01T00:00:00Z')

export function QueryTypesPopover({t}: {t: TFunction<'vision', undefined>}) {
  const [now] = useState(new Date())
  const [open, setOpen] = useState(false)
  const [buttonEl, setButtonEl] = useState<HTMLElement | null>(null)
  const [popoverEl, setPopoverEl] = useState<HTMLElement | null>(null)

  const handleClick = useCallback(() => setOpen((o) => !o), [])
  const handleClickOutside = useCallback(() => setOpen(false), [])

  useClickOutside(handleClickOutside, [buttonEl, popoverEl])

  return (
    <Popover
      content={
        <TypesPopoverContent>
          <Stack space={4}>
            <Inline space={2}>
              <Text weight="medium">{t('types.label')}</Text>
              {now < newLabelExpiresAt ? <Badge tone="primary">{t('label.new')}</Badge> : null}
            </Inline>

            <Card>
              <Text muted>{t('types.description')}</Text>
            </Card>

            <Card>
              <Text>
                <TypesPopoverLink href="https://www.sanity.io/docs/sanity-typegen" target="_blank">
                  {t('types.action.docs-link')} &rarr;
                </TypesPopoverLink>
              </Text>
            </Card>
          </Stack>
        </TypesPopoverContent>
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
