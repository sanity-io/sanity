declare module 'get-random-values' {
  declare function getRandomValues(array: Uint32Array): Uint32Array
  declare function getRandomValues(array: Uint8Array): Uint8Array
  export default getRandomValues
}
