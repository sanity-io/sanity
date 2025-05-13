import {Flex} from '@sanity/ui'
import {memo} from 'react'
import type {Color, ColorChangeHandler} from 'react-color'
import {styled} from 'styled-components'
import tinycolor from 'tinycolor2'

const ColorListWrap = styled(Flex)`
  gap: 0.25em;
`

const ColorBoxContainer = styled.div`
  width: 2.1em;
  height: 2.1em;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border-radius: 3px;
  background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBgEGHAD97gk2YcNYBhmIQBgWSAP52AwoAQwJvQRg1gACckQoC2gQgAIF8IscwEtKYAAAAASUVORK5CYII=')
    left center #fff;
`

const ColorBox = styled.div`
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px var(--card-shadow-outline-color);
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
`

interface ValidatedColor {
  color: Color
  backgroundColor: string
}

interface ColorListProps {
  colors?: Array<Color>
  onChange: ColorChangeHandler<Color>
}

const validateColors = (colors: Array<Color>) =>
  colors.reduce((cls: Array<ValidatedColor>, c) => {
    // @ts-expect-error fix types later
    const color = c.hex ? tinycolor(c.hex) : tinycolor(c)
    if (color.isValid()) {
      cls.push({
        color: c,
        backgroundColor: color.toRgbString(),
      })
    }
    return cls
  }, [])

export const ColorList = memo(function ColorList({colors, onChange}: ColorListProps) {
  if (!colors) return null
  return (
    <ColorListWrap wrap="wrap">
      {validateColors(colors).map(({color, backgroundColor}, idx) => (
        <ColorBoxContainer
          key={`${backgroundColor}-${idx}`}
          onClick={() => {
            onChange(color)
          }}
        >
          <ColorBox style={{background: backgroundColor}} />
        </ColorBoxContainer>
      ))}
    </ColorListWrap>
  )
})
