import React from 'react'
import styled from 'styled-components'
import {COLOR_HUES, hues} from '@sanity/color'
import {darken, lighten, hasBadContrast, readableColor} from 'color2k'

function pseudoRandomNumber(seed: string) {
  const hashCode = seed
    .split('')
    // eslint-disable-next-line no-bitwise
    .reduce((prevHash, currVal) => ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0, 0)
  return Math.abs((hashCode * 16807) % 2147483647) / 2147483647
}

const SvgText = styled.text`
  font-family: ${({theme}) => theme.sanity.fonts.heading.family};
  font-weight: ${({theme}) => theme.sanity.fonts.heading.weights.bold};
  font-size: 16px;
  transform: translateY(1px);
`

/**
 * Creates an icon element based on the input title
 */
export function createDefaultIcon(title: string, subtitle: string) {
  const rng1 = pseudoRandomNumber(`${title} ${subtitle}`)

  const huesWithoutGray = COLOR_HUES.filter((hue) => hue !== 'gray')
  const colorHue = huesWithoutGray[Math.floor(rng1 * huesWithoutGray.length)]
  const possibleTints = ['300', '400', '500', '600', '700'] as const
  const rng2 = pseudoRandomNumber(rng1.toString())
  const tint = possibleTints[Math.floor(rng2 * possibleTints.length)]
  const color = hues[colorHue][tint].hex

  const letters = title
    // split by whitespace
    .split(/\s/g)
    // replace all non-word characters with empty string
    .map((word) => word.replace(/\\W/g, ''))
    // remove empty strings
    .filter(Boolean)
    // take the first two words
    .slice(0, 2)
    // grab the first letter and make it upper case
    .map((i) => i.charAt(0).toUpperCase())

  const darkened = darken(color, 0.4)
  const lightened = lighten(color, 0.4)

  /* eslint-disable no-negated-condition */
  // eslint-disable-next-line no-nested-ternary
  const textColor = !hasBadContrast(color, 'readable', darkened)
    ? darkened
    : !hasBadContrast(color, 'readable', lightened)
      ? lightened
      : readableColor(color)
  /* eslint-enable no-negated-condition */

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <rect width={32} height={32} rx={2} fill={color} />
      <SvgText
        x="50%"
        y="50%"
        textAnchor="middle"
        alignmentBaseline="middle"
        dominantBaseline="middle"
        fill={textColor}
      >
        {letters}
      </SvgText>
    </svg>
  )
}
