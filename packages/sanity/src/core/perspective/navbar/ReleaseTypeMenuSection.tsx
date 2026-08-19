import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {Card, Flex, Label, Stack} from '@sanity/ui'
import {Box} from 'ui5'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {GlobalPerspectiveMenuItem} from './GlobalPerspectiveMenuItem'

const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  asap: 'release.type.asap',
  scheduled: 'release.type.scheduled',
  undecided: 'release.type.undecided',
}

export function ReleaseTypeMenuSection({
  releaseType,
  releases,
  menuItemProps,
}: {
  releaseType: ReleaseType
  releases: ReleaseDocument[]
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): React.JSX.Element | null {
  const {t} = useTranslation()

  if (releases.length === 0) return null

  return (
    <Card padding={1} borderBottom>
      <Stack gap={1}>
        <Box paddingLeft={2} paddingTop={3} paddingBottom={1}>
          <Label muted style={{textTransform: 'uppercase'}} size={1}>
            {t(RELEASE_TYPE_LABELS[releaseType])}
          </Label>
        </Box>
        <Flex direction="column" gap={1}>
          {releases.map((release) => (
            <GlobalPerspectiveMenuItem
              key={release._id}
              release={release}
              menuItemProps={menuItemProps}
            />
          ))}
        </Flex>
      </Stack>
    </Card>
  )
}
