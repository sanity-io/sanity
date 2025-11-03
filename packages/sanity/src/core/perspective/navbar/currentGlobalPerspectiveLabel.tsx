import {type ReleaseDocument} from '@sanity/client'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Button, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {type ReactNode, useCallback, useLayoutEffect, useRef, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {RELEASES_INTENT} from '../../releases/plugin'
import {isReleaseDocument} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'
import {oversizedButtonStyle} from '../styles'
import {type TargetPerspective} from '../types'

const OversizedButton = styled(IntentLink)`
  ${oversizedButtonStyle}
`

function AnimatedTextWidth({children, text}: {children: ReactNode; text: string}) {
  const textRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<null | number>(null) // in pixels
  const [isAnimating, setIsAnimating] = useState(false)

  useLayoutEffect(() => {
    if (!textRef.current) return
    const newWidth = textRef.current.offsetWidth
    setContainerWidth(newWidth)
  }, [text])

  const onAnimationStart = useCallback(() => {
    setIsAnimating(true)
  }, [])
  const onAnimationComplete = useCallback(() => {
    setIsAnimating(false)
  }, [])

  return (
    <motion.div
      style={{
        display: 'inline-block',
        width: containerWidth === null ? 'auto' : containerWidth, // use auto on first render
        overflow: isAnimating ? 'hidden' : 'visible',
      }}
      animate={{width: containerWidth || 'auto'}}
      transition={{type: 'spring', bounce: 0, duration: 0.3}}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
    >
      <div
        ref={textRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          verticalAlign: 'middle',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}

const ReleasesLink = ({selectedPerspective}: {selectedPerspective: ReleaseDocument}) => {
  const {t} = useTranslation()

  return (
    <Button
      as={OversizedButton}
      data-as="a"
      rel="noopener noreferrer"
      mode="bleed"
      padding={2}
      radius="full"
      style={{maxWidth: '180px', textOverflow: 'ellipsis'}}
      text={selectedPerspective.metadata?.title || t('release.placeholder-untitled-release')}
      intent={RELEASES_INTENT}
      params={{id: getReleaseIdFromReleaseDocumentId(selectedPerspective._id)}}
    />
  )
}

export function CurrentGlobalPerspectiveLabel({
  selectedPerspective,
}: {
  selectedPerspective: TargetPerspective
}): React.JSX.Element | null {
  const {t} = useTranslation()

  return (
    <AnimatedTextWidth
      text={isReleaseDocument(selectedPerspective) ? selectedPerspective._id : selectedPerspective}
    >
      {isPublishedPerspective(selectedPerspective) || isDraftPerspective(selectedPerspective) ? (
        <Box padding={2} style={{userSelect: 'none', overflow: 'hidden'}}>
          <Text size={1} textOverflow="ellipsis" weight="medium">
            {isPublishedPerspective(selectedPerspective)
              ? t('release.chip.published')
              : t('release.chip.global.drafts')}
          </Text>
        </Box>
      ) : (
        <ReleasesLink selectedPerspective={selectedPerspective} />
      )}
    </AnimatedTextWidth>
  )
}
