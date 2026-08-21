import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Card, Flex} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {Button} from '../../../../ui-components/button/Button'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/temporary-icons/RhombusOutlined'
import {type NavbarProps} from '../../../config/studio/types'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspectiveActiveDocument} from '../../../perspective/activeDocument/usePerspectiveActiveDocument'
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
import {useDocumentVariantIds} from '../../hooks/useDocumentVariantIds'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantTitle} from '../../tool/util'
import {getVersionFilterLabel} from './getVersionFilterLabel'
import {PerspectiveFilter} from './PerspectiveFilter'
import {VariantsMenu} from './VariantsMenu'

/**
 * The variant pill's diamond, filled or outlined.
 *
 * Filled means "the document you are looking at exists in this variant". Outlined means it does
 * not, so the perspective is selected but the document has no content written against it and the
 * form below is showing the fallback. The variant menu already draws this distinction per entry;
 * without it here the bar asserts the document has variant content when it has none.
 *
 * Split into its own component because `useDocumentVariantIds` needs a document id, and there is
 * nothing to ask about when no document is open.
 */
function DocumentVariantDiamond({
  documentId,
  selectedVariantId,
}: {
  documentId: string
  selectedVariantId: string | undefined
}): React.JSX.Element {
  const documentVariantIds = useDocumentVariantIds(documentId)

  // No variant selected is the default perspective, and a document always exists outside every
  // variant - so the default reads as filled rather than as an absence.
  const filled = !selectedVariantId || documentVariantIds.has(selectedVariantId)

  return filled ? <RhombusIcon /> : <RhombusOutlinedIcon />
}

export function VariantsStudioNavbar(props: NavbarProps) {
  const {t} = useTranslation(variantsLocaleNamespace)
  const {t: coreT} = useTranslation()
  const {selectedPerspective, selectedVariant} = usePerspective()
  const {activeDocument} = usePerspectiveActiveDocument()
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
                  icon={
                    activeDocument ? (
                      <DocumentVariantDiamond
                        documentId={activeDocument.documentId}
                        selectedVariantId={selectedVariant?._id}
                      />
                    ) : (
                      // Nothing open, so there is no document to have or lack this variant.
                      // Matches the menu, whose default entry outlines with no active document.
                      RhombusOutlinedIcon
                    )
                  }
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
