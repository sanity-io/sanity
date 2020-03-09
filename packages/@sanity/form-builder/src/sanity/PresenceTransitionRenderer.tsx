import * as React from 'react'

const Item = (props: any) => {
  const {item} = props
  const onRef = React.useCallback(el => {
    props.onRef(props.id, el)
  }, [])
  return (
    <div
      data-key={item.key}
      ref={onRef}
      style={{
        transitionTimingFunction: 'ease',
        transitionDuration: '0.5s',
        transitionProperty: 'x y',
        position: 'absolute',
        ...item.rect
      }}
    >
      {item.children}
    </div>
  )
}
export const PresenceTransitionRenderer = props => {
  const [intersections, setIntersections] = React.useState([])
  const elKeys = React.useMemo(() => new Map(), [])

  const handleIO = React.useCallback(entries => {
    const next = entries.map(entry => ({
      rootBounds: entry.rootBounds,
      intersectionRect: entry.intersectionRect,
      isIntersecting: entry.isIntersecting,
      key: entry.target.getAttribute('data-key')
    }))
    console.log(next)
  }, [])

  const io = React.useMemo(() => new IntersectionObserver(handleIO), [])

  const observe = React.useCallback((key, el) => {
    elKeys.set(key, el)
    io.observe(el)
  }, [])

  const unobserve = React.useCallback(key => {
    const el = elKeys.get(key)
    if (el) {
      io.unobserve(el)
    }
  }, [])

  const handleRefCallback = React.useCallback((key, element) => {
    if (element) {
      observe(key, element)
    } else {
      unobserve(key)
    }
  }, [])

  return (
    <div>
      {props.items.map((item, idx) => (
        <Item key={item.key} id={item.key} item={item} onRef={handleRefCallback} />
      ))}
    </div>
  )
}
