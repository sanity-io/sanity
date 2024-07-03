import {COLOR_HUES} from '@sanity/color'
import {icons, type IconSymbol, SearchIcon} from '@sanity/icons'
import {Avatar, Box, Button, Flex, Popover, Stack, TextInput, useClickOutside} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {type BundleDocument} from '../../../store/bundles/types'
import {BundleBadge} from '../BundleBadge'

export function BundleIconEditorPicker(props: {
  onChange: (value: Partial<BundleDocument>) => void
  value: Partial<BundleDocument>
}): JSX.Element {
  const {onChange, value} = props

  const [open, setOpen] = useState(false)

  const [iconSearchQuery, setIconSearchQuery] = useState('')

  const handleIconSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIconSearchQuery(event.target.value)
  }

  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLDivElement | null>(null)

  const handleClickOutside = useCallback(() => {
    setOpen(false)
  }, [])

  useClickOutside(handleClickOutside, [button, popover])

  return (
    <Popover
      content={
        <>
          <Flex gap={1} padding={1}>
            {COLOR_HUES.map((hue) => (
              <Button
                key={hue}
                mode="bleed"
                onClick={() => onChange({...value, hue})}
                padding={1}
                selected={value.hue === hue}
              >
                <Avatar color={hue} size={0} style={{margin: -1}} />
              </Button>
            ))}
          </Flex>
          <Stack style={{borderTop: '1px solid var(--card-border-color)'}}>
            <Box padding={1}>
              <TextInput
                fontSize={1}
                icon={SearchIcon}
                onChange={handleIconSearchQueryChange}
                padding={2}
                placeholder="Search icons"
                space={2}
                value={iconSearchQuery}
              />
            </Box>
            <Flex
              gap={1}
              overflow="auto"
              padding={1}
              style={{maxHeight: 269, maxWidth: 269}}
              wrap="wrap"
            >
              {Object.entries(icons)
                .filter(([key]) => !iconSearchQuery || key.includes(iconSearchQuery.toLowerCase()))
                .map(([key, icon]) => (
                  <Button
                    icon={icon}
                    key={key}
                    mode="bleed"
                    onClick={() => onChange({...value, icon: key as IconSymbol})}
                    padding={2}
                  />
                ))}
            </Flex>
          </Stack>
        </>
      }
      open={open}
      placement="bottom-start"
      portal
      ref={setPopover}
    >
      <div>
        <Button
          mode="bleed"
          onClick={() => setOpen((o) => !o)}
          padding={0}
          ref={setButton}
          selected={open}
          radius="full"
        >
          <BundleBadge hue={value.hue} icon={value.icon} />
        </Button>
      </div>
    </Popover>
  )
}
