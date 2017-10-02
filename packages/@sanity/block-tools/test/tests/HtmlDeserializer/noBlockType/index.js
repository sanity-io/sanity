export default (html, blockTools, commonOptions) => {
  const options = {
    ...commonOptions
  }
  return blockTools.htmlToBlocks(html, options)
}
