import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Card, Flex} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {type NavbarProps} from '../../../config/studio/types'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {GlobalPerspectiveMenu} from '../../../perspective/navbar/GlobalPerspectiveMenu'
import {useGetDefaultPerspective} from '../../../perspective/useGetDefaultPerspective'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSetPerspective} from '../../../perspective/useSetPerspective'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {isReleaseDocument} from '../../../releases/store/types'
import {getReleaseTone} from '../../../releases/util/getReleaseTone'
import {isDraftPerspective, isPublishedPerspective} from '../../../releases/util/util'
import {useReleasesToolAvailable} from '../../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../../studio/workspace'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantTitle} from '../../tool/util'
import {PerspectiveFilter} from './PerspectiveFilter'
import {VariantsMenu} from './VariantsMenu'

export function VariantsStudioNavbar(props: NavbarProps) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {t: coreT} = useTranslation()
  const {selectedPerspective, selectedPerspectiveName, selectedVariant} = usePerspective()
  const router = useRouter()
  const releasesToolAvailable = useReleasesToolAvailable()
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const setVariant = useSetVariant()
  const setPerspective = useSetPerspective()
  const hasVariantSelection = Boolean(router.stickyParams.variant)
  const defaultPerspective = useGetDefaultPerspective()
  const hasVersionSelection = selectedPerspective !== defaultPerspective

  const versionLabel = useMemo(() => {
    if (isPublishedPerspective(selectedPerspective)) return coreT('release.chip.published')
    if (isDraftPerspective(selectedPerspective)) return coreT('release.chip.draft')
    if (isReleaseDocument(selectedPerspective)) {
      return selectedPerspective.metadata?.title ?? coreT('release.placeholder-untitled-release')
    }
    return String(selectedPerspective)
  }, [selectedPerspective, coreT])

  const variantLabel = selectedVariant
    ? getVariantTitle(selectedVariant)
    : t('navbar.variant.default')

  const handleClearVersion = useCallback(() => {
    setPerspective(undefined)
  }, [setPerspective])

  const handleClearVariant = useCallback(() => {
    setVariant({variantId: undefined})
  }, [setVariant])

  return (
    <Flex direction="column">
      {props.renderDefault(props)}
      <Card
        tone={hasVariantSelection ? 'suggest' : 'neutral'}
        paddingY={2}
        paddingX={3}
        borderBottom
      >
        <Flex align="center" justify="center" gap={2} wrap="wrap">
          <PerspectiveFilter
            prefix={t('navbar.version')}
            tone={getReleaseTone(selectedPerspective)}
            onRemove={hasVersionSelection ? handleClearVersion : undefined}
            removeLabel={t('navbar.version.clear')}
            label={versionLabel}
          >
            <GlobalPerspectiveMenu
              selectedPerspectiveName={selectedPerspectiveName}
              areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
              trigger={
                <Button
                  data-testid="global-perspective-menu-button"
                  icon={<ReleaseAvatarIcon release={selectedPerspective} />}
                  iconRight={ChevronDownIcon}
                  mode="bleed"
                  text={versionLabel}
                />
              }
            />
          </PerspectiveFilter>

          <PerspectiveFilter
            prefix={t('navbar.variant')}
            tone={hasVariantSelection ? 'suggest' : 'default'}
            onRemove={hasVariantSelection ? handleClearVariant : undefined}
            removeLabel={t('navbar.variant.clear')}
            label={variantLabel}
          >
            <VariantsMenu
              trigger={
                <Button
                  data-testid="variants-nav-menu-button"
                  icon={RhombusIcon}
                  iconRight={ChevronDownIcon}
                  mode="bleed"
                  text={variantLabel}
                />
              }
            />
          </PerspectiveFilter>
        </Flex>
      </Card>
    </Flex>
  )
}
