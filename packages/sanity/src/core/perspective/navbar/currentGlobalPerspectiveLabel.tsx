// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button, Card, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {RELEASES_INTENT} from '../../releases/plugin'
import {isReleaseDocument, type ReleaseDocument} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'
import {oversizedButtonStyle} from '../styles'
import {type SelectedPerspective} from '../types'

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
      <div ref={textRef} style={{display: 'inline-block', whiteSpace: 'nowrap'}}>
        {children}
      </div>
    </motion.div>
  )
}

const ReleasesLink = ({selectedPerspective}: {selectedPerspective: ReleaseDocument}) => {
  const {t} = useTranslation()

  const ReleasesIntentLink = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function ReleasesIntentLink(
        {children, ...intentProps}: {children: ReactNode},
        linkRef: ForwardedRef<HTMLAnchorElement>,
      ) {
        return (
          <OversizedButton
            {...intentProps}
            ref={linkRef}
            intent={RELEASES_INTENT}
            params={{id: getReleaseIdFromReleaseDocumentId(selectedPerspective._id)}}
          >
            {children}
          </OversizedButton>
        )
      }),
    [selectedPerspective],
  )

  return (
    <Button
      as={ReleasesIntentLink}
      data-as="a"
      rel="noopener noreferrer"
      mode="bleed"
      padding={2}
      radius="full"
      style={{maxWidth: '180px', textOverflow: 'ellipsis'}}
      text={selectedPerspective.metadata?.title || t('release.placeholder-untitled-release')}
    />
  )
}

export function CurrentGlobalPerspectiveLabel({
  selectedPerspective,
}: {
  selectedPerspective: SelectedPerspective
}): React.JSX.Element | null {
  const {t} = useTranslation()

  return (
    <AnimatedTextWidth
      text={isReleaseDocument(selectedPerspective) ? selectedPerspective._id : selectedPerspective}
    >
      {isPublishedPerspective(selectedPerspective) || isDraftPerspective(selectedPerspective) ? (
        <Card tone="inherit" padding={2} style={{userSelect: 'none', overflow: 'hidden'}}>
          <Text size={1} textOverflow="ellipsis" weight="medium">
            {isPublishedPerspective(selectedPerspective)
              ? t('release.chip.published')
              : t('release.chip.global.drafts')}
          </Text>
        </Card>
      ) : (
        <ReleasesLink selectedPerspective={selectedPerspective} />
      )}
    </AnimatedTextWidth>
  )
}
