import React, {useCallback, useState} from 'react'
import {Popover, Stack, Inline, Text, Card, Badge, useClickOutside} from '@sanity/ui'
import {HelpCircleIcon} from '@sanity/icons'
import {Button} from '../../../../sanity/src/ui'
import {PerspectivePopoverContent, PerspectivePopoverLink} from './PerspectivePopover.styled'

export function PerspectivePopover() {
  const [open, setOpen] = useState(false)
  const [buttonEl, setButtonEl] = useState<HTMLElement | null>(null)
  const [popoverEl, setPopoverEl] = useState<HTMLElement | null>(null)

  const handleClick = useCallback(() => setOpen((o) => !o), [])
  const handleClickOutside = useCallback(() => setOpen(false), [])

  useClickOutside(handleClickOutside, [buttonEl, popoverEl])

  return (
    <Popover
      content={
        <PerspectivePopoverContent>
          <Stack space={4}>
            <Inline space={2}>
              <Text weight="medium">Perspectives</Text>
              <Badge tone="primary">New</Badge>
            </Inline>

            <Card>
              <Text muted>
                Perspectives allow your query to run against different "views" of the content in
                your dataset
              </Text>
            </Card>

            <Card>
              <Text>
                <PerspectivePopoverLink href="https://sanity.io/docs/perspectives" target="_blank">
                  Read docs &rarr;
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
        size="small"
        tone="primary"
        ref={setButtonEl}
        onClick={handleClick}
        selected={open}
      />
    </Popover>
  )
}
