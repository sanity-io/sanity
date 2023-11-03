// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {render} from '@testing-library/react'
import React, {ComponentProps} from 'react'
import {studioTheme, ThemeProvider} from '@sanity/ui'
import {Translate} from '../Translate'
import {LocaleProviderBase} from '../components/LocaleProvider'
import {useTranslation} from '../hooks/useTranslation'
import {prepareI18n} from '../i18nConfig'
import {LocaleResourceBundle, LocaleResourceRecord} from '../types'
import {defineLocaleResourceBundle} from '../helpers'

type TestComponentProps = Omit<ComponentProps<typeof Translate>, 't'>

function createBundle(resources: LocaleResourceRecord) {
  return defineLocaleResourceBundle({
    locale: 'en-US',
    namespace: 'testNs',
    resources,
  })
}

async function getWrapper(bundles: LocaleResourceBundle[]) {
  const {i18next} = prepareI18n({
    projectId: 'test',
    dataset: 'test',
    name: 'test',
    i18n: {bundles: bundles},
  })

  await i18next.init()

  return function wrapper({children}: {children: React.ReactNode}) {
    return (
      <ThemeProvider theme={studioTheme}>
        <LocaleProviderBase
          locales={[{id: 'en-US', title: 'English'}]}
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
    const {findByTestId} = render(<TestComponent i18nKey="title" components={{}} />, {wrapper})
    expect((await findByTestId('output')).innerHTML).toEqual('English title')
  })
  it('it renders the key as-is if translation is missing', async () => {
    const wrapper = await getWrapper([createBundle({title: 'English title'})])
    const {findByTestId} = render(<TestComponent i18nKey="does-not-exist" components={{}} />, {
      wrapper,
    })
    expect((await findByTestId('output')).innerHTML).toEqual('does-not-exist')
  })
  it('it allows using basic, known HTML tags', async () => {
    const wrapper = await getWrapper([createBundle({title: 'An <code>embedded</code> thing'})])
    const {findByTestId} = render(<TestComponent i18nKey="title" components={{}} />, {wrapper})
    expect(await findByTestId('output')).toHaveTextContent('An embedded thing')
  })
  it('it supports providing a component map to use for customizing message rendering', async () => {
    const wrapper = await getWrapper([
      createBundle({
        message: 'Your search for "<Red>{{keyword}}</Red>" took <Bold>{{duration}}ms</Bold>',
      }),
    ])
    const {findByTestId} = render(
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
    expect((await findByTestId('output')).innerHTML).toEqual(
      `Your search for "<span style="color: red;">something</span>" took <b>123ms</b>`,
    )
  })
})
