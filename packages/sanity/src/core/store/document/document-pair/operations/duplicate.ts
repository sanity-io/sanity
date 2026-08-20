import {type SanityDocument, type SanityDocumentLike} from '@sanity/types'
import omit from 'lodash-es/omit.js'

import {getDraftId, getVersionFromId, getVersionId} from '../../../../util/draftUtils'
import {getVariantVersionInfo} from '../../../../variants/documents/getVariantVersionInfo'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {operationsApiClient} from '../utils/operationsApiClient'
import {variantsApiClient} from '../utils/variantsApiClient'
import {type MapDocument, type OperationImpl} from './types'

// `_system` is authoritative, server-managed metadata (`group`/`scopeId`/`release`/`variant`
// references of the SOURCE document): copying it onto the duplicate would attach the new
// document to the source's group and scope.
const omitProps = ['_createdAt', '_updatedAt', '_system']

// Variant create addresses the new document by `(publishedId, variantId, bundleId)`; the
// server generates the opaque version id. `_rev` is the source revision and must not
// travel with the payload.
const variantOmitProps = [...omitProps, '_id', '_rev']

const getDocumentToDuplicateId = ({
  versionSnapshot,
  dupeId,
  liveEdit,
}: {
  versionSnapshot?: SanityDocument | null | undefined
  dupeId: string
  liveEdit: boolean
}) => {
  // When duplicating a version document we need to create it with a version id.
  // We get the version from the snapshot id and create a new version id for the duplicate.
  // Variant-scoped versions take a different path (`variant.create`) and never reach here.
  if (versionSnapshot) {
    const versionId = getVersionFromId(versionSnapshot._id)
    if (versionId) return getVersionId(dupeId, versionId)
  }

  if (liveEdit) {
    return dupeId
  }

  return getDraftId(dupeId)
}

const mapDocumentNoop: MapDocument = (document) => document

export const duplicate: OperationImpl<
  [
    baseDocumentId: string,
    options?: {
      mapDocument?: MapDocument
    },
  ],
  'NOTHING_TO_DUPLICATE'
> = {
  disabled: ({snapshots}) => {
    return snapshots.published || snapshots.draft || snapshots.version
      ? false
      : 'NOTHING_TO_DUPLICATE'
  },
  execute: (
    {schema, client, snapshots, typeName, idPair},
    dupeId,
    {mapDocument = mapDocumentNoop} = {},
  ) => {
    const source = snapshots.version || snapshots.draft || snapshots.published

    if (!source) {
      throw new Error('cannot execute on empty document')
    }

    const variantVersion = getVariantVersionInfo(snapshots.version)
    if (variantVersion) {
      // Scope ids are opaque and server-generated: never fabricate
      // `versions.<sourceScope>.<dupeId>`. Address the new document by coordinates
      // and let the action attach variant membership.
      const bundleId = variantVersion.bundleId === 'published' ? undefined : variantVersion.bundleId
      const mapped = mapDocument({
        ...source,
        _id: dupeId,
        _type: source._type,
      })

      return variantsApiClient(client).observable.action(
        {
          actionType: 'sanity.action.document.variant.create',
          publishedId: dupeId,
          variantId: variantVersion.variantId,
          ...(bundleId ? {bundleId} : {}),
          document: omit(mapped, variantOmitProps) as SanityDocumentLike,
        },
        {tag: 'document.duplicate'},
      )
    }

    const _id = getDocumentToDuplicateId({
      versionSnapshot: snapshots.version,
      dupeId,
      liveEdit: isLiveEditEnabled(schema, typeName),
    })

    return operationsApiClient(client, idPair).observable.create(
      omit(
        mapDocument({
          ...source,
          _id,
          _type: source._type,
        }),
        omitProps,
        // Performing `Omit` on a type that has an index signature causes the known properties to
        // be lost.
      ) as SanityDocumentLike,
      {
        tag: 'document.duplicate',
      },
    )
  },
}
