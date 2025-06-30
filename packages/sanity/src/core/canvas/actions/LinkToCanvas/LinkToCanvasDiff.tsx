import {ArrowRightIcon, ComposeSparklesIcon, WarningOutlineIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {type ElementTone} from '@sanity/ui/theme'
import {motion} from 'framer-motion'
import {css, styled} from 'styled-components'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {getDocumentVariantType} from '../../../util/getDocumentVariantType'
import {canvasLocaleNamespace} from '../../i18n'
import {DocumentDiff} from './DocumentDiff/DocumentDiff'

const ChipCard = styled(Card)<{tone: ElementTone}>((props) => {
  return css`
    ${getVarName(vars.color.fg)}: ${vars.color.tinted[props.tone].fg[0]};
  `
})

const VersionChip = ({id, showSparkles}: {id: string; showSparkles?: boolean}) => {
  const documentVariantType = getDocumentVariantType(id)
  const badgeTitle = documentVariantType === 'published' ? 'Published' : 'Draft'
  const badgeTone = documentVariantType === 'published' ? 'positive' : 'caution'

  return (
    <ChipCard tone={badgeTone} padding={2} paddingRight={3} radius={'full'}>
      <Flex gap={2} align="center">
        <Text size={1}>
          <ReleaseAvatarIcon tone={documentVariantType === 'published' ? 'positive' : 'caution'} />
        </Text>
        <Text size={1} weight="medium">
          {badgeTitle}
        </Text>
        {showSparkles && (
          <Text size={1}>
            <ComposeSparklesIcon />
          </Text>
        )}
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
        <Flex gap={2} align="flex-start">
          <Box padding={1}>
            <Text size={2}>
              <WarningOutlineIcon />
            </Text>
          </Box>
          <Stack gap={2}>
            <Box padding={1}>
              <Text size={1} weight="semibold">
                {t('dialog.confirm-document-changes.title')}
              </Text>
            </Box>
            <Box padding={1}>
              <Text size={1} weight="medium">
                {t('dialog.confirm-document-changes.description')}
              </Text>
            </Box>
          </Stack>
        </Flex>
      </Card>
      <Card radius={3} border marginTop={3}>
        <Box padding={3}>
          <Flex gap={2} align="center">
            <VersionChip id={originalDocument?._id || ''} />
            <Text size={2}>
              <ArrowRightIcon />
            </Text>
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
