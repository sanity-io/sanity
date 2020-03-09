import React from 'react'
import {omit} from 'lodash'
import {merge, Subject, Observable} from 'rxjs'
import {map, publishReplay, refCount, scan, tap, withLatestFrom} from 'rxjs/operators'
import {createResizeObserver} from './resizeObserver'
import {Overlay} from './Overlay'
import {Context} from './context'
type ResizeObserverEntry = any
function rectWithTarget(key, entry: ResizeObserverEntry) {
  const {target, contentRect} = entry

  return {
    key: key,
    contentRect: {
      top: contentRect.top,
      left: contentRect.left,
      width: contentRect.width,
      height: contentRect.height,
      bottom: contentRect.bottom,
      right: contentRect.right
    },
    target
  }
}

const withOffsets = (box, parent) => {
  // todo: optimize by diffing
  const targetRect = box.target.getBoundingClientRect()
  const parentRect = parent.getBoundingClientRect()
  return {
    key: box.key,
    rect: {
      top: targetRect.top - parentRect.top,
      left: targetRect.left - parentRect.left,
      width: targetRect.width,
      height: targetRect.height
    }
  }
}

export const Tracker = React.memo(function Tracker(props: any) {
  const element = React.useRef()
  const tracker = React.useRef()
  const resizeObserver = React.useMemo(() => createResizeObserver(), [])
  const rcalc = React.useMemo(() => createResizeObserver(), [])
  const boxElements$ = React.useMemo(() => new Subject(), [])

  React.useEffect(() => {
    return rcalc.observe(tracker.current)
  }, [])

  const recalc$ = React.useMemo(() => rcalc.entries$, [])

  const positions$: any = React.useMemo(() => {
    const entries$ = resizeObserver.entries$.pipe(publishReplay(1), refCount())
    const recalced$ = recalc$.pipe(
      withLatestFrom(entries$),
      map(([, entries]) => entries)
    )
    return merge(entries$, recalced$).pipe(
      map((rectWithTarget: any[]) =>
        rectWithTarget.map(rect => withOffsets(rect, element.current))
      ),
      scan((res, curr) => {
        curr.forEach(item => res.set(item.key, item))
        return res
      }, new Map()),
      map(set => [...set.values()])
    )
  }, [])

  React.useMemo(() => {
    const subscription = boxElements$
      .asObservable()
      .pipe(
        scan((elements, event: any) => {
          if (event.type === 'mount') {
            return {
              ...elements,
              [event.key]: {
                key: event.key,
                dispose: resizeObserver.observe(event.element, entry =>
                  rectWithTarget(event.key, entry)
                )
              }
            }
          }
          if (event.type === 'unmount') {
            const current = elements[event.key]
            current.dispose()
            return omit(elements, event.key)
          }
          return elements
        }, {})
      )
      .subscribe()
    return () => subscription.unsubscribe()
  }, [])

  const dispatch = React.useCallback(event => {
    boxElements$.next(event)
  }, [])

  return (
    <Context.Provider value={{dispatch, __positions$: positions$}}>
      <div ref={element} style={{position: 'relative'}}>
        <div ref={tracker}>{props.children}</div>
        <Overlay renderWith={props.renderItemsWith} />
      </div>
    </Context.Provider>
  )
})
