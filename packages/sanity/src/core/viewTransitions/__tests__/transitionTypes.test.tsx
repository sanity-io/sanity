import {act, render} from '@testing-library/react'
import {
  addTransitionType,
  type Ref,
  type RefObject,
  startTransition,
  useImperativeHandle,
  useState,
  ViewTransition,
  type ViewTransitionClass,
} from 'react'
import {describe, expect, test} from 'vitest'

import {
  namedInTransitions,
  stubViewTransitions,
} from '../../../../test/testUtils/stubViewTransitions'
import {
  STUDIO_RESIZE_TRANSITION_TYPE,
  STUDIO_SCHEME_TRANSITION_TYPE,
  STUDIO_SKIP_TRANSITION_TYPE,
  studioViewTransitionClass,
} from '../transitionTypes'

type ChangeIn = (types: string[]) => void

function Harness(props: {
  default: ViewTransitionClass
  enter?: ViewTransitionClass
  ref: Ref<ChangeIn>
}) {
  const [changed, setChanged] = useState(false)
  useImperativeHandle(
    props.ref,
    () => (types) =>
      startTransition(() => {
        for (const type of types) addTransitionType(type)
        setChanged(true)
      }),
  )
  return (
    <>
      <ViewTransition default={props.default}>
        <div data-testid="pane" style={{width: changed ? 200 : 100}} />
      </ViewTransition>
      {changed && props.enter && (
        <ViewTransition enter={props.enter}>
          <div data-testid="entering" />
        </ViewTransition>
      )}
    </>
  )
}

/** Renders the harness, changes it in a transition of the given types, and returns what was named */
async function namedInTransition(
  classes: {default: ViewTransitionClass; enter?: ViewTransitionClass},
  types: string[],
): Promise<string[]> {
  const pictured = stubViewTransitions()
  const change: RefObject<ChangeIn | null> = {current: null}
  render(<Harness {...classes} ref={change} />)
  await act(async () => change.current?.(types))
  return namedInTransitions(pictured)
}

describe('studioViewTransitionClass', () => {
  const resizeOnly = studioViewTransitionClass({
    default: 'none',
    [STUDIO_RESIZE_TRANSITION_TYPE]: 'auto',
  })
  const enterOnReveal = studioViewTransitionClass({default: 'none', reveal: 'slide-in'})

  test('animates a boundary in a transition of a type it is keyed on', async () => {
    expect(await namedInTransition({default: resizeOnly}, [STUDIO_RESIZE_TRANSITION_TYPE])).toEqual(
      ['pane'],
    )
  })

  test('leaves a boundary out of a transition of a type it is not keyed on', async () => {
    expect(await namedInTransition({default: resizeOnly}, [STUDIO_SCHEME_TRANSITION_TYPE])).toEqual(
      [],
    )
  })

  test('leaves a boundary out of a transition of a type it is keyed on when the transition also carries the skip type', async () => {
    expect(
      await namedInTransition({default: resizeOnly}, [
        STUDIO_RESIZE_TRANSITION_TYPE,
        STUDIO_SKIP_TRANSITION_TYPE,
      ]),
    ).toEqual([])
  })

  test('animates a boundary given a plain class in any transition without the skip type', async () => {
    expect(
      await namedInTransition({default: studioViewTransitionClass('auto')}, [
        'some-app-transition',
      ]),
    ).toEqual(['pane'])
  })

  test('leaves a boundary given a plain class out of a transition with the skip type', async () => {
    expect(
      await namedInTransition({default: studioViewTransitionClass('auto')}, [
        'some-app-transition',
        STUDIO_SKIP_TRANSITION_TYPE,
      ]),
    ).toEqual([])
  })

  test('animates an entering boundary in a transition of a type its enter class is keyed on', async () => {
    expect(
      await namedInTransition({default: studioViewTransitionClass('none'), enter: enterOnReveal}, [
        'reveal',
      ]),
    ).toEqual(['entering'])
  })

  test('leaves an entering boundary out of a transition with the skip type, although its enter class takes over from the default one', async () => {
    expect(
      await namedInTransition({default: studioViewTransitionClass('none'), enter: enterOnReveal}, [
        'reveal',
        STUDIO_SKIP_TRANSITION_TYPE,
      ]),
    ).toEqual([])
  })

  test('keeps the classes it is given, and adds none for the skip type', () => {
    expect(studioViewTransitionClass({default: 'none', resize: 'pane'})).toEqual({
      default: 'none',
      resize: 'pane',
      [STUDIO_SKIP_TRANSITION_TYPE]: 'none',
    })
    expect(studioViewTransitionClass('auto')).toEqual({
      default: 'auto',
      [STUDIO_SKIP_TRANSITION_TYPE]: 'none',
    })
  })
})
