import React from 'react'
import PropTypes from 'prop-types'
import {ColorWrap, Checkboard, Saturation, Hue, Alpha} from 'react-color/lib/components/common'
import {Box, Card, Flex, Button, Inline, Stack, Text} from '@sanity/ui'
import {TrashIcon} from '@sanity/icons'
import styled from 'styled-components'
import {ColorPickerFields} from './ColorPickerFields'

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

const ColorPicker = ({
  width,
  rgb,
  hex,
  hsv,
  hsl,
  onChange,
  onUnset,
  disableAlpha,
  renderers,
  readOnly,
}) => {
  return (
    <div style={{width}}>
      <Card padding={1} border radius={1}>
        <Stack space={2}>
          {!readOnly && (
            <>
              <Card overflow="hidden" style={{position: 'relative', height: '5em'}}>
                <Saturation is="Saturation" onChange={onChange} hsl={hsl} hsv={hsv} />
              </Card>

              <Card
                shadow={1}
                radius={3}
                overflow="hidden"
                style={{position: 'relative', height: '10px'}}
              >
                <Hue is="Hue" hsl={hsl} onChange={!readOnly && onChange} />
              </Card>

              {!disableAlpha && (
                <Card
                  shadow={1}
                  radius={3}
                  overflow="hidden"
                  style={{position: 'relative', height: '10px'}}
                >
                  <Alpha is="Alpha" rgb={rgb} hsl={hsl} renderers={renderers} onChange={onChange} />
                </Card>
              )}
            </>
          )}
          <Flex>
            <Card
              flex={1}
              radius={2}
              overflow="hidden"
              style={{position: 'relative', minWidth: '4em'}}
            >
              <Checkboard />
              <ColorBox style={{backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`}} />

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
                        {rgb.r} {rgb.g} {rgb.b}
                      </Text>
                      <Text size={1}>
                        <strong>HSL: </strong> {Math.round(hsl.h)} {Math.round(hsl.s)}%{' '}
                        {Math.round(hsl.l)}
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
        </Stack>
      </Card>
    </div>
  )
}

ColorPicker.propTypes = {
  width: PropTypes.string,
  hex: PropTypes.string,
  hsl: PropTypes.object,
  hsv: PropTypes.object,
  rgb: PropTypes.object,
  onChange: PropTypes.func,
  disableAlpha: PropTypes.bool,
  readOnly: PropTypes.bool,
  renderers: PropTypes.func,
  onUnset: PropTypes.func,
}

ColorPicker.defaultProps = {
  disableAlpha: false,
}

export default ColorWrap(ColorPicker)
