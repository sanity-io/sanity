import {Subject} from 'rxjs'
import {merge, map} from 'rxjs/operators'

export const localChanges$ = new Subject()
// export const localChanges$ = new Subject().pipe(
//   map(val => {
//     const {change} = val

//     // The split operation is special because it duplicates the
//     // data in the the new block from the previous block
//     // Make sure we have control of the generated data and keys
//     // for the new block!
//     const splitOperations = change.operations.filter(
//       op => op.type === 'split_node' && op.path.size === 1
//     )
//     if (splitOperations.size > 0) {
//       const newNodes = []
//       splitOperations.forEach(op => {
//         const splitBlock = change.value.document.nodes
//           .get(op.path.get(0))
//           .toJSON({preserveKeys: true, perserveData: true})
//         const newBlock = change.value.document.nodes
//           .get(op.path.get(0) + 1)
//           .toJSON({preserveKeys: true, perserveData: true})
//         newBlock.data._key = newBlock.key
//         newNodes.push({splitBlock, newBlock})
//       })
//       const newChange = change.undo()
//       newNodes.forEach(({splitBlock, newBlock}) => {
//         newChange.withoutNormalizing(() => {
//           newChange.replaceNodeByKey(splitBlock.key, splitBlock)
//           newChange.moveTo(splitBlock.key, 0).moveToEndOfBlock()
//           newChange.insertBlock(newBlock).moveToStartOfBlock()
//         })
//       })
//       return {...val, change: newChange}
//     }

//     // The insert operation is special because it will not contain
//     // keys for the block child nodes, so we need to set them explicitly
//     const insertOperations = change.operations.filter(
//       op => op.type === 'insert_node' && op.path.size === 1
//     )
//     if (insertOperations.size > 0) {
//       const newNodes = []
//       insertOperations.forEach(op => {
//         let insertedBlock = change.value.document.nodes.get(op.path.get(0))
//         // Sometimes we cant't find the inserted block when doing
//         // undo and redo operations. Just return the original change then.
//         if (!insertedBlock) {
//           console.log('Could not find block')
//           console.log('Path:', op.path.get(0))
//           console.log('Document:', change.value.document.toJSON({preserveKeys: true, perserveData: true}))
//           return
//         }
//         insertedBlock = insertedBlock.toJSON({preserveKeys: true, perserveData: true})
//         insertedBlock.data._key = insertedBlock.key
//         insertedBlock.nodes.forEach((node, index) => {
//           const newKey = `${insertedBlock.key}${index}`
//           node.key = newKey
//           const {data} = node
//           if (data && data.value) {
//             node.data.value._key = newKey
//           }
//           if (data && data._key) {
//             node.data._key = newKey
//           }
//         })
//         newNodes.push(insertedBlock)
//       })
//       change.withoutNormalizing(() => {
//         newNodes.forEach(insertedBlock => {
//           change.setNodeByKey(insertedBlock.key, insertedBlock)
//         })
//       })
//       return {...val, change: change}
//     }
//     return val
//   })
// )
export const remoteChanges$ = new Subject()

export const changes$ = localChanges$.pipe(merge(remoteChanges$))
