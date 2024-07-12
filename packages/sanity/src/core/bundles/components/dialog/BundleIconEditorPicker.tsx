import {COLOR_HUES, type ColorHueKey} from '@sanity/color'
import {icons, type IconSymbol, SearchIcon} from '@sanity/icons'
import {
  Avatar,
  Box,
  Button,
  Container,
  Flex,
  Popover,
  Stack,
  TextInput,
  useClickOutside,
} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../store/bundles/types'
import {BundleBadge} from '../BundleBadge'

const StyledStack = styled(Stack)`
  border-top: 1px solid var(--card-border-color);
`
const IconPickerFlex = styled(Flex)`
  max-height: 269px;
  max-width: 269px;
`

export interface BundleIconEditorPickerValue {
  hue: BundleDocument['hue']
  icon: BundleDocument['icon']
}

export function BundleIconEditorPicker(props: {
  onChange: (value: BundleIconEditorPickerValue) => void
  value: BundleIconEditorPickerValue
}): JSX.Element {
  const {onChange, value} = props

  const [open, setOpen] = useState(false)

  const [iconSearchQuery, setIconSearchQuery] = useState('')

  const handleIconSearchQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIconSearchQuery(event.target.value)
  }, [])

  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLDivElement | null>(null)

  const handleClickOutside = useCallback(() => {
    setOpen(false)
  }, [])

  const handleOnPickerOpen = useCallback(() => {
    setOpen((o) => !o)
  }, [])

  const handleHueChange = (hue: ColorHueKey) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onChange({...value, hue})
  }

  const handleIconChange = (icon: IconSymbol) => (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    onChange({...value, icon})
  }

  useClickOutside(handleClickOutside, [button, popover])

  return (
    <Popover
      content={
        <Container data-testid="popover-content">
          <Flex gap={1} padding={1}>
            {COLOR_HUES.map((hue) => (
              <Button
                key={hue}
                mode="bleed"
                onClick={handleHueChange(hue)}
                padding={1}
                selected={value.hue === hue}
                data-testid={`hue-button-${hue}`}
              >
                <Avatar color={hue} size={0} />
              </Button>
            ))}
          </Flex>
          <StyledStack>
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
            <IconPickerFlex gap={1} overflow="auto" padding={1} wrap="wrap">
              {Object.entries(icons)
                .filter(([key]) => !iconSearchQuery || key.includes(iconSearchQuery.toLowerCase()))
                .map(([key, icon]) => (
                  <Button
                    icon={icon}
                    key={key}
                    mode="bleed"
                    onClick={handleIconChange(key as IconSymbol)}
                    padding={2}
                    data-testId={`icon-button-${key}`}
                  />
                ))}
            </IconPickerFlex>
          </StyledStack>
        </Container>
      }
      open={open}
      placement="bottom-start"
      portal
      ref={setPopover}
    >
      <div>
        <Button
          mode="bleed"
          onClick={handleOnPickerOpen}
          padding={0}
          ref={setButton}
          selected={open}
          radius="full"
          data-testid="icon-picker-button"
        >
          <BundleBadge hue={value.hue} icon={value.icon} />
        </Button>
      </div>
    </Popover>
  )
}
