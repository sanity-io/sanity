import {Card, Skeleton} from '@sanity/ui'
import {IntentLink} from 'sanity/router'
import {Box, Flex, Text} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {PREVIEW_SIZES} from '../../../../components/previews/constants'
import {TitleSkeleton} from '../../../../components/previews/general/DetailPreview.styled'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {Translate} from '../../../../i18n/Translate'
import {isCardinalityOneRelease} from '../../../../util/releaseUtils'
import {ReleaseAvatar} from '../../../components/ReleaseAvatar'
import {ReleaseTitle} from '../../../components/ReleaseTitle'
import {releasesLocaleNamespace} from '../../../i18n'
import {RELEASES_INTENT} from '../../../plugin'
import {getReleaseIdFromReleaseDocumentId} from '../../../util/getReleaseIdFromReleaseDocumentId'
import {type VisibleColumn} from '../../components/Table/types'
import {type TableRelease} from '../ReleasesOverview'
import {ReleaseDocumentNameContent} from './ReleaseDocumentNameContent'

export const ReleaseNameCell: VisibleColumn<TableRelease>['cell'] = ({
  cellProps,
  datum: release,
}) => {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const releaseId = release.isLoading ? 'loading' : getReleaseIdFromReleaseDocumentId(release._id)

  if (release.isLoading) {
    return (
      <Box {...cellProps} paddingLeft={3} flexBasis="0%" flexGrow={1} paddingY={1} paddingRight={2}>
        <Flex alignItems="center" gap={2}>
          <Skeleton animated radius={1} style={PREVIEW_SIZES.default.media} />
          <TitleSkeleton />
        </Flex>
      </Box>
    )
  }

  const releaseTitle = release.metadata.title || tCore('release.placeholder-untitled-release')
  const title = (
    <Flex alignItems="center" gap={2}>
      <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
        <ReleaseAvatar release={release} size="small" fontSize={2} />
      </Box>
      <Flex flexBasis="0%" flexGrow={1} gap={2} flexDirection="column">
        <Flex alignItems="center" gap={2}>
          <ReleaseTitle
            title={release.metadata.title}
            fallback={tCore('release.placeholder-untitled-release')}
            textProps={{size: 1, weight: 'medium', style: {minWidth: 0}}}
          />
        </Flex>
      </Flex>
    </Flex>
  )

  const content = isCardinalityOneRelease(release) ? (
    <ReleaseDocumentNameContent release={release} />
  ) : (
    title
  )

  return (
    <Box {...cellProps} paddingLeft={3} flexBasis="0%" flexGrow={1} paddingY={1} paddingRight={2}>
      <Tooltip
        disabled={!release.isDeleted}
        content={
          <Text size={1} as="div" trim={true}>
            <Translate t={t} i18nKey="deleted-release" values={{title: releaseTitle}} />
          </Text>
        }
      >
        <Flex alignItems="center" gap={3}>
          {release.isDeleted ? (
            <Card flex={1} padding={2} radius={2} tone="transparent">
              {content}
            </Card>
          ) : (
            <Card
              as={IntentLink}
              data-as="a"
              flex={1}
              intent={RELEASES_INTENT}
              padding={2}
              params={{id: releaseId}}
              radius={2}
              tone="inherit"
            >
              {content}
            </Card>
          )}
        </Flex>
      </Tooltip>
    </Box>
  )
}
