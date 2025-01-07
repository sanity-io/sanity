/* eslint-disable import/export */
import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {render, type RenderOptions} from '@testing-library/react'

const Providers = ({children}: {children: React.ReactNode}) => {
  return (
    <ThemeProvider theme={studioTheme}>
      <LayerProvider>{children}</LayerProvider>
    </ThemeProvider>
  )
}

export * from '@testing-library/react'

export type {RenderOptions}

const customRender = (
  ui: React.JSX.Element,
  options?: Omit<RenderOptions, 'wrapper'>,
): ReturnType<typeof render> => render(ui, {wrapper: Providers, ...options})

export {customRender as render}
