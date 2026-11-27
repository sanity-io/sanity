import {type FileContents, FileDiff, registerCustomTheme} from '@pierre/diffs'
import {useTheme, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {type CSSProperties, useEffect, useMemo, useRef} from 'react'

import {createHighlightSpecs} from '../../../codemirror/useCodemirrorTheme'
import {
  type CodeDiffScheme,
  codeDiffSyntaxProperties,
  codeDiffThemeName,
  createCodeDiffTheme,
} from '../../util/codeDiffTheme'
import * as styles from './CodeDiff.module.css'

// The themes' colors are custom properties, so they are registered once and never change
for (const scheme of ['light', 'dark'] as const) {
  registerCustomTheme(codeDiffThemeName(scheme), () => Promise.resolve(createCodeDiffTheme(scheme)))
}

/** The custom properties `@pierre/diffs` styles its markup with */
interface DiffsStyle extends CSSProperties {
  '--diffs-font-family': string
  '--diffs-font-size': string
  '--diffs-line-height': string
  '--diffs-header-font-family': string
}

export interface CodeDiffProps {
  previous: string
  next: string
  lang: 'json' | 'text'
}

/**
 * Line diff of two texts, rendered by `@pierre/diffs` (Shiki highlighting in a shadow root), in
 * the studio theme's colors and the editors' syntax colors.
 * Only loaded through `lazy()` once a history entry's changes are expanded.
 */
export default function CodeDiff({previous, next, lang}: CodeDiffProps) {
  const theme = useTheme()
  const {color, font} = useThemeV2()
  const codeSize = font.code.sizes[1]
  const wrapperRef = useRef<HTMLDivElement>(null)
  const syntax = useMemo(() => codeDiffSyntaxProperties(createHighlightSpecs(theme)), [theme])
  const oldFile = useMemo<FileContents>(
    () => ({name: `diff.${lang}`, contents: previous, lang}),
    [lang, previous],
  )
  const newFile = useMemo<FileContents>(
    () => ({name: `diff.${lang}`, contents: next, lang}),
    [lang, next],
  )
  // Picks the theme whose type sets the shadow root's color scheme, which the colors pierre mixes
  // for its chrome depend on
  const themeType: CodeDiffScheme = color._dark ? 'dark' : 'light'

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
      theme: codeDiffThemeName(themeType),
      themeType,
    })
    diff.render({containerWrapper: wrapper, newFile, oldFile})
    return () => diff.cleanUp()
  }, [newFile, oldFile, themeType])

  const style: DiffsStyle = {
    ...syntax,
    '--diffs-font-family': font.code.family,
    '--diffs-font-size': `${codeSize.fontSize}px`,
    '--diffs-line-height': `${codeSize.lineHeight}px`,
    '--diffs-header-font-family': font.text.family,
  }

  return <div className={styles.codeDiff} ref={wrapperRef} style={style} />
}
