import DMP from 'diff-match-patch'

const dmp = new DMP()

export default class DiffMatchPatch {
  path: string
  dmpPatch: string
  id: string
  constructor(id: string, path: string, dmpPatchSrc: string) {
    this.id = id
    this.path = path
    this.dmpPatch = dmp.patch_fromText(dmpPatchSrc)
  }
  apply(targets, accessor) {
    let result = accessor
    targets.forEach(target => {
      if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach(i => {
          const oldValue = result.getIndex(i).get()
          const nextValue = dmp.patch_apply(this.dmpPatch, oldValue)[0]
          result = result.setIndex(i, nextValue)
        })
      } else if (target.isAttributeReference()) {
        const oldValue = result.getAttribute(target.name()).get()
        const nextValue = dmp.patch_apply(this.dmpPatch, oldValue)[0]
        result = result.setAttribute(target.name(), nextValue)
      } else {
        throw new Error(`Unable to apply diffMatchPatch to target ${target.toString()}`)
      }
    })
    return result
  }
}
