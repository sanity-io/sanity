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
import {getReleaseTone} from '../../../releases/util/getReleaseTone'
import {useReleasesToolAvailable} from '../../../schedules/hooks/useReleasesToolAvailable'
import {useAgentBundles} from '../../../store/agent/useAgentBundles'
import {useWorkspace} from '../../../studio/workspace'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantTitle} from '../../tool/util'
import {getVersionFilterLabel} from './getVersionFilterLabel'
import {PerspectiveFilter} from './PerspectiveFilter'
import {VariantsMenu} from './VariantsMenu'

export function VariantsStudioNavbar(props: NavbarProps) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {t: coreT} = useTranslation()
  const {selectedPerspective, selectedVariant} = usePerspective()
  const router = useRouter()
  const releasesToolAvailable = useReleasesToolAvailable()
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const setVariant = useSetVariant()
  const setPerspective = useSetPerspective()
  const hasVariantSelection = Boolean(router.stickyParams.variant)
  const defaultPerspective = useGetDefaultPerspective()
  const hasVersionSelection = selectedPerspective !== defaultPerspective
  const {bundles} = useAgentBundles()

  const versionTitle = useMemo(
    () => getVersionFilterLabel(selectedPerspective, coreT, bundles),
    [selectedPerspective, coreT, bundles],
  )

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
            label={versionTitle.displayTitle}
          >
            <GlobalPerspectiveMenu
              areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
              trigger={
                <Button
                  data-testid="global-perspective-menu-button"
                  icon={<ReleaseAvatarIcon size="small" release={selectedPerspective} />}
                  iconRight={ChevronDownIcon}
                  mode="bleed"
                  text={versionTitle.displayTitle}
                  tooltipProps={
                    versionTitle.isTruncated ? {content: versionTitle.fullTitle} : undefined
                  }
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
