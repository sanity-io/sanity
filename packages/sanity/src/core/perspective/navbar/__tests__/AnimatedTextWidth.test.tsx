import {act, render, screen} from '@testing-library/react'
import {
  type ReactNode,
  type Ref,
  type RefObject,
  startTransition,
  Suspense,
  use,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react'
import {describe, expect, test} from 'vitest'

import {
  namedInTransitions,
  stubViewTransitions,
} from '../../../../../test/testUtils/stubViewTransitions'
import {
  AnimatedTextWidth,
  AnimatedWidthPill,
  AnimatedWidthSibling,
  useWidthMorphValue,
} from '../AnimatedTextWidth'

function Chip(props: {text: string; clearable: boolean}) {
  const clearable = useWidthMorphValue(props.clearable)
  return (
    <AnimatedWidthPill>
      <div data-testid="pill">
        <AnimatedTextWidth data-testid="label" text={props.text}>
          {props.text}
        </AnimatedTextWidth>
        {clearable && (
          <AnimatedWidthSibling>
            <button data-testid="clear" type="button">
              Clear
            </button>
          </AnimatedWidthSibling>
        )}
      </div>
    </AnimatedWidthPill>
  )
}

function MountInTransition(props: {children: ReactNode; ref: Ref<() => void>}) {
  const [mounted, setMounted] = useState(false)
  useImperativeHandle(props.ref, () => () => startTransition(() => setMounted(true)))
  return mounted ? props.children : null
}

function Reveal(props: {children: ReactNode; ready: Promise<void>}) {
  use(props.ready)
  return props.children
}

/** Reports what a sibling measuring in a layout effect finds in the commit that mounts the chip */
function MeasureOnMount(props: {onMeasure: (pill: Element | null) => void}) {
  const {onMeasure} = props
  useLayoutEffect(() => {
    onMeasure(document.querySelector('[data-testid="pill"]'))
  }, [onMeasure])
  return null
}

describe('AnimatedWidthPill', () => {
  test('starts no view transition when it mounts in a transition', async () => {
    const pictured = stubViewTransitions()
    const mount: RefObject<(() => void) | null> = {current: null}
    render(
      <MountInTransition ref={mount}>
        <Chip text="Drafts" clearable />
      </MountInTransition>,
    )
    await act(async () => mount.current?.())

    expect(screen.getByTestId('label')).toHaveTextContent('Drafts')
    expect(screen.getByTestId('clear')).toBeInTheDocument()
    expect(pictured).toEqual([])
  })

  test('starts no view transition when a Suspense boundary reveals it', async () => {
    const pictured = stubViewTransitions()
    const ready = Promise.resolve()
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- `Reveal` suspends with `use()`
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <Reveal ready={ready}>
            <Chip text="Drafts" clearable />
          </Reveal>
        </Suspense>,
      )
    })

    expect(screen.getByTestId('label')).toHaveTextContent('Drafts')
    expect(pictured).toEqual([])
  })

  test('is laid out in the commit that mounts it, for siblings that measure the row then', () => {
    const measured: (Element | null)[] = []
    render(
      <>
        <Chip text="Drafts" clearable />
        <MeasureOnMount onMeasure={(pill) => measured.push(pill)} />
      </>,
    )

    expect(measured).toEqual([screen.getByTestId('pill')])
  })

  test('morphs the label, the pill and the control beside it in a transition of its own type', async () => {
    const pictured = stubViewTransitions()
    const {rerender} = render(<Chip text="Drafts" clearable={false} />)
    rerender(<Chip text="Spring release" clearable />)

    expect(await screen.findByText('Spring release')).toBeInTheDocument()
    expect(pictured.map((transition) => transition.types)).toEqual([['sanity-width-morph']])
    expect(namedInTransitions(pictured)).toEqual(['clear', 'label', 'pill'])
  })
})
