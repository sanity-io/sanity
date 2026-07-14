import {type NormalizedMarkdownBlock} from './portabletext-markdown/markdownToPortableText'
import {type PortableTextBlock, type PortableTextImage} from './portabletext-markdown/types'

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
 * - GitHub-style alerts (`> [!NOTE]`) become `callout` blocks. The docs article
 *   schema has no matching type (its `docsCallout` uses a different, enum-
 *   constrained shape), so callouts are unwrapped into their inner content.
 * - Fenced code becomes a `code` block; the docs article wraps code in `codeBlock`.
 * - Only text blocks carry `style`/`listItem`/`level` props, so list overrides are
 *   applied to text blocks only (never to images, tables, etc.).
 * - The markdown `link` annotation stores its destination in `href`, but the docs
 *   article `link` annotation requires `url` (see {@link normalizeLinkMarkDefs}).
 * - Inline images and the `blockquote` style are not valid in the docs article
 *   schema; see {@link toDocsArticleTextBlocks}.
 *
 * Returns an array so callers can `flatMap` and drop/expand blocks as needed.
 */
export function toDocsArticleContent(
  block: NormalizedMarkdownBlock,
  overrides?: ListOverrides,
): DocsArticleBlock[] {
  if (block._type === 'horizontal-rule') {
    return []
  }

  if (block._type === 'callout') {
    return block.content.flatMap((inner) => toDocsArticleContent(inner, overrides))
  }

  if (block._type === 'code') {
    return [{_type: 'codeBlock', _key: block._key, blocks: [{_key: block._key, code: block}]}]
  }

  if (block._type === 'block') {
    return toDocsArticleTextBlocks(block, overrides)
  }

  return [block]
}

/**
 * Normalize a text block for the docs article schema:
 *
 * - Inline images are not a valid inline object ("Could not find Sanity schema
 *   type for inline object: image"), so they are lifted out into block-level
 *   image objects placed right after the text block.
 * - The `blockquote` style (from markdown blockquotes and unwrapped callouts) is
 *   not allowed, so it is coerced to `normal`.
 * - `link` mark definitions are converted from `href` to `url`.
 * - List overrides are applied last so callers can force list styling.
 */
function toDocsArticleTextBlocks(
  block: PortableTextBlock,
  overrides?: ListOverrides,
): DocsArticleBlock[] {
  const inlineImages: PortableTextImage[] = []
  const children = block.children.filter((child) => {
    if (child._type === 'image') {
      inlineImages.push(child)
      return false
    }
    return true
  })

  const results: DocsArticleBlock[] = []

  // Only keep the text block if it still has content once inline images are removed.
  if (children.length > 0) {
    results.push(
      normalizeLinkMarkDefs({
        ...block,
        style: block.style === 'blockquote' ? 'normal' : block.style,
        children,
        ...overrides,
      }),
    )
  }

  results.push(...inlineImages)

  return results
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
