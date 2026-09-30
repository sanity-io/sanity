import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Card} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {Flex} from 'ui5'

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
import {useVariantTypes} from '../../hooks/useVariantConditions'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {getVariantId, getVariantTitle} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {parseVariantStickyParam} from '../../util/variantSelection'
import {DEFAULT_VARIANT_TYPE_KEY} from '../../util/variantType'
import {getVersionFilterLabel} from './getVersionFilterLabel'
import {PerspectiveFilter} from './PerspectiveFilter'
import {VariantsMenu} from './VariantsMenu'

function VariantTypeFilter(props: {
  label: string
  selectedId: string | undefined
  typeKey: string
  variants: SystemVariant[]
}) {
  const {label, selectedId, typeKey, variants} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const setVariant = useSetVariant()
  const selectedVariant = selectedId
    ? variants.find((variant) => getVariantId(variant._id) === selectedId)
    : undefined
  const variantLabel = selectedVariant
    ? getVariantTitle(selectedVariant)
    : t('navbar.variant.default')
  const handleClear = useCallback(() => {
    setVariant({type: typeKey, variantId: undefined})
  }, [setVariant, typeKey])

  return (
    <PerspectiveFilter
      prefix={label}
      tone={selectedId ? 'suggest' : 'default'}
      onRemove={selectedId ? handleClear : undefined}
      removeLabel={t('navbar.variant.clear')}
      label={variantLabel}
    >
      <VariantsMenu
        typeKey={typeKey}
        trigger={
          <Button
            data-testid={
              typeKey === DEFAULT_VARIANT_TYPE_KEY
                ? 'variants-nav-menu-button'
                : `variants-nav-menu-button-${typeKey}`
            }
            icon={RhombusIcon}
            iconRight={ChevronDownIcon}
            mode="bleed"
            text={variantLabel}
          />
        }
      />
    </PerspectiveFilter>
  )
}

export function VariantsStudioNavbar(props: NavbarProps) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {t: coreT} = useTranslation()
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  const {data: variants} = useAllVariants()
  const router = useRouter()
  const releasesToolAvailable = useReleasesToolAvailable()
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const setPerspective = useSetPerspective()
  const variantTypes = useVariantTypes()
  const variantSelections = useMemo(
    () =>
      parseVariantStickyParam(
        typeof router.stickyParams.variant === 'string' ? router.stickyParams.variant : undefined,
      ),
    [router.stickyParams.variant],
  )
  const defaultPerspective = useGetDefaultPerspective()
  const hasVersionSelection = selectedPerspective !== defaultPerspective
  const {bundles} = useAgentBundles()

  const versionTitle = useMemo(
    () => getVersionFilterLabel(selectedPerspective, coreT, bundles),
    [selectedPerspective, coreT, bundles],
  )

  const handleClearVersion = useCallback(() => {
    setPerspective(undefined)
  }, [setPerspective])

  const resolvedTypes = variantTypes.status === 'ready' ? variantTypes.types : []
  const navbarTypes =
    resolvedTypes.length > 0
      ? resolvedTypes
      : [{key: DEFAULT_VARIANT_TYPE_KEY, label: t('navbar.variant')}]

  return (
    <Flex flexDirection="column">
      {props.renderDefault(props)}
      <Card
        tone={variantSelections.length > 0 ? 'suggest' : 'neutral'}
        paddingY={2}
        paddingX={3}
        borderBottom
      >
        <Flex alignItems="center" justifyContent="center" gap={2} flexWrap="wrap">
          <PerspectiveFilter
            prefix={t('navbar.version')}
            tone={getReleaseTone(selectedPerspective)}
            onRemove={hasVersionSelection ? handleClearVersion : undefined}
            removeLabel={t('navbar.version.clear')}
            label={versionTitle.displayTitle}
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
                  text={versionTitle.displayTitle}
                  tooltipProps={
                    versionTitle.isTruncated ? {content: versionTitle.fullTitle} : undefined
                  }
                />
              }
            />
          </PerspectiveFilter>

          {navbarTypes.map((type) => (
            <VariantTypeFilter
              key={type.key}
              label={type.label}
              selectedId={variantSelections.find((selection) => selection.type === type.key)?.name}
              typeKey={type.key}
              variants={variants}
            />
          ))}
        </Flex>
      </Card>
    </Flex>
  )
}
