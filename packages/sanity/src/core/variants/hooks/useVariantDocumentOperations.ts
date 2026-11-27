import {type SingleActionResult} from '@sanity/client'
import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback} from 'react'

import {useClient} from '../../hooks/useClient'
import {
  VariantVersionCreated,
  type VariantVersionCreatedLocation,
} from '../__telemetry__/variants.telemetry'
import {
  createVariantScopedDocument,
  type CreateVariantScopedDocumentOptions,
} from '../documents/createVariantScopedDocument'
import {getBundleIdFromPerspective} from '../documents/getBundleIdFromPerspective'
import {VARIANTS_STUDIO_CLIENT_OPTIONS} from '../store/constants'

type DistributiveOmit<Type, Key extends PropertyKey> = Type extends unknown
  ? Omit<Type, Key>
  : never

type CreateVariantDocumentOptions = DistributiveOmit<
  CreateVariantScopedDocumentOptions,
  'client'
> & {
  /** The control the version is created from, reported with the created version */
  location: VariantVersionCreatedLocation
}

/**
 * @internal
 */
export function useVariantDocumentOperations() {
  const client = useClient(VARIANTS_STUDIO_CLIENT_OPTIONS)
  const telemetry = useTelemetry()

  const createVariantDocument = useCallback(
    async ({location, ...options}: CreateVariantDocumentOptions): Promise<SingleActionResult> => {
      const result = await createVariantScopedDocument({client, ...options})
      const bundleId = getBundleIdFromPerspective(options.selectedPerspective)

      telemetry.log(VariantVersionCreated, {
        location,
        bundle: bundleId === 'published' || bundleId === 'drafts' ? bundleId : 'release',
        fromExistingVersion: 'baseId' in options,
      })

      return result
    },
    [client, telemetry],
  )

  return {createVariantDocument}
}
