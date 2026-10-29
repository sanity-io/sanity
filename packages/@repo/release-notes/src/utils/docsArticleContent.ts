import {hoistInlineImages} from './hoistInlineImages'
import {type NormalizedMarkdownBlock} from './portabletext-markdown/markdownToPortableText'
import {type PortableTextBlock} from './portabletext-markdown/types'

type ListOverrides = Partial<Pick<PortableTextBlock, 'style' | 'listItem' | 'level'>>

type DocsArticleCodeBlock = {
  _type: 'codeBlock'
  _key: string
  blocks: {_key: string; code: NormalizedMarkdownBlock}[]
}

type DocsCalloutType = 'error' | 'info' | 'tip' | 'warning'

type DocsArticleCallout = {
  _type: 'docsCallout'
  _key: string
  type: DocsCalloutType
  content: NormalizedMarkdownBlock[]
}

export type DocsArticleBlock = NormalizedMarkdownBlock | DocsArticleCodeBlock | DocsArticleCallout

const CALLOUT_TONE_TO_DOCS_TYPE: Record<string, DocsCalloutType> = {
  caution: 'error',
  important: 'info',
  note: 'info',
  tip: 'tip',
  warning: 'warning',
}

export function toDocsArticleContent(
  block: NormalizedMarkdownBlock,
  overrides?: ListOverrides,
): DocsArticleBlock[] {
  if (block._type === 'horizontal-rule') {
    return []
  }

  if (block._type === 'code') {
    return [{_type: 'codeBlock', _key: block._key, blocks: [{_key: block._key, code: block}]}]
  }

  if (block._type === 'callout') {
    // docsCallout.content only allows `block` types with `normal` style, so
    // images (block-level or hoisted from inline) are dropped here.
    return [
      {
        _type: 'docsCallout',
        _key: block._key,
        type: CALLOUT_TONE_TO_DOCS_TYPE[block.tone] ?? 'info',
        content: block.content.flatMap((innerBlock) =>
          innerBlock._type === 'block'
            ? hoistInlineImages(innerBlock).flatMap((hoisted) =>
                hoisted._type === 'block'
                  ? [normalizeLinkMarkDefs({...hoisted, style: 'normal'})]
                  : [],
              )
            : [],
        ),
      },
    ]
  }

  if (block._type === 'block') {
    return hoistInlineImages(block).map((hoisted) =>
      hoisted._type === 'block'
        ? normalizeLinkMarkDefs(overrides ? {...hoisted, ...overrides} : hoisted)
        : hoisted,
    )
  }

  return [block]
}

function normalizeLinkMarkDefs(block: PortableTextBlock): PortableTextBlock {
  if (!Array.isArray(block.markDefs) || block.markDefs.length === 0) {
    return block
  }

  return {
    ...block,
    markDefs: block.markDefs.map((markDef) => {
      if (markDef._type !== 'link' || typeof markDef.url === 'string') {
        return markDef
      }
      const {href, ...rest} = markDef
      if (typeof href !== 'string') {
        return markDef
      }
      return {...rest, url: href}
    }),
  }
}
