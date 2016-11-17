import DMP from 'diff-match-patch'

const dmp = new DMP()


export default class DiffMatchPatch {
  path : string
  dmpPatch : string
  constructor(path : string, dmpPatchSrc : string) {
    this.path = path
    this.dmpPatch = dmp.patch_fromText(dmpPatchSrc)
  }
  apply(targets, accessor) {
    targets.forEach(target => {
      if (target.isIndexReference()) {
        target.toIndicies(accessor).forEach(i => {
          accessor.getIndex(i).mutate(value => {
            return dmp.patch_apply(this.dmpPatch, value)[0]
          })
        })
      } else if (target.isAttributeReference()) {
        accessor.getField(target.name()).mutate(value => {
          return dmp.patch_apply(this.dmpPatch, value)[0]
        })
      } else {
        throw new Error(`Unable to apply diffMatchPatch to target ${target.toString()}`)
      }
    })
  }
}
