import React from 'react'
import * as color from 'react-color/lib/helpers/color'
import {EditableInput} from 'react-color/lib/components/common'
import {Box, Flex, useTheme} from '@sanity/ui'

export const ColorPickerFields = ({onChange, rgb, hsl, hex, disableAlpha}) => {
  const {sanity} = useTheme()

  const inputStyles = {
    input: {
      width: '80%',
      padding: '4px 10% 3px',
      border: 'none',
      boxShadow: `inset 0 0 0 1px ${sanity.color.input.default.enabled.border}`,
      color: sanity.color.input.default.enabled.fg,
      backgroundColor: sanity.color.input.default.enabled.bg,
      fontSize: sanity.fonts.text.sizes[0].fontSize,
      textAlign: 'center',
    },
    label: {
      display: 'block',
      textAlign: 'center',
      fontSize: sanity.fonts.label.sizes[0].fontSize,
      color: sanity.color.base.fg,
      paddingTop: '3px',
      paddingBottom: '4px',
      textTransform: 'capitalize',
    },
  }

  const handleChange = (data, e) => {
    if (data.hex && color.isValidHex(data.hex)) {
      onChange(
        {
          hex: data.hex,
          source: 'hex',
        },
        e
      )
    } else if (data.r || data.g || data.b) {
      onChange(
        {
          r: data.r || rgb.r,
          g: data.g || rgb.g,
          b: data.b || rgb.b,
          a: rgb.a,
          source: 'rgb',
        },
        e
      )
    } else if (data.a) {
      if (data.a < 0) {
        data.a = 0
      } else if (data.a > 100) {
        data.a = 100
      }

      data.a /= 100
      onChange(
        {
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
          a: data.a,
          source: 'rgb',
        },
        e
      )
    }
  }

  return (
    <Flex>
      <Box flex={2} marginRight={1}>
        <EditableInput
          style={inputStyles}
          label="hex"
          value={hex.replace('#', '')}
          onChange={handleChange}
        />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput
          style={inputStyles}
          label="r"
          value={rgb.r}
          onChange={handleChange}
          dragLabel="true"
          dragMax="255"
        />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput
          style={inputStyles}
          label="g"
          value={rgb.g}
          onChange={handleChange}
          dragLabel="true"
          dragMax="255"
        />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput
          style={inputStyles}
          label="b"
          value={rgb.b}
          onChange={handleChange}
          dragLabel="true"
          dragMax="255"
        />
      </Box>
      {!disableAlpha && (
        <Box flex={1}>
          <EditableInput
            style={inputStyles}
            label="a"
            value={Math.round(rgb.a * 100)}
            onChange={handleChange}
            dragLabel="true"
            dragMax="100"
          />
        </Box>
      )}
    </Flex>
  )
}

export default ColorPickerFields
