import {Card, Flex, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {type NavbarProps} from '../../../config/studio/types'
import {useTranslation} from '../../../i18n'
import {ReleasesNav} from '../../../perspective/navbar/ReleasesNav'
import {usePerspective} from '../../../perspective/usePerspective'
import {getReleaseTone} from '../../../releases/util/getReleaseTone'
import {variantsLocaleNamespace} from '../../i18n'

const ReleaseNavContainer = styled(Card)`
  /* overflow: hidden; */

  // Reset the margin for the releases nav
  [data-ui='ReleasesNav'] {
    margin: 0;
  }
`
export function VariantsStudioNavbar(props: NavbarProps) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {selectedPerspective} = usePerspective()

  return (
    <Flex direction="column">
      {props.renderDefault(props)}
      <Card tone="neutral" paddingY={2} paddingX={3} borderBottom>
        <Flex justify="center" align="center" gap={2}>
          <Text weight="medium" size={1}>
            {t('navbar.view-as')}
          </Text>
          <ReleaseNavContainer
            tone={getReleaseTone(selectedPerspective)}
            border
            radius={4}
            paddingLeft={1}
          >
            <Flex marginLeft={1}>
              <Card borderRight tone="inherit">
                <Flex align="center" paddingX={2} height={'fill'}>
                  <Text size={1}>{t('navbar.version')}</Text>
                </Flex>
              </Card>
              <ReleasesNav withReleasesToolButton border={false} />
            </Flex>
          </ReleaseNavContainer>
        </Flex>
      </Card>
    </Flex>
  )
}
