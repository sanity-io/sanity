import {TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {type Color, CustomPicker} from 'react-color'
import {Alpha, Checkboard, Hue, Saturation} from 'react-color/lib/components/common'
import type {CustomPickerInjectedProps} from 'react-color/lib/components/common/ColorWrap'
import {styled} from 'styled-components'

import {ColorList} from './ColorList'
import {ColorPickerFields} from './ColorPickerFields'
import type {ColorValue} from './types'

const ColorBox = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const ReadOnlyContainer = styled(Flex)`
  margin-top: 6rem;
  background-color: var(--card-bg-color);
  position: relative;
  width: 100%;
`

export interface ColorPickerProps extends CustomPickerInjectedProps<Color> {
  width?: string
  disableAlpha: boolean
  colorList?: Array<Color>
  readOnly?: boolean
  onUnset: () => void
  color: ColorValue
}

const ColorPickerInner = (props: ColorPickerProps) => {
  const {
    width,
    color: {rgb, hex, hsv, hsl},
    onChange,
    onUnset,
    disableAlpha,
    colorList,
    readOnly,
  } = props

  if (!hsl || !hsv) {
    return null
  }

  return (
    <div style={{width}}>
      <Card padding={1} border radius={1}>
        <Stack space={2}>
          {!readOnly && (
            <>
              <Card overflow="hidden" style={{position: 'relative', height: '5em'}}>
                <Saturation onChange={onChange} hsl={hsl} hsv={hsv} />
              </Card>

              <Card
                shadow={1}
                radius={3}
                overflow="hidden"
                style={{position: 'relative', height: '10px'}}
              >
                <Hue hsl={hsl} onChange={!readOnly && onChange} />
              </Card>

              {!disableAlpha && (
                <Card
                  shadow={1}
                  radius={3}
                  overflow="hidden"
                  style={{position: 'relative', height: '10px', background: '#fff'}}
                >
                  <Alpha rgb={rgb} hsl={hsl} onChange={onChange} />
                </Card>
              )}
            </>
          )}
          <Flex>
            <Card
              flex={1}
              radius={2}
              overflow="hidden"
              style={{position: 'relative', minWidth: '4em', background: '#fff'}}
            >
              <Checkboard
                size={8}
                white="transparent"
                grey="rgba(0,0,0,.08)"
                renderers={{} as {canvas: unknown}}
              />
              <ColorBox
                style={{
                  backgroundColor: `rgba(${rgb?.r},${rgb?.g},${rgb?.b},${rgb?.a})`,
                }}
              />

              {readOnly && (
                <ReadOnlyContainer
                  padding={2}
                  paddingBottom={1}
                  sizing="border"
                  justify="space-between"
                >
                  <Stack space={3} marginTop={1}>
                    <Text size={3} weight="bold">
                      {hex}
                    </Text>

                    <Inline space={3}>
                      <Text size={1}>
                        <strong>RGB: </strong>
                        {rgb?.r} {rgb?.g} {rgb?.b}
                      </Text>
                      <Text size={1}>
                        <strong>HSL: </strong> {Math.round(hsl?.h ?? 0)}{' '}
                        {Math.round((hsl?.s ?? 0) * 100)}% {Math.round((hsl?.l ?? 0) * 100)}%
                      </Text>
                    </Inline>
                  </Stack>
                </ReadOnlyContainer>
              )}
            </Card>

            {!readOnly && (
              <Flex align="flex-start" marginLeft={2}>
                <Box style={{width: 200}}>
                  <ColorPickerFields
                    rgb={rgb}
                    hsl={hsl}
                    hex={hex}
                    onChange={onChange}
                    disableAlpha={disableAlpha}
                  />
                </Box>
                <Box marginLeft={2}>
                  <Button onClick={onUnset} title="Delete color" icon={TrashIcon} tone="critical" />
                </Box>
              </Flex>
            )}
          </Flex>
          {colorList && <ColorList colors={colorList} onChange={onChange} />}
        </Stack>
      </Card>
    </div>
  )
}

export const ColorPicker = CustomPicker(ColorPickerInner)
