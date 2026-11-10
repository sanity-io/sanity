import {type CSSProperties, useState} from 'react'
import {Link, Text} from 'ui5'

import {releaseUrl} from '../trends/links'
import {type TagSlice} from './data'

// A real button (keyboard/AT-correct), styled as the surrounding link text
const linkButtonStyle: CSSProperties = {
  background: 'none',
  border: 0,
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  textDecoration: 'underline',
  cursor: 'pointer',
}

/**
 * @sanity/ui v5 removes styling for nested a tags. As a stop gap, apply the
 * current v4 color as an inline style.
 */
const LINK_IN_TEXT: CSSProperties = {color: 'var(--card-link-color)'}

/**
 * "Included in v6.9.2 (stable), v6.10.0, … +12 more" — the releases whose
 * ancestry contains a commit, truncated past a few with an inline expander.
 */
export function IncludedIn(props: {releases: TagSlice[]}) {
  const {releases} = props
  const [expanded, setExpanded] = useState(false)
  const limit = 3
  const visible = expanded ? releases : releases.slice(0, limit)
  const hiddenCount = releases.length - visible.length
  return (
    <Text size={1} muted as="div" trim={true} style={{color: 'var(--card-muted-fg-color)'}}>
      {releases.length === 0 ? (
        'Not included in any release yet.'
      ) : (
        <>
          Included in{' '}
          {visible.map((release, index) => (
            <span key={release.tag}>
              {index > 0 && ', '}
              <Link
                href={releaseUrl(release.tag)}
                openInNewTab
                underlined={false}
                style={LINK_IN_TEXT}
              >
                {release.tag}
              </Link>
              {release.npm?.distTags?.length ? ` (${release.npm.distTags.join(', ')})` : ''}
            </span>
          ))}
          {hiddenCount > 0 && (
            <>
              {' '}
              <button type="button" style={linkButtonStyle} onClick={() => setExpanded(true)}>
                +{hiddenCount} more
              </button>
            </>
          )}
          {expanded && releases.length > limit && (
            <>
              {' '}
              <button type="button" style={linkButtonStyle} onClick={() => setExpanded(false)}>
                show less
              </button>
            </>
          )}
        </>
      )}
    </Text>
  )
}
