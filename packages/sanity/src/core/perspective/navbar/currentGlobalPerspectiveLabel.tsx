import {type ReleaseDocument} from '@sanity/client'
// oxlint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Button, Text} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {ReleaseTitle} from '../../releases/components/ReleaseTitle'
import {RELEASES_INTENT} from '../../releases/plugin'
import {isReleaseDocument} from '../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {isDraftPerspective, isPublishedPerspective} from '../../releases/util/util'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {useAgentBundles} from '../../store/agent/useAgentBundles'
import {oversizedButtonStyle} from '../styles'
import {type TargetPerspective} from '../types'
import {AnimatedTextWidth} from './AnimatedTextWidth'

const OversizedButton = styled(IntentLink)`
  ${oversizedButtonStyle}
`

const ReleasesLink = ({selectedPerspective}: {selectedPerspective: ReleaseDocument}) => {
  const {t} = useTranslation()

  const ReleasesIntentLink = useMemo(
    () =>
      forwardRef(function ReleasesIntentLink(
        {children, ...intentProps}: React.ComponentPropsWithoutRef<'a'>,
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
    <ReleaseTitle
      title={selectedPerspective.metadata?.title}
      fallback={t('release.placeholder-untitled-release')}
    >
      {({displayTitle}) => (
        <Button
          as={ReleasesIntentLink}
          data-as="a"
          rel="noopener noreferrer"
          mode="bleed"
          padding={2}
          radius="full"
          style={{maxWidth: '180px'}}
          text={displayTitle}
        />
      )}
    </ReleaseTitle>
  )
}

export function CurrentGlobalPerspectiveLabel({
  selectedPerspective,
}: {
  selectedPerspective: TargetPerspective
}): React.JSX.Element | null {
  const {t} = useTranslation()
  const {bundles} = useAgentBundles()

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
      ) : isReleaseDocument(selectedPerspective) ? (
        <ReleasesLink selectedPerspective={selectedPerspective} />
      ) : (
        <Box padding={2} style={{userSelect: 'none', overflow: 'hidden'}}>
          <Text size={1} textOverflow="ellipsis" weight="medium">
            {isAgentBundleName(selectedPerspective)
              ? t(
                  bundles.some((b) => b.id === selectedPerspective)
                    ? 'version.agent-bundle.proposed-changes'
                    : 'version.agent-bundle.agent-changes',
                )
              : selectedPerspective}
          </Text>
        </Box>
      )}
    </AnimatedTextWidth>
  )
}
