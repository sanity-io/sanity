import {type NormalizedMarkdownBlock} from './portabletext-markdown/markdownToPortableText'
import {type PortableTextBlock} from './portabletext-markdown/types'

type ListOverrides = Partial<Pick<PortableTextBlock, 'style' | 'listItem' | 'level'>>

type DocsArticleCodeBlock = {
  _type: 'codeBlock'
  _key: string
  blocks: {_key: string; code: NormalizedMarkdownBlock}[]
}

export type DocsArticleBlock = NormalizedMarkdownBlock | DocsArticleCodeBlock

/**
 * Convert a single changelog-entry block into the shape expected by the docs
 * article content schema (used by `apiChange.releaseAutomation.suggestedContent`).
 *
 * Changelog-entry contents come straight from `@portabletext/markdown`, which
 * targets a different — and more permissive — schema than the docs article, so a
 * few things have to be reconciled before they validate as suggested content:
 *
 * - Markdown thematic breaks (`---`) become `horizontal-rule` blocks. Sanity type
 *   names cannot contain hyphens and the docs article schema does not allow that
 *   block, so they are dropped.
 * - Fenced code becomes a `code` block; the docs article wraps code in `codeBlock`.
 * - Only text blocks carry `style`/`listItem`/`level` props, so list overrides are
 *   applied to text blocks only (never to images, tables, etc.).
 * - The markdown `link` annotation stores its destination in `href`, but the docs
 *   article `link` annotation requires `url` (see {@link normalizeLinkMarkDefs}).
 *
 * Returns an array so callers can `flatMap` and drop unsupported blocks.
 */
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

  if (block._type === 'block') {
    return [normalizeLinkMarkDefs(overrides ? {...block, ...overrides} : block)]
  }

  return [block]
}

/**
 * Rename `href` → `url` on `link` mark definitions so they satisfy the docs
 * article `link` annotation, which requires a `url` field. Mark definitions that
 * already have a `url`, or that are not links, are left untouched.
 */
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
