import {Root} from '@sanity/ui'
import {render} from '@testing-library/react'
import {type ComponentProps, type ReactNode} from 'react'
import {describe, expect, it} from 'vitest'

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
      <Root as="div">
        <LocaleProviderBase
          locales={[
            {
              id: 'en-US',
              title: 'English',
              weekInfo: {firstDay: 1, minimalDays: 2, weekend: [6, 7]},
            },
          ]}
          i18next={i18next}
          projectId="test"
          sourceId="test"
        >
          {children}
        </LocaleProviderBase>
      </Root>
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

  it('it interpolates values', async () => {
    const wrapper = await getWrapper([
      createBundle({title: 'An <code>{{interpolated}}</code> thing'}),
    ])
    const {findByTestId} = render(
      <TestComponent
        i18nKey="title"
        values={{interpolated: 'escaped, interpolated'}}
        components={{}}
      />,
      {wrapper},
    )
    expect(await findByTestId('output')).toHaveTextContent('An escaped, interpolated thing')
  })

  it('it escapes HTML inside of interpolated values', async () => {
    const wrapper = await getWrapper([
      createBundle({title: 'An <code>{{interpolated}}</code> thing'}),
    ])
    const {findByTestId} = render(
      <TestComponent
        i18nKey="title"
        values={{interpolated: 'escaped, <strong>interpolated</strong> thing'}}
        components={{}}
      />,
      {wrapper},
    )
    expect(await findByTestId('output')).toHaveTextContent(
      'An escaped, <strong>interpolated</strong> thing',
    )
  })

  it('it allows using list formatter for interpolated values', async () => {
    const wrapper = await getWrapper([
      createBundle({peopleSignedUp: '{{count}} people signed up: {{people, list}}'}),
    ])
    const people = ['Bjørge', 'Rita', 'Espen']
    const {findByTestId} = render(
      <TestComponent i18nKey="peopleSignedUp" values={{count: people.length, people}} />,
      {wrapper},
    )
    expect(await findByTestId('output')).toHaveTextContent(
      '3 people signed up: Bjørge, Rita, and Espen',
    )
  })
})
