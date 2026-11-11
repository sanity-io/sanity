import {type ReleaseDocument} from '@sanity/client'
import {useSelector} from '@xstate/react'
import {type ComponentType, type ReactNode} from 'react'
import {Text, VStack} from 'ui5'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../../ui-components/button/Button'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {Translate} from '../../../i18n/Translate'
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

  const variantDefinition =
    variantDefinitions?.get(selectedVariantId ?? '') ?? variantDefinitionOptions[0]

  const bundleOptions = getAvailableBundles({
    variantId: variantDefinition?._id,
    releases: releases ?? NO_RELEASES,
    existingVariants,
  })

  const bundle =
    bundleOptions.find(
      (option) =>
        typeof selectedBundle !== 'undefined' &&
        getBundleKey(option) === getBundleKey(selectedBundle),
    ) ?? bundleOptions[0]

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

  return (
    <>
      <Header>
        <VStack gap={2}>
          <Text size={1} weight="medium" as="h2">
            {t('document-group.create-variant')}
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
            text={t('document-group.create-variant')}
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
