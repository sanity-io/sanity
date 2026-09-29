import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {ComposeSparklesIcon} from '@sanity/icons/ComposeSparkles'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {type SanityDocument} from '@sanity/types'
import {type BadgeTone, Card} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {motion} from 'motion/react'
import {css, styled} from 'styled-components'
import {Text, VStack, Box, Flex, Icon} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {getDocumentVariantType} from '../../../util/getDocumentVariantType'
import {canvasLocaleNamespace} from '../../i18n'
import {DocumentDiff} from './DocumentDiff/DocumentDiff'

const ChipCard = styled(Card)<{tone: BadgeTone}>((props) => {
  const {color} = getTheme_v2(props.theme)
  return css`
    --card-fg-color: ${color.button.ghost[props.tone].enabled.fg};
  `
})

const VersionChip = ({id, showSparkles}: {id: string; showSparkles?: boolean}) => {
  const documentVariantType = getDocumentVariantType(id)
  const badgeTitle = documentVariantType === 'published' ? 'Published' : 'Draft'
  const badgeTone = documentVariantType === 'published' ? 'positive' : 'caution'

  return (
    <ChipCard tone={badgeTone} padding={2} paddingRight={3} radius={'full'}>
      <Flex gap={2} alignItems="center">
        {/* oxlint-disable-next-line no-deprecated -- will fix in follow up PR */}
        <ReleaseAvatarIcon tone={documentVariantType === 'published' ? 'positive' : 'caution'} />
        <Text size={1} weight="medium" as="div" trim={true} tone={badgeTone}>
          {badgeTitle}
        </Text>
        {showSparkles && <Icon icon={ComposeSparklesIcon} size={1} tone={badgeTone} />}
      </Flex>
    </ChipCard>
  )
}

export function LinkToCanvasDiff({
  originalDocument,
  mappedDocument,
}: {
  originalDocument: SanityDocument | undefined
  mappedDocument: SanityDocument | undefined
}) {
  const {t} = useTranslation(canvasLocaleNamespace)

  return (
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      exit={{opacity: 0}}
      transition={{duration: 0.3}}
    >
      <Card tone="critical" padding={2} radius={3}>
        <Flex gap={2} alignItems="flex-start">
          <Box padding={1}>
            <Icon
              icon={WarningOutlineIcon}
              size={2}
              tone="critical"
              style={{margin: '-0.4375rem'}}
            />
          </Box>
          <VStack gap={2}>
            <Box padding={1}>
              <Text size={1} weight="semibold" as="div" trim={true} tone="critical">
                {t('dialog.confirm-document-changes.title')}
              </Text>
            </Box>
            <Box padding={1}>
              <Text size={1} weight="medium" as="div" trim={true} tone="critical">
                {t('dialog.confirm-document-changes.description')}
              </Text>
            </Box>
          </VStack>
        </Flex>
      </Card>
      <Card radius={3} border marginTop={3}>
        <Box padding={3}>
          <Flex gap={2} alignItems="center">
            <VersionChip id={originalDocument?._id || ''} />
            <Icon icon={ArrowRightIcon} size={2} />
            <VersionChip id={mappedDocument?._id || ''} showSparkles />
          </Flex>
        </Box>
        <Card borderBottom />
        {originalDocument && mappedDocument && (
          <Box padding={3}>
            <DocumentDiff baseDocument={originalDocument} document={mappedDocument} />
          </Box>
        )}
      </Card>
    </motion.div>
  )
}
