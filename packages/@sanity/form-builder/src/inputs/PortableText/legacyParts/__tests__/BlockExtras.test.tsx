// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import {render, waitFor} from '@testing-library/react'
import React from 'react'

import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import Schema from '@sanity/schema'
import {PortableTextInputProps} from '../../PortableTextInput'
import {TestInput} from '../../__workshop__/_common/TestInput'
import {portableTextType} from './schema'

const schema = Schema.compile({
  name: 'test',
  types: [portableTextType],
})

const value = [
  {
    _type: 'myTestBlockType',
    _key: 'a',
    style: 'normal',
    markDefs: [
      {
        _key: '123',
        _type: 'link',
      },
    ],
    children: [
      {
        _type: 'span',
        _key: 'a1',
        text: 'Lorem ipsum dolor sit amet, ',
        marks: [],
      },
      {
        _type: 'span',
        _key: 'a2',
        text: 'consectetur',
        marks: ['123'],
      },
      {
        _type: 'span',
        _key: 'a3',
        text:
          ' adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        marks: [],
      },
    ],
  },
  {
    _type: 'myTestBlockType',
    _key: 'b',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: 'b1',
        text: 'Yo',
        marks: [],
      },
    ],
  },
]
const noop = () => {
  // noop
}
const subscribe = () => noop

function renderCustomMarkers(markers) {
  return markers.map((marker, index) => {
    if (marker.type === 'customMarkerTest') {
      return (
        <div key={`marker-${index}`} data-testid="custom-marker-test">
          Marker!
        </div>
      )
    }
    return null
  })
}

function renderBlockActions() {
  return <div data-testid="block-action-test">Action!</div>
}

const markers = [{type: 'customMarkerTest', path: [{_key: value[0]._key}]}]

function renderInput(props: Partial<PortableTextInputProps> = {}) {
  const onBlur = jest.fn()
  const onFocus = jest.fn()
  const onChange = jest.fn()

  const {queryByTestId, queryAllByTestId} = render(
    <ThemeProvider scheme="light" theme={studioTheme}>
      <LayerProvider>
        <ToastProvider>
          <TestInput
            focusPath={[]}
            type={schema.get('body')}
            onBlur={onBlur}
            onFocus={onFocus}
            onChange={onChange}
            markers={markers}
            level={0}
            renderCustomMarkers={renderCustomMarkers}
            renderBlockActions={renderBlockActions}
            readOnly={false}
            presence={[]}
            subscribe={subscribe}
            value={value}
            schema={schema}
            {...(props || {})}
          />
        </ToastProvider>
      </LayerProvider>
    </ThemeProvider>
  )
  return {onChange, onFocus, queryByTestId, queryAllByTestId}
}

describe('Portable Text Editor Block Extras', () => {
  test('custom markers', async () => {
    const {queryByTestId} = renderInput()
    await waitFor(() => expect(queryByTestId('custom-marker-test')).toBeTruthy())
  })
  test('block actions', async () => {
    const {queryAllByTestId} = renderInput()
    await waitFor(() => expect(queryAllByTestId('block-action-test').length).toBe(2))
  })
})
