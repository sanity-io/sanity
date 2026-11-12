import {type ReleaseDocument} from '@sanity/client'
import {Card, Stack} from '@sanity/ui'
import {useSelector} from '@xstate/react'
import {type ComponentType, type ReactNode, useContext, useEffect, useRef} from 'react'
import {CreateVariantFormContext} from 'sanity/_singletons'
import {Box, Flex, Text, VStack} from 'ui5'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {Translate} from '../../../i18n/Translate'
import {usePerspective} from '../../../perspective/usePerspective'
import {getDocumentVersionVariantId} from '../../../util/getDocumentVersionVariant'
import {type VariantSet} from '../../machines/documentGroupInventoryMachine'
import {
  type VariantCreationBundle,
  type variantCreationMachine,
} from '../../machines/variantCreationMachine'
import {Header} from '../Header'
import {createVariantForm, createVariantFormFooter, createVariantFormRow} from './CreateVariant.css'
import {
  type CreateVariantBundleOption,
  getAvailableBundles,
  getBundleKey,
} from './getAvailableBundles'
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

export const CreateVariant: ComponentType<Props> = ({variantCreationRef, sets, documentTitle}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  // PROPOSED: the inset card of the signed-off spec (the Design Studio's option CV b). The stock form below is unchanged.
  const inset = useContext(CreateVariantFormContext) === 'final'
  const cardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!inset) return undefined
    const onKey = (event: KeyboardEvent) => {
      // Escape closes the form that has focus.
      if (event.key === 'Escape' && cardRef.current?.contains(event.target as Node)) {
        variantCreationRef.send({type: 'createVariant.cancel'})
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [inset, variantCreationRef])

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

  // The stock form starts on the first definition; the inset form starts empty and "Create variant" waits for a pick.
  const variantDefinition = inset
    ? variantDefinitions?.get(selectedVariantId ?? '')
    : (variantDefinitions?.get(selectedVariantId ?? '') ?? variantDefinitionOptions[0])

  // The inset form starts with no variant: "Add to" then offers every draft and release (Default's own draft is not a reason to hide Drafts).
  const bundleOptions = getAvailableBundles({
    variantId: variantDefinition?._id,
    releases: releases ?? NO_RELEASES,
    existingVariants: inset && !variantDefinition ? [] : existingVariants,
  })

  const {selectedPerspective} = usePerspective()
  // The inset form adds to the current perspective by default (Drafts, or the release in view); the stock form takes the first bundle.
  const currentPerspectiveBundle = inset
    ? bundleOptions.find((option) =>
        typeof selectedPerspective === 'object'
          ? option.type === 'release' && option.release._id === selectedPerspective._id
          : option.type === 'drafts',
      )
    : undefined

  const bundle =
    bundleOptions.find(
      (option) =>
        typeof selectedBundle !== 'undefined' &&
        getBundleKey(option) === getBundleKey(selectedBundle),
    ) ??
    currentPerspectiveBundle ??
    bundleOptions[0]

  const existingVersions = existingVariants.map(({document}) => document)

  const baseVersion = existingVersions.find(({_id}) => _id === selectedBaseId)

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

  if (inset) {
    const targetText =
      bundle?.type === 'drafts'
        ? t('release.chip.global.drafts')
        : bundle
          ? bundle.release.metadata.title || t('release.placeholder-untitled-release')
          : undefined
    return (
      <Box flexShrink={0} padding={2}>
        <Card
          border
          data-testid="create-variant-form"
          padding={4}
          radius={3}
          ref={cardRef}
          tone="transparent"
        >
          <Stack gap={4}>
            {/* Text trims its line box to the cap height, so 5px each way puts the visible gaps at the spec's 20px. */}
            <div style={{margin: '-5px 0 5px'}}>
              <Text size={1} weight="medium" as="h2">
                <Translate
                  t={t}
                  i18nKey="document-group.create-variant.form.header"
                  components={{DocumentTitle}}
                  componentProps={{documentTitle}}
                />
              </Text>
            </div>
            <Stack gap={4}>
              <Stack gap={4}>
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
                  onChange={(baseId) =>
                    variantCreationRef.send({type: 'createVariant.selectBase', baseId})
                  }
                  disabled={isVariantCreationPending}
                  targetText={targetText}
                />
              </Stack>
              <Flex gap={2} justifyContent="flex-end">
                <Button
                  mode="bleed"
                  text={t('document-group.create-variant.cancel-button.text')}
                  onClick={() => variantCreationRef.send({type: 'createVariant.cancel'})}
                />
                <Button
                  text={t('document-group.create-variant.confirm')}
                  disabled={
                    typeof variantDefinition === 'undefined' ||
                    typeof bundle === 'undefined' ||
                    isVariantCreationPending
                  }
                  onClick={handleCreate}
                />
              </Flex>
            </Stack>
          </Stack>
        </Card>
      </Box>
    )
  }

  return (
    <>
      <Header>
        <VStack gap={2}>
          <Text size={1} weight="medium" as="h2">
            {t('document-group.create-variant.confirm')}
          </Text>
          <Text size={1} muted>
            <Translate
              t={t}
              i18nKey="document-group.create-variant.description"
              components={{DocumentTitle}}
              componentProps={{documentTitle}}
            />
          </Text>
        </VStack>
      </Header>
      <div data-testid="create-variant-form" className={createVariantForm}>
        <div className={createVariantFormRow}>
          <SelectVariantDefinition
            variantDefinitions={variantDefinitionOptions}
            existingVariantIds={existingVariantIds}
            value={variantDefinition}
            onChange={(variantId) =>
              variantCreationRef.send({type: 'createVariant.selectVariant', variantId})
            }
            disabled={isVariantCreationPending}
          />
        </div>
        <div className={createVariantFormRow}>
          <SelectBundle
            bundles={bundleOptions}
            value={bundle}
            onChange={handleSelectBundle}
            disabled={isVariantCreationPending}
          />
        </div>
        <div className={createVariantFormRow}>
          <SelectBaseVersion
            sets={sets}
            releases={releases ?? NO_RELEASES}
            value={baseVersion}
            onChange={(baseId) =>
              variantCreationRef.send({type: 'createVariant.selectBase', baseId})
            }
            disabled={isVariantCreationPending}
          />
        </div>
        <div className={createVariantFormFooter}>
          <Button
            mode="bleed"
            text={t('document-group.create-variant.cancel-button.text')}
            onClick={() => variantCreationRef.send({type: 'createVariant.cancel'})}
          />
          <Button
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
    </>
  )
}

function toVariantCreationBundle(option: CreateVariantBundleOption): VariantCreationBundle {
  return option.type === 'drafts'
    ? {type: 'drafts'}
    : {type: 'release', releaseId: option.releaseId}
}
