import {Box, Text} from '@sanity/ui'
import {type CSSProperties, useMemo} from 'react'

export function PerspectiveBadge(props: {
  releaseTitle?: string
  // TODO: prep work for potentially reusing this on document headers
  documentStatus: 'draft' | 'published' | 'version'
}): JSX.Element | null {
  const {releaseTitle = 'draft', documentStatus} = props
  const isPublished = documentStatus === 'published'
  const isDraft = documentStatus === 'draft'

  const displayTitle = useMemo(() => {
    if (isPublished) {
      return 'published'
    }

    if (isDraft) {
      return 'edited'
    }

    return releaseTitle
  }, [isDraft, isPublished, releaseTitle])

  return (
    <Box
      padding={1}
      style={
        {
          color: `var(--card-badge-caution-fg-color)`,
          backgroundColor: `var(--card-badge-caution-bg-color)`,
          borderRadius: 3,
          textDecoration: 'none',
        } as CSSProperties
      }
    >
      <Text size={1}>{displayTitle}</Text>
    </Box>
  )
}
