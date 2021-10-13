import {from as observableFrom, Observable, of as observableOf} from 'rxjs'
import {mergeMap} from 'rxjs/operators'
import {PaneNode, RouterPaneSiblingContext, PaneChild} from '../types'
import {isSubscribable, isSerializable} from './typePredicates'

export default function serializeStructure(
  child: PaneChild,
  context: RouterPaneSiblingContext,
  resolverArgs: [string, RouterPaneSiblingContext]
): Observable<PaneNode> {
  // Lazy
  if (typeof child === 'function') {
    return serializeStructure(child(...resolverArgs), context, resolverArgs)
  }

  // Promise/observable returning a function, builder or plain JSON structure
  if (isSubscribable(child)) {
    return observableFrom(child).pipe(
      mergeMap((val) => serializeStructure(val, context, resolverArgs))
    )
  }

  // Builder?
  if (isSerializable(child)) {
    return serializeStructure(child.serialize(context), context, resolverArgs)
  }

  // Plain value?
  return observableOf(child as PaneNode)
}
