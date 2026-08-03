import {type Decorator} from '@storybook/react-vite'
import {forwardRef} from 'react'
import {PaneRouterContext} from 'sanity/_singletons'

/**
 * A minimal `PaneRouterContext` for components that only NAVIGATE.
 *
 * The board's standing rule is "do not stub `useDocumentPane`" - drive the real pane instead -
 * and that rule is right, because `useDocumentPane` carries document state and stubbing it means
 * storying a fiction. This is a different case and worth distinguishing.
 *
 * `PaneRouterContext` is almost entirely link components and navigation callbacks. A component
 * that reads it to render a `ReferenceChildLink` is not reading state; it is asking for an anchor
 * to somewhere else. Substituting inert anchors changes what a click does and nothing about what
 * the component renders or decides, so the story stays honest.
 *
 * The concrete case: `ConfirmDeleteDialogBody` lists referring documents through
 * `ReferencePreviewLink`, which renders a `ReferenceChildLink` and throws `Pane is missing router
 * context` without a provider. The reference list is the whole point of that dialog, so the
 * choice is a stub here or no story at all.
 *
 * Use it ONLY for that: components whose pane-router use is navigation. Anything that reads
 * `params` to decide what to render should be driven through the real `StructureHarness`.
 */

const InertLink = forwardRef<HTMLAnchorElement, {children?: React.ReactNode}>(
  function InertLink(props, ref) {
    return (
      <a
        {...props}
        ref={ref}
        href="#"
        onClick={(event) => event.preventDefault()}
        data-inert-pane-link=""
      />
    )
  },
)

const noop = () => undefined

export const stubPaneRouterValue = {
  index: 0,
  groupIndex: 0,
  siblingIndex: 0,
  payload: undefined,
  params: {},
  hasGroupSiblings: false,
  groupLength: 1,
  routerPanesState: [],
  ChildLink: InertLink,
  BackLink: InertLink,
  ReferenceChildLink: InertLink,
  ParameterizedLink: InertLink,
  handleEditReference: noop,
  replaceCurrent: noop,
  closeCurrent: noop,
  closeCurrentAndAfter: noop,
  duplicateCurrent: noop,
  setView: noop,
  setParams: noop,
  setPayload: noop,
  createPathWithParams: () => '#',
  navigateIntent: noop,
}

export const WithStubPaneRouter: Decorator = (Story) => (
  // oxlint-disable-next-line no-unsafe-type-assertion -- inert links and no-op navigation only
  <PaneRouterContext.Provider value={stubPaneRouterValue as never}>
    <Story />
  </PaneRouterContext.Provider>
)
