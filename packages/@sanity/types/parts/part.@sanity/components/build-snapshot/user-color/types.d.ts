import {ColorTints} from '@sanity/color'
import {Observable} from 'rxjs'
export declare type HexColor = string
export declare type UserColorHue = string
export declare type UserId = string
export declare type UserColor = Readonly<{
  background: HexColor
  border: HexColor
  text: HexColor
  tints: ColorTints
}>
export interface UserColorManager {
  get: (userId: UserId | null) => UserColor
  listen: (userId: UserId) => Observable<UserColor>
}
