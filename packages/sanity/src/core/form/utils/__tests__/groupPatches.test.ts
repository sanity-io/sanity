import {PathSegment} from '@sanity/types'
import {FormPatch} from '../../patch'

type PatchTree = {
  segment: PathSegment
  patches: FormPatch[]
  children?: PatchTree
}
// function groupPatches(patches: FormPatch[]) {
//   const tree: PatchTree = {
//     segment: 'root',
//     patches: [],
//   }
// }

function groupPatches(input: FormPatch[]) {
  const tree: PatchTree = {segment: 'root', patches: []}
  input.forEach((patch) => {
    const {path} = patch
    let current = tree
    for (let i = 0; i < path.length; i++) {
      const segment = path[i]
      const child = current.children?.[segment]
      if (child) {
        current = child
      } else {
        current.children = {
          ...current.children,
          [segment]: {
            segment,
            patches: [],
            children: {},
          },
        }
        current = current.children[segment]
      }
    }
    current.patches.push(patch)
  })
  return tree
}

test('groupPatches', () => {
  const input = [
    {type: 'set', value: 'bar ok', path: ['foo', 'bar']},
    {type: 'set', value: 'baz ok', path: ['foo', 'baz']},
  ]
  const expected = {
    foo: {
      patches: [],
      children: {
        bar: {
          patches: [{type: 'set', value: 'bar ok', path: ['foo', 'bar']}],
        },
        baz: {
          patches: [{type: 'set', value: 'bar ok', path: ['foo', 'bar']}],
        },
      },
    },
  }
  expect(groupPatches(input as any)).toEqual(expected)
})
