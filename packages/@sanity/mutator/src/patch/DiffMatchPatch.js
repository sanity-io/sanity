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
          const value = accessor.getIndexRaw(i)
          const newValue = dmp.patch_apply(this.dmpPatch, value)[0]
          accessor.setIndexRaw(i, newValue)
        })
      } else if (target.isAttributeReference()) {
        const value = accessor.getRaw(target.name())
        const newValue = dmp.patch_apply(this.dmpPatch, value)[0]
        accessor.setRaw(target.name(), newValue)
      } else {
        throw new Error(`Unable to apply diffMatchPatch to target ${target.toString()}`)
      }
    })
  }
}
