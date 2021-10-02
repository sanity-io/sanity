import React, {useCallback, useMemo, useState} from 'react'
import {Button, Card, Stack} from '@sanity/ui'
import {ToggleArrowRightIcon} from '@sanity/icons'

export function ErrorAccordion({
  children,
  open: openProp = false,
  title,
}: {
  children: React.ReactNode
  open: boolean
  title: string
}) {
  const [open, setOpen] = useState(openProp)
  const toggle = useCallback(() => setOpen((v) => !v), [])
  const icon = useMemo(
    () => <ToggleArrowRightIcon style={{transform: open && 'rotate(90deg)'}} />,
    [open]
  )

  return (
    <Card radius={2} tone="critical" overflow="hidden">
      <Stack>
        <Button
          fontSize={1}
          icon={icon}
          justify="flex-start"
          mode="bleed"
          onClick={toggle}
          padding={3}
          radius={0}
          space={2}
          text={title}
        />
      </Stack>

      <Card borderTop hidden={!open} padding={3} overflow="auto" tone="inherit">
        {children}
      </Card>
    </Card>
  )
}
