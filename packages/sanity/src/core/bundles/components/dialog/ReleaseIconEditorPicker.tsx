import {COLOR_HUES, type ColorHueKey} from '@sanity/color'
import {icons, type IconSymbol, SearchIcon} from '@sanity/icons'
import {Avatar, Box, Container, Flex, Stack, TextInput, useClickOutside} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {Button, Popover, TooltipDelayGroupProvider} from '../../../../ui-components'
import {type BundleDocument} from '../../../store/bundles/types'
import {ReleaseBadge} from '../ReleaseBadge'

const StyledStack = styled(Stack)`
  border-top: 1px solid var(--card-border-color);
`
const IconPickerFlex = styled(Flex)`
  max-height: 269px;
  max-width: 269px;
`

export interface ReleaseIconEditorPickerValue {
  hue: BundleDocument['hue']
  icon: BundleDocument['icon']
}

export function ReleaseIconEditorPicker(props: {
  onChange: (value: ReleaseIconEditorPickerValue) => void
  value: ReleaseIconEditorPickerValue
}): JSX.Element {
  const {onChange, value} = props

  const [open, setOpen] = useState(false)

  const [iconSearchQuery, setIconSearchQuery] = useState('')

  const handleIconSearchQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setIconSearchQuery(event.target.value)
  }, [])

  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLDivElement | null>(null)

  const {t} = useTranslation()

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
            <TooltipDelayGroupProvider>
              {COLOR_HUES.map((hue) => (
                <Button
                  tooltipProps={{content: hue.replace(/-/g, ' ')}}
                  key={hue}
                  mode="bleed"
                  onClick={handleHueChange(hue)}
                  paddingY={1}
                  style={{padding: 0}}
                  selected={value.hue === hue}
                  data-testid={`hue-button-${hue}`}
                >
                  <Box style={{margin: '0 -4px'}}>
                    <Avatar color={hue} size={0} style={{padding: 0}} />
                  </Box>
                </Button>
              ))}
            </TooltipDelayGroupProvider>
          </Flex>
          <StyledStack>
            <Box padding={1}>
              <TextInput
                fontSize={1}
                icon={SearchIcon}
                onChange={handleIconSearchQueryChange}
                padding={2}
                placeholder={t('release.form.search-icon')}
                space={2}
                value={iconSearchQuery}
              />
            </Box>
            <IconPickerFlex gap={1} overflow="auto" padding={1} wrap="wrap">
              <TooltipDelayGroupProvider>
                {Object.entries(icons)
                  .filter(
                    ([key]) => !iconSearchQuery || key.includes(iconSearchQuery.toLowerCase()),
                  )
                  .map(([key, icon]) => (
                    <Button
                      tooltipProps={{content: key.replace(/-/g, ' ')}}
                      icon={icon}
                      key={key}
                      mode="bleed"
                      onClick={handleIconChange(key as IconSymbol)}
                      data-testId={`icon-button-${key}`}
                    />
                  ))}
              </TooltipDelayGroupProvider>
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
          tooltipProps={{content: t('release.form.search-icon-tooltip')}}
          mode="bleed"
          onClick={handleOnPickerOpen}
          ref={setButton}
          selected={open}
          style={{borderRadius: '50%'}}
          data-testid="icon-picker-button"
        >
          <Box style={{margin: -8}}>
            <ReleaseBadge hue={value.hue} icon={value.icon} />
          </Box>
        </Button>
      </div>
    </Popover>
  )
}
