import {act, render} from '@testing-library/react'
import {
  addTransitionType,
  type Ref,
  type RefObject,
  startTransition,
  useImperativeHandle,
  useState,
} from 'react'
import {describe, expect, test} from 'vitest'

import {
  namedInTransitions,
  stubViewTransitions,
} from '../../../../test/testUtils/stubViewTransitions'
import {
  STUDIO_RESIZE_TRANSITION_TYPE,
  STUDIO_SKIP_TRANSITION_TYPE,
} from '../../../core/viewTransitions/transitionTypes'
import {IFRAME_VIEWPORT_TRANSITION, IFrame} from '../IFrame'

type ResizeIn = (types: string[]) => void

function IFrameHarness(props: {ref: Ref<ResizeIn>}) {
  const [width, setWidth] = useState(800)
  useImperativeHandle(
    props.ref,
    () => (types) =>
      startTransition(() => {
        for (const type of types) addTransitionType(type)
        setWidth(375)
      }),
  )
  return (
    <IFrame
      animate="active"
      initial="active"
      onLoad={() => {}}
      preventClick={false}
      src="about:blank"
      variants={{active: {opacity: 1}}}
      style={{width}}
    />
  )
}

async function namedWhenResizedIn(types: string[]): Promise<string[]> {
  const pictured = stubViewTransitions()
  const resize: RefObject<ResizeIn | null> = {current: null}
  render(<IFrameHarness ref={resize} />)
  await act(async () => resize.current?.(types))
  return namedInTransitions(pictured)
}

describe('IFrame', () => {
  test('animates in a transition that resizes the studio layout', async () => {
    expect(await namedWhenResizedIn([STUDIO_RESIZE_TRANSITION_TYPE])).toEqual(['iframe'])
  })

  test('animates the preview viewport switch, which resizes the layout too', async () => {
    expect(
      await namedWhenResizedIn([IFRAME_VIEWPORT_TRANSITION, STUDIO_RESIZE_TRANSITION_TYPE]),
    ).toEqual(['iframe'])
  })

  test('is left out of a resize that carries the skip type', async () => {
    expect(
      await namedWhenResizedIn([STUDIO_RESIZE_TRANSITION_TYPE, STUDIO_SKIP_TRANSITION_TYPE]),
    ).toEqual([])
  })

  test('is left out of a transition of any other type', async () => {
    expect(await namedWhenResizedIn(['some-app-transition'])).toEqual([])
  })
})
