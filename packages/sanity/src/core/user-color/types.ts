import {ColorHueKey, ColorTints} from '@sanity/color'
import {Observable} from 'rxjs'

/** @internal */
export type HexColor = string

/** @internal */
export type UserColorHue = string

/** @internal */
export type UserId = string

/** @internal */
export interface UserColor {
  name: ColorHueKey
  background: HexColor
  border: HexColor
  text: HexColor
  tints: ColorTints
}

/** @internal */
export interface UserColorManager {
  get: (userId: UserId | null) => UserColor
  listen: (userId: UserId) => Observable<UserColor>
}
