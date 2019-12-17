import * as DMP from 'diff-match-patch'

const dmp = new DMP.diff_match_patch()

function applyPatch(patch, oldValue) {
  // Silently avoid patching if the value type is not string
  if (typeof oldValue !== 'string') return oldValue
  return dmp.patch_apply(patch, oldValue)[0]
}

export default class DiffMatchPatch {
  path: string
  dmpPatch: DMP.patch_obj[]
  id: string
  constructor(id: string, path: string, dmpPatchSrc: string) {
    this.id = id
    this.path = path
    this.dmpPatch = dmp.patch_fromText(dmpPatchSrc)
  }
  apply(targets, accessor) {
    let result = accessor
    // The target must be a container type
    if (result.containerType() == 'primitive') {
      return result
    }
    targets.forEach(target => {
      if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach(i => {
          // Skip patching unless the index actually currently exists
          if (result.getIndex(i)) {
            const oldValue = result.getIndex(i).get()
            const nextValue = applyPatch(this.dmpPatch, oldValue)
            result = result.setIndex(i, nextValue)
          }
        })
      } else if (target.isAttributeReference() && result.hasAttribute(target.name())) {
        const oldValue = result.getAttribute(target.name()).get()
        const nextValue = applyPatch(this.dmpPatch, oldValue)
        result = result.setAttribute(target.name(), nextValue)
      } else {
        throw new Error(`Unable to apply diffMatchPatch to target ${target.toString()}`)
      }
    })
    return result
  }
}
