import {ColorHueKey, ColorTints} from '@sanity/color'
import {Observable} from 'rxjs'

// For better readability
export type HexColor = string
export type UserColorHue = string
export type UserId = string

export interface UserColor {
  name: ColorHueKey
  background: HexColor
  border: HexColor
  text: HexColor
  tints: ColorTints
}

export interface UserColorManager {
  get: (userId: UserId | null) => UserColor
  listen: (userId: UserId) => Observable<UserColor>
}
