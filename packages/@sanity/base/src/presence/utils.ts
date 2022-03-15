export const splitRight = <T>(array: T[], max: number): [T[], T[]] => {
  const indexFromMax = array.length > max ? max - 1 : max
  const idx = Math.max(0, array.length - indexFromMax)
  return [array.slice(0, idx), array.slice(idx)]
}

// export const splitRight = <T>(array: T[], index: number): [T[], T[]] => {
//   const idx = Math.max(0, array.length - index)
//   return [array.slice(0, idx), array.slice(idx)]
// }
//
export const split = <T>(array: T[], index: number): [T[], T[]] => {
  const idx = Math.max(0, index)
  return [array.slice(0, idx), array.slice(idx)]
}
