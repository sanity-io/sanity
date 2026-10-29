import {type ImageAspectRatio} from '@sanity/types'
import {getDefaultImageCrop} from '@sanity/util/image'

import {set} from '../../../../patch/patch'
import {PatchEvent} from '../../../../patch/PatchEvent'
import {type FormPatch} from '../../../../patch/types'

/** The asset reference a patch sets on the image, if it sets one. */
export function getSetAssetRef(patch: FormPatch): string | undefined {
  const isAssetSet = patch.type === 'set' && patch.path.length === 1 && patch.path[0] === 'asset'
  const value = isAssetSet ? patch.value : undefined
  const ref = value && typeof value === 'object' && '_ref' in value ? value._ref : undefined
  return typeof ref === 'string' ? ref : undefined
}

/** A patch writing the default crop for a newly set asset, or none when it needs no crop. */
export function getDefaultCropPatches(
  assetRef: string | undefined,
  aspectRatio: ImageAspectRatio | undefined,
): FormPatch[] {
  const crop = assetRef === undefined ? undefined : getDefaultImageCrop(assetRef, aspectRatio)
  return crop ? [set(crop, ['crop'])] : []
}

/** Adds the default crop to every patch that sets a new asset, in the same change. */
export function withDefaultCrop(
  patch: FormPatch | FormPatch[] | PatchEvent,
  aspectRatio: ImageAspectRatio | undefined,
): PatchEvent {
  const {patches} = PatchEvent.from(patch)
  return PatchEvent.from(
    patches.flatMap((current) => [
      current,
      ...getDefaultCropPatches(getSetAssetRef(current), aspectRatio),
    ]),
  )
}
