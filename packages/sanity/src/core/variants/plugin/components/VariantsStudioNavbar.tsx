import {Card, Flex, Text} from '@sanity/ui'
import {AnimatePresence, motion} from 'motion/react'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {Button} from '../../../../ui-components/button/Button'
import {type NavbarProps} from '../../../config/studio/types'
import {useTranslation} from '../../../i18n'
import {ReleasesNav} from '../../../perspective/navbar/ReleasesNav'
import {usePerspective} from '../../../perspective/usePerspective'
import {getReleaseTone} from '../../../releases/util/getReleaseTone'
import {isDraftPerspective, isPublishedPerspective} from '../../../releases/util/util'
import {variantsLocaleNamespace} from '../../i18n'
import {VariantsNav} from './VariantsNav'

const NavRowContainer = styled(Card)`
  [data-ui='ReleasesNav'],
  [data-ui='VariantsNav'] {
    margin: 0;
  }
`

export function VariantsStudioNavbar(props: NavbarProps) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {selectedPerspective} = usePerspective()
  const router = useRouter()

  const hasVariantSelection = Boolean(router.stickyParams.variant)
  const hasNonDefaultPerspective =
    !isDraftPerspective(selectedPerspective) && !isPublishedPerspective(selectedPerspective)
  const canClear = hasVariantSelection || hasNonDefaultPerspective

  const handleClearViewAs = useCallback(() => {
    router.navigate({
      stickyParams: {
        excludedPerspectives: null,
        perspective: '',
        variant: null,
      },
    })
  }, [router])

  return (
    <Flex direction="column">
      {props.renderDefault(props)}
      <Card tone="neutral" paddingY={2} paddingX={3} borderBottom>
        <Flex justify="center" align="center" gap={2}>
          <Text weight="medium" size={1}>
            {t('navbar.view-as')}
          </Text>
          <NavRowContainer
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
          </NavRowContainer>
          <NavRowContainer
            tone={hasVariantSelection ? 'suggest' : 'default'}
            border
            radius={4}
            paddingLeft={1}
          >
            <Flex marginLeft={1}>
              <Card borderRight tone="inherit">
                <Flex align="center" paddingX={2} height={'fill'}>
                  <Text size={1}>{t('navbar.variant')}</Text>
                </Flex>
              </Card>
              <VariantsNav />
            </Flex>
          </NavRowContainer>
          <AnimatePresence initial={false}>
            {canClear && (
              <motion.div
                key="view-as-clear-button"
                animate={{clipPath: 'inset(0 0% 0 0%)', opacity: 1}}
                exit={{clipPath: 'inset(0 50% 0 50%)', opacity: 0}}
                initial={{clipPath: 'inset(0 50% 0 50%)', opacity: 0}}
                style={{display: 'flex'}}
                transition={{type: 'spring', bounce: 0, duration: 0.3}}
              >
                <Button
                  data-testid="view-as-clear-button"
                  mode="bleed"
                  onClick={handleClearViewAs}
                  text={t('navbar.clear')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Flex>
      </Card>
    </Flex>
  )
}
