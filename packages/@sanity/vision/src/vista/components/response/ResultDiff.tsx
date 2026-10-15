import {type FileContents, type FileDiffOptions, MultiFileDiff} from '@pierre/diffs/react'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useMemo} from 'react'

export interface ResultDiffProps {
  previous: unknown
  next: unknown
}

function toFile(value: unknown): FileContents {
  // Indented like the copied and exported JSON, so a changed value is a changed line
  return {name: 'result.json', contents: `${JSON.stringify(value, null, 2)}\n`}
}

/**
 * Line diff of two query results, rendered by `@pierre/diffs` (Shiki highlighting in a shadow
 * root). Only loaded through `lazy()` once a history entry's changes are expanded.
 */
export default function ResultDiff({previous, next}: ResultDiffProps) {
  const {color, font} = useThemeV2()
  const codeSize = font.code.sizes[1]
  const oldFile = useMemo(() => toFile(previous), [previous])
  const newFile = useMemo(() => toFile(next), [next])
  const options = useMemo(
    (): FileDiffOptions<undefined, undefined> => ({
      diffStyle: 'unified',
      disableFileHeader: true,
      lineDiffType: 'word',
      overflow: 'wrap',
      themeType: color._dark ? 'dark' : 'light',
    }),
    [color._dark],
  )
  const style = useMemo(
    () =>
      assignInlineVars({
        '--diffs-font-family': font.code.family,
        '--diffs-font-size': `${codeSize.fontSize}px`,
        '--diffs-line-height': `${codeSize.lineHeight}px`,
      }),
    [codeSize.fontSize, codeSize.lineHeight, font.code.family],
  )

  return <MultiFileDiff newFile={newFile} oldFile={oldFile} options={options} style={style} />
}
