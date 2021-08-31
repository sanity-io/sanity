import React, {useCallback, useMemo, useState} from 'react'
import {Button, Card, Stack} from '@sanity/ui'
import {ToggleArrowRightIcon} from '@sanity/icons'

export function ErrorAccordion({children, title}: {children: React.ReactNode; title: string}) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((v) => !v), [])
  const icon = useMemo(
    () => <ToggleArrowRightIcon style={{transform: open && 'rotate(90deg)'}} />,
    [open]
  )

  return (
    <Card radius={3} tone="critical" overflow="hidden">
      <Stack>
        <Button
          fontSize={1}
          icon={icon}
          justify="flex-start"
          mode="bleed"
          onClick={toggle}
          padding={4}
          radius={0}
          space={2}
          text={title}
        />
      </Stack>

      <Card borderTop hidden={!open} padding={4} overflow="auto" tone="inherit">
        {children}
      </Card>
    </Card>
  )
}
