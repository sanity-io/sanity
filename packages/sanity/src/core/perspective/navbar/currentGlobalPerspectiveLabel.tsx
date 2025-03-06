// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Button, Card, Text} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type ReactNode, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {RELEASES_INTENT} from '../../releases/plugin'
import {isReleaseDocument, type ReleaseDocument} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'
import {type SelectedPerspective} from '../types'

// TODO: Restore animations
// const AnimatedMotionDiv = ({children, ...props}: PropsWithChildren<any>) => (
//   <motion.div
//     {...props}
//     layout="preserve-aspect"
//     initial={{width: 0, opacity: 0}}
//     animate={{width: 'auto', opacity: 1}}
//     exit={{width: 0, opacity: 0}}
//     transition={{duration: 0.25, ease: 'easeInOut'}}
//   >
//     {children}
//   </motion.div>
// )

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
            params={
              isReleaseDocument(selectedPerspective)
                ? {id: getReleaseIdFromReleaseDocumentId(selectedPerspective._id)}
                : {}
            }
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
      style={{maxWidth: '180px'}}
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

  if (!selectedPerspective) return null

  if (isPublishedPerspective(selectedPerspective) || isDraftPerspective(selectedPerspective)) {
    return (
      <Card tone="inherit" padding={3} className="p-menu-btn" style={{userSelect: 'none'}}>
        <Text size={1} textOverflow="ellipsis" weight="medium">
          {isPublishedPerspective(selectedPerspective)
            ? t('release.chip.published')
            : t('release.chip.global.drafts')}
        </Text>
      </Card>
    )
  }

  return <ReleasesLink selectedPerspective={selectedPerspective} />
}
