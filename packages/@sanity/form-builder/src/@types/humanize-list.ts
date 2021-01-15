declare module 'humanize-list' {
  type Options = {
    oxfordComma?: boolean
    conjunction?: 'and' | string
    skipConjunction?: boolean
  }

  function humanizeList(array: string[], options?: Options): string
  export default humanizeList
}
