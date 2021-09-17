import {from as observableFrom, Observable, of as observableOf} from 'rxjs'
import {mergeMap} from 'rxjs/operators'
import isSubscribable from './isSubscribable'

export default function serializeStructure(
  item: any,
  context?: any,
  resolverArgs: any[] = []
): Observable<any> {
  // Lazy
  if (typeof item === 'function') {
    return serializeStructure(item(...resolverArgs), context, resolverArgs)
  }

  // Promise/observable returning a function, builder or plain JSON structure
  if (isSubscribable(item)) {
    return observableFrom(item).pipe(
      mergeMap((val) => serializeStructure(val, context, resolverArgs))
    )
  }

  // Builder?
  if (item && typeof item.serialize === 'function') {
    return serializeStructure(item.serialize(context))
  }

  // Plain value?
  return observableOf(item)
}
