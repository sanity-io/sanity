// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit ef8bd9ec7f, lib/explorations/variants-2-0/mark/VersionDescription.tsx).
// Changes from the original: imports point at this monorepo and ./types; nothing else, except where marked "LIVE:".
import {Fragment} from 'react'

import {type AudienceVersion} from './types'
import {useVersionTime} from './time'
import {moreText, type VersionLine} from './versionLines'

const lower = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

/** One version in words: the state, then the Studio's own time wording ("Published 2 wk. ago"). */
function StateText({version}: {version: AudienceVersion}) {
  const time = useVersionTime(version)
  switch (version.state) {
    case 'published':
      return <>{time ?? 'Published'}</>
    case 'draft':
      return <>{time ? `Draft, ${lower(time)}` : 'Draft'}</>
    case 'scheduled': {
      const when = [version.release, [version.when, version.at].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(', ')
      return <>{['Scheduled', when].filter(Boolean).join(' ') + (time ? `, ${lower(time)}` : '')}</>
    }
    case 'asap':
      return (
        <>
          {(version.release ? `ASAP, ${version.release}` : 'ASAP') +
            (time ? `, ${lower(time)}` : '')}
        </>
      )
    case 'undecided':
      return (
        <>
          {(version.release ? `Undecided, ${version.release}` : 'Undecided') +
            (time ? `, ${lower(time)}` : '')}
        </>
      )
  }
}

/**
 * The popover as text, for the control's accessible description: what a screen reader says on
 * focus. The time of each version uses the Studio's real key function and `useRelativeTime`.
 */
export function VersionDescription(props: {
  id: string
  lines: readonly VersionLine[]
  more: number
}) {
  return (
    <span
      data-testid="version-description"
      id={props.id}
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        whiteSpace: 'nowrap',
      }}
    >
      {'All users first, then the newest edit first. '}
      {props.lines.map((line, i) => (
        <Fragment key={line.audience}>
          {i ? '. ' : ''}
          {`${line.audience}: `}
          {line.states.map((v, j) => (
            <Fragment key={j}>
              {j ? '; ' : ''}
              <StateText version={v} />
            </Fragment>
          ))}
        </Fragment>
      ))}
      {props.more ? `. ${moreText(props.more)}` : ''}
      {'.'}
    </span>
  )
}
