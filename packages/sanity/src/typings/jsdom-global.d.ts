declare module 'jsdom-global' {
  const jsdomGlobal: (defaultHtml: string, options: {url: string}) => () => void
  export default jsdomGlobal
}
