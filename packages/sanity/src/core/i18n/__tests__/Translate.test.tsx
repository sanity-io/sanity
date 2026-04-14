import {studioTheme, ThemeProvider} from '@sanity/ui'
import {render, screen} from '@testing-library/react'
import {type ComponentProps, type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {LocaleProviderBase} from '../components/LocaleProvider'
import {useTranslation} from '../hooks/useTranslation'
import {prepareI18n} from '../i18nConfig'
import {Translate} from '../Translate'
import {type LocaleResourceBundle, type LocaleResourceRecord} from '../types'

type TestComponentProps = Omit<ComponentProps<typeof Translate>, 't'>

function createBundle(resources: LocaleResourceRecord) {
  const resourceBundle: LocaleResourceBundle = {
    locale: 'en-US',
    namespace: 'testNs',
    resources,
  }
  return resourceBundle
}

async function getWrapper(bundles: LocaleResourceBundle[]) {
  const {i18next} = prepareI18n({
    projectId: 'test',
    dataset: 'test',
    name: 'test',
    i18n: {bundles: bundles},
  })

  await i18next.init()

  return function wrapper({children}: {children: ReactNode}) {
    return (
      <ThemeProvider theme={studioTheme}>
        <LocaleProviderBase
          locales={[
            {
              id: 'en-US',
              title: 'English',
              weekInfo: {firstDay: 1, weekend: [6, 7]},
            },
          ]}
          i18next={i18next}
          projectId="test"
          sourceId="test"
        >
          {children}
        </LocaleProviderBase>
      </ThemeProvider>
    )
  }
}

function TestComponent(props: TestComponentProps) {
  const {t} = useTranslation('testNs')
  return (
    <div data-testid="output">
      <Translate
        t={t}
        i18nKey={props.i18nKey}
        components={props.components}
        values={props.values}
      />
    </div>
  )
}

describe('Translate component', () => {
  it('it translates a key', async () => {
    const wrapper = await getWrapper([createBundle({title: 'English title'})])
    render(<TestComponent i18nKey="title" components={{}} />, {wrapper})
    expect((await screen.findByTestId('output')).innerHTML).toEqual('English title')
  })
  it('it renders the key as-is if translation is missing', async () => {
    const wrapper = await getWrapper([createBundle({title: 'English title'})])
    render(<TestComponent i18nKey="does-not-exist" components={{}} />, {
      wrapper,
    })
    expect((await screen.findByTestId('output')).innerHTML).toEqual('does-not-exist')
  })
  it('it allows using basic, known HTML tags', async () => {
    const wrapper = await getWrapper([createBundle({title: 'An <code>embedded</code> thing'})])
    render(<TestComponent i18nKey="title" components={{}} />, {wrapper})
    expect(await screen.findByTestId('output')).toHaveTextContent('An embedded thing')
  })
  it('it supports providing a component map to use for customizing message rendering', async () => {
    const wrapper = await getWrapper([
      createBundle({
        message: 'Your search for "<Red>{{keyword}}</Red>" took <Bold>{{duration}}ms</Bold>',
      }),
    ])
    render(
      <TestComponent
        i18nKey="message"
        components={{
          Red: ({children}) => <span style={{color: 'red'}}>{children}</span>,
          Bold: ({children}) => <b>{children}</b>,
        }}
        values={{keyword: 'something', duration: '123'}}
      />,
      {wrapper},
    )
    expect((await screen.findByTestId('output')).innerHTML).toEqual(
      `Your search for "<span style="color: red;">something</span>" took <b>123ms</b>`,
    )
  })

  it('it interpolates values', async () => {
    const wrapper = await getWrapper([
      createBundle({title: 'An <code>{{interpolated}}</code> thing'}),
    ])
    render(
      <TestComponent
        i18nKey="title"
        values={{interpolated: 'escaped, interpolated'}}
        components={{}}
      />,
      {wrapper},
    )
    expect(await screen.findByTestId('output')).toHaveTextContent('An escaped, interpolated thing')
  })

  it('it escapes HTML inside of interpolated values', async () => {
    const wrapper = await getWrapper([
      createBundle({title: 'An <code>{{interpolated}}</code> thing'}),
    ])
    render(
      <TestComponent
        i18nKey="title"
        values={{interpolated: 'escaped, <strong>interpolated</strong> thing'}}
        components={{}}
      />,
      {wrapper},
    )
    expect(await screen.findByTestId('output')).toHaveTextContent(
      'An escaped, <strong>interpolated</strong> thing',
    )
  })

  it('it allows using list formatter for interpolated values', async () => {
    const wrapper = await getWrapper([
      createBundle({peopleSignedUp: '{{count}} people signed up: {{people, list}}'}),
    ])
    const people = ['Bjørge', 'Rita', 'Espen']
    render(<TestComponent i18nKey="peopleSignedUp" values={{count: people.length, people}} />, {
      wrapper,
    })
    expect(await screen.findByTestId('output')).toHaveTextContent(
      '3 people signed up: Bjørge, Rita, and Espen',
    )
  })

  describe('fallback for invalid translations', () => {
    it('falls back to interpolated text for a missing self-closing component', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = await getWrapper([createBundle({message: 'Before <Missing/> after'})])
      render(<TestComponent i18nKey="message" components={{}} />, {wrapper})
      expect(await screen.findByTestId('output')).toHaveTextContent('Before <Missing/> after')
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Component not found: Missing'))
      warnSpy.mockRestore()
    })

    it('falls back to interpolated text for a missing wrapping component', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = await getWrapper([
        createBundle({message: 'Click <Label>here</Label> to continue'}),
      ])
      render(<TestComponent i18nKey="message" components={{}} />, {wrapper})
      expect(await screen.findByTestId('output')).toHaveTextContent(
        'Click <Label>here</Label> to continue',
      )
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Component not defined: Label'))
      warnSpy.mockRestore()
    })

    it('falls back to interpolated text for an unrecognized HTML tag', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = await getWrapper([createBundle({message: 'Some <blink>text</blink> here'})])
      render(<TestComponent i18nKey="message" components={{}} />, {wrapper})
      expect(await screen.findByTestId('output')).toHaveTextContent('Some <blink>text</blink> here')
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTML tag "blink" is not allowed'),
      )
      warnSpy.mockRestore()
    })

    it('falls back to interpolated text for mismatched component tags from stale locales', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = await getWrapper([
        createBundle({message: 'The <Label>{{title}}</Label> release'}),
      ])
      render(
        <TestComponent
          i18nKey="message"
          components={{
            VersionBadge: ({children}) => <span>{children}</span>,
          }}
          values={{title: 'My Release'}}
        />,
        {wrapper},
      )
      expect(await screen.findByTestId('output')).toHaveTextContent(
        'The <Label>My Release</Label> release',
      )
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Component not defined: Label'))
      warnSpy.mockRestore()
    })

    it('does not warn when all components are provided correctly', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = await getWrapper([
        createBundle({
          message: 'Your search for "<Red>{{keyword}}</Red>" took <Bold>{{duration}}ms</Bold>',
        }),
      ])
      render(
        <TestComponent
          i18nKey="message"
          components={{
            Red: ({children}) => <span style={{color: 'red'}}>{children}</span>,
            Bold: ({children}) => <b>{children}</b>,
          }}
          values={{keyword: 'something', duration: '123'}}
        />,
        {wrapper},
      )
      await screen.findByTestId('output')
      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })

    it('does not warn when recognized HTML tags are used', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = await getWrapper([createBundle({title: 'An <code>embedded</code> thing'})])
      render(<TestComponent i18nKey="title" components={{}} />, {wrapper})
      expect(await screen.findByTestId('output')).toHaveTextContent('An embedded thing')
      expect(warnSpy).not.toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })
})
