import {white} from '@sanity/color'
import {forwardRef} from 'react'
import {styled} from 'styled-components'

export const NEW_SANITY_ORANGE = '#FF5500'
export const NEW_SANITY_BLACK = '#0D0E12'

const ConsistentMonogram = styled.svg`
  color-scheme: dark;
`

/**
 * @public
 */
export type SanityMonogramScheme = 'light' | 'dark' | 'default'

/**
 * @public
 * @deprecated use {@link SanityMonogramScheme} as the `scheme` prop instead
 */
export interface SanityMonogramColor {
  bg1: string
  /**
   * `bg2` is unused, use `bg1` instead
   */
  bg2: string
  fg: string
}

/**
 * @public
 */
export type SanityMonogramProps =
  | {color: SanityMonogramColor; scheme?: undefined}
  | {color?: undefined; scheme: SanityMonogramScheme}
  | {color?: undefined; scheme?: undefined}

const SANITY_MONOGRAM_COLOR: {[key in SanityMonogramScheme]: {bg: string; fg: string}} = {
  light: {bg: white.hex, fg: NEW_SANITY_BLACK},
  dark: {bg: NEW_SANITY_BLACK, fg: white.hex},
  default: {bg: NEW_SANITY_ORANGE, fg: NEW_SANITY_BLACK},
}

/**
 * @public
 */
export const SanityMonogram = forwardRef(function SanityMonogram(
  props: SanityMonogramProps & Omit<React.SVGProps<SVGSVGElement>, 'color'>,
  ref: React.Ref<SVGSVGElement>,
) {
  const {scheme = 'default', color, ...restProps} = props
  const bg = color?.bg1 || SANITY_MONOGRAM_COLOR[scheme].bg
  const fg = color?.fg || SANITY_MONOGRAM_COLOR[scheme].fg

  return (
    <ConsistentMonogram
      data-sanity-icon="sanity-monogram"
      height="1em"
      viewBox="0 0 192 192"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...restProps}
      ref={ref}
    >
      <rect width="192" height="192" fill={bg} />
      <path
        d="M160.077 112.697L154.865 103.629L129.659 118.981L157.655 83.3368L161.888 80.8533L160.841 79.2802L162.764 76.8232L153.929 69.4699L149.886 74.6225L68.2657 122.375L98.4429 86.0855L154.651 55.2759L149.311 44.953L118.696 61.7277L133.771 43.6096L125.134 36L91.2055 76.7966L57.5083 95.2771L83.307 61.1709L99.4731 52.757L94.3391 42.3192L47.2403 66.8361L60.0839 49.8405L51.1123 42.6551L24 78.5378L24.4207 78.8736L29.486 89.1877L59.543 73.5354L32.1474 109.745L36.6375 113.342L39.3075 118.504L70.9528 101.154L36.1052 143.065L44.742 150.674L46.4762 148.588L130.543 99.2454L102.632 134.792L103.088 135.172L103.045 135.199L108.831 145.265L145.954 122.649L131.659 145.716L141.24 152L164 115.278L160.077 112.697Z"
        fill={fg}
      />
    </ConsistentMonogram>
  )
})
SanityMonogram.displayName = 'ForwardRef(SanityMonogram)'
