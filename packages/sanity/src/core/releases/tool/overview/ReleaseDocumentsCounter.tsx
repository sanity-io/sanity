import {AddIcon, EditIcon} from '@sanity/icons'
import {Badge, Box, Flex, Stack, Text} from '@sanity/ui'

import {Tooltip} from '../../../../ui-components'
import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleasesMetadata} from '../../store/useReleasesMetadata'

type Props = {
  releaseDocumentMetadata: ReleasesMetadata
}

interface CategoryChange {
  type: 'added' | 'changed'
  tone: React.ComponentProps<typeof ToneIcon>['tone']
  count: number
}

const CHANGE_ICON_MAP: Record<CategoryChange['type'], React.FC> = {
  added: AddIcon,
  changed: EditIcon,
}

export const ReleaseDocumentsCounter = ({releaseDocumentMetadata}: Props) => {
  const {documentCount, existingDocumentCount: changedExistingDocumentCount} =
    releaseDocumentMetadata
  const newDocumentCount = documentCount - changedExistingDocumentCount

  const {t} = useTranslation(releasesLocaleNamespace)

  const documentCountGroups: CategoryChange[] = [
    {type: 'added', tone: 'primary', count: newDocumentCount},
    {type: 'changed', tone: 'caution', count: changedExistingDocumentCount},
  ]

  return (
    <Tooltip
      content={
        <Stack space={1}>
          {documentCountGroups.map(
            ({type, tone, count}) =>
              count > 0 && (
                <Flex key={type} gap={3} padding={2}>
                  <Box flex="none">
                    <Text size={1}>
                      <ToneIcon icon={CHANGE_ICON_MAP[type]} tone={tone} />
                    </Text>
                  </Box>
                  <Box flex={1}>
                    <Text size={1}>
                      <Translate
                        t={t}
                        i18nKey={
                          newDocumentCount > 1
                            ? `document-count.${type}`
                            : `document-count.${type}-singular`
                        }
                        values={{count}}
                      />
                    </Text>
                  </Box>
                </Flex>
              ),
          )}
        </Stack>
      }
      portal
    >
      <Flex gap={1}>
        {documentCountGroups.map(
          ({type, tone, count}) =>
            count > 0 && (
              <Badge
                key={type}
                tone={tone}
                style={{
                  minWidth: 9,
                  textAlign: 'center',
                }}
              >
                {count}
              </Badge>
            ),
        )}
      </Flex>
    </Tooltip>
  )
}
