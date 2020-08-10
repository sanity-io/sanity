import {UserColorManager} from '@sanity/base'
import {Annotation} from '../panes/documentPane/history/types'

// interface RGB {
//   red: number
//   green: number
//   blue: number
// }

interface UserColors {
  blue: {bg: string; fg: string}
  cyan: {bg: string; fg: string}
  // green: {bg: string; fg: string}
  yellow: {bg: string; fg: string}
  orange: {bg: string; fg: string}
  // red: {bg: string; fg: string}
  magenta: {bg: string; fg: string}
  purple: {bg: string; fg: string}
}

// @todo: get these values from a global theme object
const color: UserColors = {
  blue: {bg: '#E8F1FE', fg: '#1B50A5'},
  cyan: {bg: '#E2F4FD', fg: '#15628C'},
  yellow: {bg: '#FEF7DA', fg: '#756623'},
  orange: {bg: '#FEF0E6', fg: '#914E23'},
  magenta: {bg: '#FCEBF5', fg: '#902A6C'},
  purple: {bg: '#F8E9FE', fg: '#7B1EA5'}
}

// function multiply(rgb1: RGB, rgb2: RGB) {
//   return {
//     red: Math.floor((rgb1.red * rgb2.red) / 255),
//     green: Math.floor((rgb1.green * rgb2.green) / 255),
//     blue: Math.floor((rgb1.blue * rgb2.blue) / 255)
//   }
// }

export function getAnnotationColor(
  colorManager: UserColorManager,
  annotation: Annotation
): {bg: string; fg: string} {
  if (annotation.type === 'unchanged') {
    return {bg: '#fcc', fg: '#f00'}
  }

  const hueKey = colorManager.get(annotation.author)
  return color[hueKey]
}
