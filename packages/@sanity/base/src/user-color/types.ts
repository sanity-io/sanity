export type UserColorHue =
  | 'blue'
  | 'cyan'
  // | 'green'
  | 'yellow'
  | 'orange'
  // | 'red'
  | 'magenta'
  | 'purple'

export interface UserColorManager {
  get: (userId: string) => UserColorHue
}
