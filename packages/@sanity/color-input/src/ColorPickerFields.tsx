import {Box, Flex, useTheme} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import type {Color, ColorChangeHandler, HSLColor, RGBColor} from 'react-color'
import {EditableInput} from 'react-color/lib/components/common'
import type {EditableInputStyles} from 'react-color/lib/components/common/EditableInput'
// @ts-expect-error missing export
import {isValidHex} from 'react-color/lib/helpers/color'

interface ColorPickerFieldsProps {
  rgb?: RGBColor
  hsl?: HSLColor
  hex?: string
  disableAlpha: boolean
  onChange: ColorChangeHandler<Color>
}

export const ColorPickerFields = ({
  onChange,
  rgb,
  hsl,
  hex,
  disableAlpha,
}: ColorPickerFieldsProps) => {
  const {sanity} = useTheme()

  const inputStyles: EditableInputStyles = useMemo(
    () => ({
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
    }),
    [sanity],
  )

  const handleChange: ColorChangeHandler<Record<string, string>> = useCallback(
    (data) => {
      if ('hex' in data && data['hex'] && isValidHex(data['hex'])) {
        onChange({
          hex: data['hex'],
          source: 'hex',
        })
      } else if (
        rgb &&
        (('r' in data && data['r']) || ('g' in data && data['g']) || ('b' in data && data['b']))
      ) {
        onChange({
          r: Number(data['r']) || rgb.r,
          g: Number(data['g']) || rgb.g,
          b: Number(data['b']) || rgb.b,
          a: rgb.a,
          source: 'rgb',
        })
      } else if (hsl && 'a' in data && data['a']) {
        let alpha = Number(data['a'])
        if (alpha < 0) {
          alpha = 0
        } else if (alpha > 100) {
          alpha = 100
        }
        alpha /= 100

        onChange({
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
          a: alpha,
          source: 'hsl',
        })
      }
    },
    [onChange, hsl, rgb],
  )

  return (
    <Flex>
      <Box flex={2} marginRight={1}>
        <EditableInput
          style={inputStyles}
          label="hex"
          value={hex?.replace('#', '')}
          onChange={handleChange}
        />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput
          style={inputStyles}
          label="r"
          value={rgb?.r}
          onChange={handleChange}
          dragLabel
          dragMax={255}
        />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput
          style={inputStyles}
          label="g"
          value={rgb?.g}
          onChange={handleChange}
          dragLabel
          dragMax={255}
        />
      </Box>
      <Box flex={1} marginRight={1}>
        <EditableInput
          style={inputStyles}
          label="b"
          value={rgb?.b}
          onChange={handleChange}
          dragLabel
          dragMax={255}
        />
      </Box>
      {!disableAlpha && (
        <Box flex={1}>
          <EditableInput
            style={inputStyles}
            label="a"
            value={Math.round((rgb?.a ?? 1) * 100)}
            onChange={handleChange}
            dragLabel
            dragMax={100}
          />
        </Box>
      )}
    </Flex>
  )
}
