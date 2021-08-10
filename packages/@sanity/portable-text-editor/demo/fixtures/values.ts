import {PortableTextBlock} from '../../src/types/portableText'
import {keyGenerator} from '../keyGenerator'

export const createFromPropsValue = (): PortableTextBlock[] => {
  return [
    {
      _key: keyGenerator(),
      _type: 'block',
      markDefs: [],
      children: [
        {_key: keyGenerator(), _type: 'span', text: 'Hello from props change ', marks: []},
      ],
    },
    {_key: keyGenerator(), _type: 'someObject', color: 'red'},
    {
      _key: keyGenerator(),
      _type: 'block',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [{_key: keyGenerator(), _type: 'span', text: 'Some more text', marks: []}],
    },
  ]
}

export const initialPortableText: PortableTextBlock[] = [
  {
    _key: keyGenerator(),
    _type: 'block',
    markDefs: [],
    children: [
      {_key: keyGenerator(), _type: 'span', text: 'This is editable ', marks: []},
      {_key: keyGenerator(), _type: 'span', text: 'rich', marks: ['strong']},
      {_key: keyGenerator(), _type: 'span', text: ' text, ', marks: []},
      {_key: keyGenerator(), _type: 'span', text: 'much', marks: ['em']},
      {_key: keyGenerator(), _type: 'span', text: ' better than a ', marks: []},
      {_key: keyGenerator(), _type: 'span', text: '<textarea>', marks: ['code', 'strong']},
      {_key: keyGenerator(), _type: 'span', text: '!', marks: []},
    ],
  },
]
