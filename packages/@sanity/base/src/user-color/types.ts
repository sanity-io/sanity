import {Observable} from 'rxjs'

// For better readability
export type UserColorHue = string
export type HexColor = string

export type UserColor = Readonly<{
  background: HexColor
  text: HexColor
  border: HexColor
}>

export interface UserColorManager {
  get: (userId: string) => UserColor
  listen: (userId: string) => Observable<UserColor>
}
