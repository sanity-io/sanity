import {fireEvent, waitFor} from '@testing-library/react'
import React from 'react'
import {PortableTextMarker} from '../../../../types'
// import {renderInput} from '../../../../test/renderInput'
import {PortableTextInput, PortableTextInputProps} from '../../PortableTextInput'
import {portableTextType} from './schema'

jest.setTimeout(10000)

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
        text: ' adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
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

function renderCustomMarkers(markers: PortableTextMarker[]) {
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

// function render(props?: Partial<PortableTextInputProps>) {
//   return renderInput({
//     render: (renderProps) => (
//       <PortableTextInput
//         {...renderProps}
//         renderBlockActions={renderBlockActions}
//         renderCustomMarkers={renderCustomMarkers}
//         {...(props as any)}
//       />
//     ),

//     type: portableTextType,
//   })
// }

describe('Portable Text Editor Block Extras', () => {
  test.skip('custom markers', async () => {
    const markers: PortableTextMarker[] = [
      {type: 'customMarkerTest', path: [{_key: value[0]._key}]},
    ]

    // const {result} = render({markers, value})
    // const block = await result.findByText('Lorem ipsum dolor sit amet', {exact: false})
    // if (block) {
    //   fireEvent.mouseOver(block)
    // }
    // await waitFor(() => expect(result.queryByTestId('custom-marker-test')).toBeTruthy())
  })

  test.skip('block actions', async () => {
    const markers: PortableTextMarker[] = [
      {type: 'customMarkerTest', path: [{_key: value[0]._key}]},
    ]

    // const {result} = render({markers, value})
    // const block = await result.findByText('Lorem ipsum dolor sit amet', {exact: false})
    // if (block) {
    //   fireEvent.click(block)
    // }
    // await waitFor(() => expect(result.queryByTestId('block-action-test')).toBeTruthy())
  })
})
