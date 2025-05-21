import {type Theme} from '@sanity/ui/theme'

declare module 'styled-components' {
  // eslint-disable-next-line
  interface DefaultTheme extends Theme {}
}
