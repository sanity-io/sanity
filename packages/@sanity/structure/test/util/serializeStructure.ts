import {from as observableFrom, of as observableOf, Observable, ObservableInput} from 'rxjs'
import {mergeMap} from 'rxjs/operators'
import {StructureNode, Builder, CollectionBuilder, Child} from '../../src/StructureNodes'

type SerializableStructureNode =
  | StructureNode
  | ObservableInput<StructureNode>
  | StructureResolver
  | CollectionBuilder
  | Child

interface StructureResolver {
  (...args: any[]): SerializableStructureNode
}

const isSubscribable = (
  thing: SerializableStructureNode
): thing is ObservableInput<StructureNode> => {
  if (!thing) {
    return false
  }

  return (
    typeof (thing as Promise<StructureNode>).then === 'function' ||
    typeof (thing as Observable<StructureNode>).subscribe === 'function'
  )
}

const isSerializable = (thing: SerializableStructureNode): thing is CollectionBuilder => {
  return thing && typeof (thing as Builder).serialize === 'function'
}

const isResolver = (thing: SerializableStructureNode): thing is StructureResolver => {
  return typeof thing === 'function'
}

export default function serializeStructure(
  item: SerializableStructureNode,
  context?: any,
  resolverArgs: any[] = []
): Observable<StructureNode> {
  // Lazy
  if (isResolver(item)) {
    const [itemId, options] = resolverArgs
    return serializeStructure(item(itemId, options), context, resolverArgs)
  }

  // Promise/observable returning a function, builder or plain JSON structure
  if (isSubscribable(item)) {
    return observableFrom(item).pipe(
      mergeMap(val => serializeStructure(val, context, resolverArgs))
    )
  }

  // Builder?
  if (isSerializable(item)) {
    return serializeStructure(item.serialize(context), context, resolverArgs)
  }

  // Plain value?
  return observableOf(item as StructureNode)
}
