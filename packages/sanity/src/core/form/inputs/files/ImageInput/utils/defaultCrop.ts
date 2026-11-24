import {getValidImageCropOptions} from '@sanity/schema/_internal'
import {type ImageHotspot, type ImageOptions} from '@sanity/types'
import {getDefaultImageCrop} from '@sanity/util/image'

import {set, unset} from '../../../../patch/patch'
import {PatchEvent} from '../../../../patch/PatchEvent'
import {type FormPatch} from '../../../../patch/types'
import {constrainHotspotToCrop} from '../../ImageToolInput/imagetool/utils'

/** The asset reference a patch sets on the image, if it sets one. */
export function getSetAssetRef(patch: FormPatch): string | undefined {
  const isAssetSet = patch.type === 'set' && patch.path.length === 1 && patch.path[0] === 'asset'
  const value = isAssetSet ? patch.value : undefined
  const ref = value && typeof value === 'object' && '_ref' in value ? value._ref : undefined
  return typeof ref === 'string' ? ref : undefined
}

function isHotspotUnset(patch: FormPatch): boolean {
  return patch.type === 'unset' && patch.path.length === 1 && patch.path[0] === 'hotspot'
}

/**
 * Patches writing the default crop for a newly set asset, and moving `hotspot` inside it, or
 * clearing the previous asset's crop when the asset already fits. A field with no valid
 * `aspectRatio` or `minDimensions` gets none, so it keeps whatever crop it had, and so does a
 * field that already holds the asset.
 */
export function getDefaultCropPatches(
  assetRef: string | undefined,
  options: ImageOptions | undefined,
  hotspot?: ImageHotspot,
  currentAssetRef?: string,
): FormPatch[] {
  const {aspectRatio, minDimensions} = getValidImageCropOptions(options)
  const isUnconstrained = aspectRatio === undefined && minDimensions === undefined
  if (assetRef === undefined || assetRef === currentAssetRef || isUnconstrained) {
    return []
  }
  const crop = getDefaultImageCrop(assetRef, aspectRatio, minDimensions)
  if (crop === undefined) {
    return [unset(['crop'])]
  }
  const hotspotPatches = hotspot
    ? [set({...hotspot, ...constrainHotspotToCrop(hotspot, crop)}, ['hotspot'])]
    : []
  return [set(crop, ['crop']), ...hotspotPatches]
}

/**
 * Adds the default crop to every patch that sets a new asset, in the same change, and moves the
 * stored `hotspot` inside it unless the change clears the hotspot.
 */
export function withDefaultCrop(
  patch: FormPatch | FormPatch[] | PatchEvent,
  options: ImageOptions | undefined,
  hotspot?: ImageHotspot,
  currentAssetRef?: string,
): PatchEvent {
  const {patches} = PatchEvent.from(patch)
  const keptHotspot = patches.some(isHotspotUnset) ? undefined : hotspot
  return PatchEvent.from(
    patches.flatMap((current) => [
      current,
      ...getDefaultCropPatches(getSetAssetRef(current), options, keptHotspot, currentAssetRef),
    ]),
  )
}
