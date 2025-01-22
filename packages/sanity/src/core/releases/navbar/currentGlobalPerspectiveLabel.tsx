// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {motion} from 'framer-motion'
import {type PropsWithChildren} from 'react'

import {IntentLink} from '../../../router/IntentLink'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {ReleaseAvatar} from '../components/ReleaseAvatar'
import {type SelectedPerspective} from '../hooks/usePerspective'
import {RELEASES_INTENT} from '../plugin'
import {isReleaseDocument} from '../store/types'
import {getReleaseTone} from '../util/getReleaseTone'
import {isDraftPerspective, isPublishedPerspective} from '../util/util'

const AnimatedMotionDiv = ({children, ...props}: PropsWithChildren<any>) => (
  <motion.div
    {...props}
    initial={{width: 0, opacity: 0}}
    animate={{width: 'auto', opacity: 1}}
    exit={{width: 0, opacity: 0}}
    transition={{duration: 0.25, ease: 'easeInOut'}}
  >
    {children}
  </motion.div>
)

export function CurrentGlobalPerspectiveLabel({
  selectedPerspective,
}: {
  selectedPerspective: SelectedPerspective
}): React.JSX.Element | null {
  const {t} = useTranslation()

  if (!selectedPerspective || isDraftPerspective(selectedPerspective)) return null

  let displayTitle = t('release.placeholder-untitled-release')

  if (isPublishedPerspective(selectedPerspective)) {
    displayTitle = t('release.chip.published')
  } else if (isReleaseDocument(selectedPerspective)) {
    displayTitle = selectedPerspective.metadata?.title || t('release.placeholder-untitled-release')
  }

  const visibleLabelChildren = () => {
    const labelContent = (
      <Flex align="flex-start" gap={0}>
        <Box flex="none">
          <ReleaseAvatar padding={2} tone={getReleaseTone(selectedPerspective)} />
        </Box>
        <Stack flex={1} paddingY={2} paddingRight={2} space={2}>
          <Text size={1} textOverflow="ellipsis" weight="medium">
            {displayTitle}
          </Text>
        </Stack>
      </Flex>
    )

    if (isPublishedPerspective(selectedPerspective)) {
      return <Card tone="inherit">{labelContent}</Card>
    }

    const releasesIntentLink = ({children, ...intentProps}: PropsWithChildren) => (
      <IntentLink
        {...intentProps}
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

    return (
      <Button
        as={releasesIntentLink}
        data-as="a"
        rel="noopener noreferrer"
        mode="bleed"
        padding={0}
        radius="full"
        style={{maxWidth: '180px'}}
      >
        {labelContent}
      </Button>
    )
  }

  return <AnimatedMotionDiv>{visibleLabelChildren()}</AnimatedMotionDiv>
}
function getReleaseIdFromReleaseDocumentId(_id: string): string | undefined {
  throw new Error('Function not implemented.')
}
