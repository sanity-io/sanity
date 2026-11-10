import {type ImageOptions} from '@sanity/types'
import {getDefaultImageCrop} from '@sanity/util/image'

import {set, unset} from '../../../../patch/patch'
import {PatchEvent} from '../../../../patch/PatchEvent'
import {type FormPatch} from '../../../../patch/types'

/** The asset reference a patch sets on the image, if it sets one. */
export function getSetAssetRef(patch: FormPatch): string | undefined {
  const isAssetSet = patch.type === 'set' && patch.path.length === 1 && patch.path[0] === 'asset'
  const value = isAssetSet ? patch.value : undefined
  const ref = value && typeof value === 'object' && '_ref' in value ? value._ref : undefined
  return typeof ref === 'string' ? ref : undefined
}

/** A patch writing the default crop for a newly set asset, or clearing a stale one when the asset already fits; none without an aspect ratio. */
export function getDefaultCropPatches(
  assetRef: string | undefined,
  options: ImageOptions | undefined,
): FormPatch[] {
  if (assetRef === undefined || options?.aspectRatio === undefined) {
    return []
  }
  const crop = getDefaultImageCrop(assetRef, options.aspectRatio, options.minDimensions)
  return [crop ? set(crop, ['crop']) : unset(['crop'])]
}

/** Adds the default crop to every patch that sets a new asset, in the same change. */
export function withDefaultCrop(
  patch: FormPatch | FormPatch[] | PatchEvent,
  options: ImageOptions | undefined,
): PatchEvent {
  const {patches} = PatchEvent.from(patch)
  return PatchEvent.from(
    patches.flatMap((current) => [
      current,
      ...getDefaultCropPatches(getSetAssetRef(current), options),
    ]),
  )
}
