declare module 'attr-accept' {
  const attrAccept: (
    file: {name?: string; type: string},
    acceptedFiles: string | string[]
  ) => boolean

  export default attrAccept
}
