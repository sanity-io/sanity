import {type ReleaseDocument} from '@sanity/client'
import {Card} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ComponentType, type ReactNode, useEffect, useRef} from 'react'
import {Box, Text} from 'ui5'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {Translate} from '../../../i18n/Translate'
import {getDefaultVariant} from '../../../perspective/getDefaultVariant'
import {usePerspective} from '../../../perspective/usePerspective'
import {getDocumentVersionVariantId} from '../../../util/getDocumentVersionVariant'
import {readVersionType} from '../../../util/versionsUtils'
import {type VariantSet} from '../../machines/documentGroupInventoryMachine'
import {
  type VariantCreationBundle,
  type variantCreationMachine,
} from '../../machines/variantCreationMachine'
import {createVariantActions, createVariantCard, createVariantStack} from './CreateVariant.css'
import {
  type CreateVariantBundleOption,
  getAvailableBundles,
  getBundleKey,
} from './getAvailableBundles'
import {getNearestBaseVersion} from './getNearestBaseVersion'
import {SelectBaseVersion} from './SelectBaseVersion'
import {SelectBundle} from './SelectBundle'
import {SelectVariantDefinition} from './SelectVariantDefinition'

interface Props {
  variantCreationRef: ActorRefFromLogic<typeof variantCreationMachine>
  /** The document group's versions, in the sets the inventory lists them in. */
  sets: VariantSet[]
  /** The title of the document the variant is created for, shown in the header. */
  documentTitle: ReactNode
}

const NO_RELEASES: ReadonlyMap<string, ReleaseDocument> = new Map()

const DocumentTitle: ComponentType<{children?: ReactNode; documentTitle?: ReactNode}> = ({
  documentTitle,
}) => {
  return documentTitle
}

/**
 * The Create variant form: an inset card in the Manage versions panel, with three stacked fields
 * (Variant, Add to, Start from). Only Variant starts empty; Add to starts on the current
 * perspective and Start from on the nearest version. Cancel and Escape close it.
 */
export const CreateVariant: ComponentType<Props> = ({variantCreationRef, sets, documentTitle}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const {selectedPerspective, selectedVariants} = usePerspective()
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // The header button that opened the form is gone, so focus would fall to the page and Escape
    // would not reach the form. Focus moves to the first select instead.
    cardRef.current
      ?.querySelector<HTMLElement>('[data-testid="create-variant-variant-menu-button"]')
      ?.focus({preventScroll: true})
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const card = cardRef.current
      // Escape closes the form while the focus is in it. While one of its menus is open, the menu
      // takes the Escape. This listens in the capture phase, so the select still reads as expanded
      // when the menu's own handler closes it.
      if (
        event.key === 'Escape' &&
        card?.contains(event.target as Node) &&
        !card.querySelector('[aria-expanded="true"]')
      ) {
        variantCreationRef.send({type: 'createVariant.cancel'})
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [variantCreationRef])

  const variantDefinitions = useSelector(
    variantCreationRef,
    ({context}) => context.variants?.variants,
  )

  const releases = useSelector(variantCreationRef, ({context}) => context.releases?.releases)

  const selectedVariantId = useSelector(
    variantCreationRef,
    ({context}) => context.selectedVariantId,
  )

  const selectedBundle = useSelector(variantCreationRef, ({context}) => context.selectedBundle)

  const selectedBaseId = useSelector(variantCreationRef, ({context}) => context.selectedBaseId)

  const isVariantCreationPending = useSelector(variantCreationRef, (snapshot) =>
    snapshot.matches({active: 'creating'}),
  )

  const existingVariants = sets.flatMap((set) => set.variants)
  const existingVariantIds = new Set(
    existingVariants.flatMap(({document}) => getDocumentVersionVariantId(document) ?? []),
  )

  const variantDefinitionOptions = [...(variantDefinitions?.values() ?? [])]

  // The form starts with no variant; "Create variant" waits for one to be picked.
  // The variant picked in the form, if any.
  const pickedVariantDefinition = variantDefinitions?.get(selectedVariantId ?? '')

  // The variant selected in the studio (the variant pill), read as the perspective reads it.
  // Default is no selected variant.
  const selectedVariantDefinition = variantDefinitions?.get(
    getDefaultVariant(selectedVariants)?._id ?? '',
  )

  // With no variant picked, every draft and release is offered: the Default variant's own draft is
  // not a reason to leave out Drafts.
  const bundleOptions = getAvailableBundles({
    variantId: pickedVariantDefinition?._id,
    releases: releases ?? NO_RELEASES,
    existingVariants: pickedVariantDefinition ? existingVariants : [],
  })

  // Add to starts on the current perspective: the release in view, or Drafts.
  const currentPerspectiveBundle = bundleOptions.find((option) =>
    typeof selectedPerspective === 'object'
      ? option.type === 'release' && option.release._id === selectedPerspective._id
      : option.type === 'drafts',
  )

  const bundle =
    bundleOptions.find(
      (option) =>
        typeof selectedBundle !== 'undefined' &&
        getBundleKey(option) === getBundleKey(selectedBundle),
    ) ??
    currentPerspectiveBundle ??
    bundleOptions[0]

  // Until a variant is picked, Variant starts on the selected variant when the document has no
  // version of it in the Add to bundle yet. Where it already has one, Variant stays empty rather
  // than offering a duplicate, also when the user moves Add to onto such a bundle.
  const prefilledVariantDefinition =
    !pickedVariantDefinition &&
    selectedVariantDefinition &&
    bundle &&
    getAvailableBundles({
      variantId: selectedVariantDefinition._id,
      releases: releases ?? NO_RELEASES,
      existingVariants,
    }).some((option) => getBundleKey(option) === getBundleKey(bundle))
      ? selectedVariantDefinition
      : undefined

  const variantDefinition = pickedVariantDefinition ?? prefilledVariantDefinition

  const existingVersions = existingVariants.map(({document}) => document)

  const baseVersion = existingVersions.find(({_id}) => _id === selectedBaseId)

  // The version "Nearest version" resolves to for the picked variant and bundle, named in its row.
  const nearestBaseVersion = bundle
    ? getNearestBaseVersion({
        variantId: variantDefinition?._id,
        bundle: toVariantCreationBundle(bundle),
        versions: existingVersions,
      })
    : undefined
  const nearestBaseSet = nearestBaseVersion
    ? sets.find((set) => set.variants.some(({id}) => id === nearestBaseVersion._id))
    : undefined
  const nearestBase =
    nearestBaseVersion && nearestBaseSet
      ? {
          variantName:
            nearestBaseSet.variants.find(({id}) => id === nearestBaseVersion._id)?.name ??
            t('document-group.base-variant'),
          // Drafts reads as the Add to select names it; the inventory's set is called Draft.
          bundleName:
            readVersionType(nearestBaseVersion) === 'draft'
              ? t('release.chip.global.drafts')
              : nearestBaseSet.name,
        }
      : undefined

  const handleSelectBundle = (bundleKey: string) => {
    const option = bundleOptions.find((candidate) => getBundleKey(candidate) === bundleKey)

    if (typeof option !== 'undefined') {
      variantCreationRef.send({
        type: 'createVariant.selectBundle',
        bundle: toVariantCreationBundle(option),
      })
    }
  }

  const handleCreate = () => {
    if (typeof variantDefinition === 'undefined' || typeof bundle === 'undefined') {
      return
    }

    variantCreationRef.send({
      type: 'createVariant.selectVariant',
      variantId: variantDefinition._id,
    })

    variantCreationRef.send({
      type: 'createVariant.selectBundle',
      bundle: toVariantCreationBundle(bundle),
    })

    variantCreationRef.send({
      type: 'createVariant.selectBase',
      baseId: baseVersion?._id,
    })

    variantCreationRef.send({type: 'createVariant.confirm'})
  }

  return (
    <Box flexShrink={0} padding={2}>
      <Card
        border
        className={createVariantCard}
        data-testid="create-variant-form"
        padding={4}
        radius={3}
        ref={cardRef}
        tone="transparent"
      >
        <div className={createVariantStack}>
          <Text data-testid="create-variant-header" size={1} weight="medium" as="h2">
            <Translate
              t={t}
              i18nKey="document-group.create-variant.form.header"
              components={{DocumentTitle}}
              componentProps={{documentTitle}}
            />
          </Text>
          <SelectVariantDefinition
            variantDefinitions={variantDefinitionOptions}
            existingVariantIds={existingVariantIds}
            value={variantDefinition}
            onChange={(variantId) =>
              variantCreationRef.send({type: 'createVariant.selectVariant', variantId})
            }
            disabled={isVariantCreationPending}
          />
          <SelectBundle
            bundles={bundleOptions}
            value={bundle}
            onChange={handleSelectBundle}
            disabled={isVariantCreationPending}
          />
          <SelectBaseVersion
            sets={sets}
            releases={releases ?? NO_RELEASES}
            value={baseVersion}
            nearestBase={nearestBase}
            onChange={(baseId) =>
              variantCreationRef.send({type: 'createVariant.selectBase', baseId})
            }
            disabled={isVariantCreationPending}
          />
          <div className={createVariantActions}>
            <Button
              data-testid="create-variant-cancel"
              mode="bleed"
              text={t('document-group.create-variant.cancel-button.text')}
              onClick={() => variantCreationRef.send({type: 'createVariant.cancel'})}
            />
            <Button
              data-testid="create-variant-confirm"
              text={t('document-group.create-variant.confirm')}
              loading={isVariantCreationPending}
              disabled={
                typeof variantDefinition === 'undefined' ||
                typeof bundle === 'undefined' ||
                isVariantCreationPending
              }
              onClick={handleCreate}
            />
          </div>
        </div>
      </Card>
    </Box>
  )
}

function toVariantCreationBundle(option: CreateVariantBundleOption): VariantCreationBundle {
  return option.type === 'drafts'
    ? {type: 'drafts'}
    : {type: 'release', releaseId: option.releaseId}
}
