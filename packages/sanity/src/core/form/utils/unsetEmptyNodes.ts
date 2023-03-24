import {FormPatch, PatchEvent} from '../patch'

function unsetEmptyNodes(patches: FormPatch[], value: unknown, nodePath: Path) {
  const patches = PatchEvent.from(event).patches
  // if the patch is an unset patch that targets an item in the array (as opposed to unsetting a field somewhere deeper)
  const isRemovingLastItem = patches.some(
    (patch) => patch.type === 'unset' && patch.path.length === 1
  )
}

// if (isRemovingLastItem) {
//   // apply the patch to the current value
//   const result = applyAll(member.field.value || [], patches)
//
//   // if the result is an empty array
//   if (Array.isArray(result) && !result.length) {
//     // then unset the array field
//     onChange(PatchEvent.from(unset([member.name])))
//     return
//   }
// }
