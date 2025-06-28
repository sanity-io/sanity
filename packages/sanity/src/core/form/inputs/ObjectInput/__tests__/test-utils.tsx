/* eslint-disable import/export */

import {Root} from '@sanity/ui'
import {render, type RenderOptions} from '@testing-library/react'

const Providers = ({children}: {children: React.ReactNode}) => {
  return <Root as="div">{children}</Root>
}

export * from '@testing-library/react'

export type {RenderOptions}

const customRender = (
  ui: React.JSX.Element,
  options?: Omit<RenderOptions, 'wrapper'>,
): ReturnType<typeof render> => render(ui, {wrapper: Providers, ...options})

export {customRender as render}
