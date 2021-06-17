import {JSDOM} from 'jsdom'
import defaultSchema from '../../../fixtures/defaultSchema'

const blockContentType = defaultSchema
  .get('blogPost')
  .fields.find((field: any) => field.name === 'body').type

export default (html: string, blockTools: any, commonOptions: any) => {
  const findElement = (nodes: any, target: any) =>
    nodes.find((i: ChildNode) => i.nodeName.toLowerCase() === target)

  function getCtaBlock(ctaNodes: ChildNode[]) {
    const title = findElement(ctaNodes, 'h2')
    const intro = findElement(ctaNodes, 'div')?.childNodes[0]
    const anchor = findElement(ctaNodes, 'a')

    return {
      _type: 'promo',
      title: title.textContent,
      intro: blockTools.htmlToBlocks(intro.innerHTML, blockContentType, {
        parseHtml: (_html: string) => new JSDOM(_html).window.document,
      }),
      link: {
        _type: 'link',
        url: anchor.href,
      },
    }
  }

  const rules = [
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deserialize(el: Element, next: any, block: any) {
        if (el.tagName.toLowerCase() === 'cta') {
          const items = Array.from(el.childNodes)
          return block(getCtaBlock(items))
        }
        return undefined
      },
    },
  ]
  const options = {
    ...commonOptions,
    rules,
  }
  return blockTools.htmlToBlocks(html, blockContentType, options)
}
