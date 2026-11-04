import {
  type FileSchemaType,
  type ImageSchemaType,
  type MediaLibraryResolverContext,
  type Path,
  type SanityDocument,
} from '@sanity/types'
import {get} from '@sanity/util/paths'
import {useMemo} from 'react'

import {usePerspective} from '../../../../perspective/usePerspective'
import {useCurrentUser} from '../../../../store/user/hooks'
import {useSource} from '../../../../studio/source'
import {createMediaLibraryClient} from '../../../../util/createMediaLibraryClient'
import {useFormValue} from '../../../contexts/FormValue'
import {useMediaLibraryIds} from './useMediaLibraryIds'

const ROOT_PATH: Path = []

/**
 * Builds the {@link MediaLibraryResolverContext} handed to `options.mediaLibrary` resolver
 * functions for the asset field at `path`, mirroring how the reference input resolves
 * `options.filter` (`parentPath` is the field's path minus its last segment, `parent` the
 * value found there).
 *
 * Returns `null` until the Media Library the Studio is connected to is known.
 *
 * @internal
 */
export function useMediaLibraryResolverContext(props: {
  schemaType: ImageSchemaType | FileSchemaType
  path?: Path
}): MediaLibraryResolverContext | null {
  const {schemaType, path = ROOT_PATH} = props
  const libraryId = useMediaLibraryIds()?.libraryId
  const document = useFormValue([]) as SanityDocument
  const {perspectiveStack} = usePerspective()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {getClient} = useSource()
  const currentUser = useCurrentUser()

  return useMemo((): MediaLibraryResolverContext | null => {
    if (!libraryId) {
      return null
    }

    const parentPath = path.slice(0, -1)
    const parent = get(document, parentPath) as MediaLibraryResolverContext['parent']

    return {
      document,
      parent,
      parentPath,
      perspective: perspectiveStack,
      getClient,
      currentUser,
      schemaType,
      libraryId,
      getMediaLibraryClient: ({apiVersion}) =>
        createMediaLibraryClient(getClient({apiVersion}), libraryId),
    }
  }, [currentUser, document, getClient, libraryId, path, perspectiveStack, schemaType])
}
