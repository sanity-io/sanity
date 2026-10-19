// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit ef8bd9ec7f, lib/explorations/variants-2-0/mark/versionLines.ts).
// Changes from the original: imports point at this monorepo and ./types; nothing else, except where marked "LIVE:".
import {audienceLines, type AudienceVersion} from './types'

/** One line of the popover: an audience (or the base document) and its versions. */
export type VersionLine = {audience: string; states: AudienceVersion[]}

/** Minutes since the line's newest edit; a line with no edit time sorts last. */
const edited = (line: VersionLine) =>
  Math.min(...line.states.map((s) => s.updatedMinutesAgo ?? Infinity))

/**
 * The popover's lines: the base document first as "All users (Default)", then the audiences sorted
 * by their most recent edit, newest first. Only the first `max` are returned. `more` counts the
 * versions on the lines that did not fit.
 */
export function versionLines(
  versions: readonly AudienceVersion[],
  options: {max: number},
): {lines: VersionLine[]; more: number} {
  const base = versions.filter((v) => v.audience === null)
  const sorted = [...audienceLines(versions)].sort((a, b) => {
    const [x, y] = [edited(a), edited(b)]
    return x === y ? 0 : x < y ? -1 : 1
  })
  const ordered: VersionLine[] = [
    ...(base.length ? [{audience: 'All users (Default)', states: [...base]}] : []),
    ...sorted,
  ]
  return {
    lines: ordered.slice(0, options.max),
    more: ordered.slice(options.max).reduce((n, line) => n + line.states.length, 0),
  }
}

/** "and 7 more versions": the footer of the read-only popover. */
export const moreText = (more: number) => `and ${more} more ${more === 1 ? 'version' : 'versions'}`
