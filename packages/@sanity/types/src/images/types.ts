/**
 * NOTE: These are query parameters, so they will eventually be encoded as strings.
 * However, since most/all query parameter encoders will accept numbers and encode
 * them as strings, we'll use `string| number` where applicable, as it makes it easier
 * to use in places that do calculations and such.
 *
 * @internal
 */
export interface ImageUrlParams {
  'bg'?: string
  'dpr'?: number | string
  'w'?: number | string
  'h'?: number | string
  'q'?: number | string
  'dl'?: string
  'dlRaw'?: string
  'fp-x'?: number | string
  'fp-y'?: number | string
  'max-w'?: number | string
  'max-h'?: number | string
  'min-w'?: number | string
  'min-h'?: number | string
  'blur'?: number | string
  'sharp'?: number | string
  'rect'?: string // <x>,<y>,<w>,<h>
  'fm'?: ImageUrlFormat
  'or'?: ImageUrlOrientation
  'fit'?: ImageUrlFitMode
  'crop'?: ImageUrlCropMode
  'auto'?: ImageUrlAutoMode
  'invert'?: 'true' | 'false'
  'quality'?: number | string
  'flip'?: 'h' | 'v' | 'hv'
  'sat'?: number | string
  'pad'?: number | string
  'colorquant'?: number | string
  'border'?: string // <width>,<color>
}

/** @internal */
export type ImageUrlFormat = 'jpg' | 'pjpg' | 'png' | 'webp'

/** @internal */
export type ImageUrlFitMode = 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'

/** @internal */
export type ImageUrlCropMode =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'center'
  | 'focalpoint'
  | 'entropy' // EXPERIMENTAL

/** @internal */
export type ImageUrlAutoMode = 'format'

/** @internal */
export type ImageUrlOrientation = '0' | '90' | '180' | '270'
