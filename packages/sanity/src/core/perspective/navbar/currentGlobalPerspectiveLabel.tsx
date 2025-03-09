// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button, Card, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {IntentLink} from 'sanity/router'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {RELEASES_INTENT} from '../../releases/plugin'
import {isReleaseDocument, type ReleaseDocument} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'
import {type SelectedPerspective} from '../types'

function AnimatedTextWidth({children, text}: {children: ReactNode; text: string}) {
  const textRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<null | number>(null) // in pixels

  useLayoutEffect(() => {
    if (!textRef.current) return
    const newWidth = textRef.current.offsetWidth
    setContainerWidth(newWidth)
  }, [text])

  return (
    <motion.div
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        width: containerWidth === null ? 'auto' : containerWidth, // use auto on first render
      }}
      animate={{width: containerWidth || 'auto'}}
      transition={{type: 'spring', bounce: 0, duration: 0.3}}
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
          <IntentLink
            {...intentProps}
            ref={linkRef}
            intent={RELEASES_INTENT}
            params={{id: getReleaseIdFromReleaseDocumentId(selectedPerspective._id)}}
          >
            {children}
          </IntentLink>
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
      padding={3}
      className="p-menu-btn small"
      radius="full"
      style={{maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis'}}
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
        <Card
          tone="inherit"
          padding={3}
          className="p-menu-btn"
          style={{userSelect: 'none', overflow: 'hidden'}}
        >
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
