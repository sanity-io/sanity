import {type FileContents, FileDiff} from '@pierre/diffs'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useEffect, useMemo, useRef} from 'react'

export interface CodeDiffProps {
  previous: string
  next: string
  lang: 'json' | 'text'
}

/**
 * Line diff of two texts, rendered by `@pierre/diffs` (Shiki highlighting in a shadow root).
 * Only loaded through `lazy()` once a history entry's changes are expanded.
 */
export default function CodeDiff({previous, next, lang}: CodeDiffProps) {
  const {color, font} = useThemeV2()
  const codeSize = font.code.sizes[1]
  const wrapperRef = useRef<HTMLDivElement>(null)
  const oldFile = useMemo<FileContents>(
    () => ({name: `diff.${lang}`, contents: previous, lang}),
    [lang, previous],
  )
  const newFile = useMemo<FileContents>(
    () => ({name: `diff.${lang}`, contents: next, lang}),
    [lang, next],
  )
  const themeType = color._dark ? 'dark' : 'light'

  // The library's React components keep their container and hydrate whatever markup a previous
  // instance left in it, so after StrictMode detaches and re-attaches their ref they render
  // nothing. An instance per effect run with a container of its own (removed on clean up) has no
  // such markup to find
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return undefined
    const diff = new FileDiff({
      diffStyle: 'unified',
      // Thrown from `render` in this effect, a failure reaches the History panel's error
      // boundary and its Retry, rather than being drawn as a stack trace inside the diff
      disableErrorHandling: true,
      disableFileHeader: true,
      lineDiffType: 'word',
      overflow: 'wrap',
      themeType,
    })
    diff.render({containerWrapper: wrapper, newFile, oldFile})
    return () => diff.cleanUp()
  }, [newFile, oldFile, themeType])

  return (
    <div
      ref={wrapperRef}
      style={assignInlineVars({
        '--diffs-font-family': font.code.family,
        '--diffs-font-size': `${codeSize.fontSize}px`,
        '--diffs-line-height': `${codeSize.lineHeight}px`,
      })}
    />
  )
}
