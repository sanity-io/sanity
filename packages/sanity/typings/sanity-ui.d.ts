import {type Theme} from '@sanity/ui/theme'

declare module 'styled-components' {
  interface DefaultTheme extends Theme {}
}
