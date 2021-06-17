import {JSDOM} from 'jsdom'
import defaultSchema from '../../../fixtures/defaultSchema'

const blockContentType = defaultSchema.get('blogPost').fields.find((field) => field.name === 'body')
  .type

export default (html, blockTools, commonOptions) => {
  const findElement = (nodes, target) => nodes.find((i) => i.nodeName.toLowerCase() === target)

  function getCtaBlock(ctaNodes) {
    const title = findElement(ctaNodes, 'h2')
    const intro = findElement(ctaNodes, 'div')?.childNodes[0]
    const anchor = findElement(ctaNodes, 'a')

    return {
      _type: 'promo',
      title: title.textContent,
      intro: blockTools.htmlToBlocks(intro.innerHTML, blockContentType, {
        parseHtml: (_html) => new JSDOM(_html).window.document,
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
      deserialize(el, next, block) {
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
