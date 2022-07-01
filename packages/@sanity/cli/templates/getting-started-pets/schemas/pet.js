import {JsonView} from '../components/views/JsonView'
import {DocumentIcon, EyeOpenIcon, StarIcon} from '@sanity/icons'
import S from '@sanity/desk-tool/structure-builder'
import {PetPreview} from '../components/views/PetPreview'
import {RangeInput} from '../components/inputs/RangeInput'
import {CharacterCount} from '../components/inputs/CharacterCount'
import petIcon from '../components/icons/petIcon'

export default {
  name: 'pet',
  type: 'document',
  title: 'Pet',
  icon: petIcon,

  views: [
    S.view.component(PetPreview).title('Preview').icon(EyeOpenIcon),
    S.view.component(JsonView).title('JSON').icon(DocumentIcon),
  ],

  groups: [
    {
      name: 'favourites',
      title: 'Favourites',
      icon: StarIcon,
    },
  ],

  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Name',
    },
    {
      name: 'shortDescription',
      description:
        'This field uses a custom React component to count the characters in the input. You can easily customize your input fields with your own components.',
      type: 'text',
      title: 'Short description',
      inputComponent: CharacterCount,
      validation: (Rule) => Rule.max(100),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}, {type: 'image', options: {hotspot: true}}],
    },
    {
      name: 'birthday',
      description:
        "This is a date input. You can customize it too. Hours? Time zones? Custom calendar? You've got it.",
      type: 'date',
      title: 'Date of birth',
    },
    {
      name: 'weight',
      description: 'This is a number input. Sanity supports the default HTML inputs and much more.',
      type: 'number',
      title: 'Weight (kg)',
    },
    {
      title: 'Hair',
      name: 'hair',
      description:
        "This field conditionally shows and hides the fluffiness field. You can set a pet's fluffiness level only when a pet has hair or fur. 'hair' is used as the default value.",
      type: 'string',
      options: {
        list: [
          {title: 'Hairless', value: 'Hairless'},
          {title: 'Hair', value: 'Hair'},
          {title: 'Fur', value: 'Fur'},
        ],
        layout: 'radio',
      },
      initialValue: 'Hair',
    },
    {
      name: 'fluffiness',
      description:
        "This is yet another custom input! It will be hidden depending on the option picked on the 'hair' field.",
      type: 'number',
      title: 'Fluffiness level',
      inputComponent: RangeInput,
      options: {
        range: {
          min: 0,
          max: 10,
          step: 1,
        },
      },
      hidden: ({parent}) => !parent?.hair || parent?.hair === 'Hairless',
    },
    {
      name: 'picture',
      title: 'Picture',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
          options: {
            isHighlighted: true, // <-- make this field easily accessible
          },
        },
        {
          name: 'alt',
          type: 'string',
          title: 'Alt text',
          options: {
            isHighlighted: true,
          },
        },
      ],
    },
    {
      name: 'human',
      description: 'This is a single reference field…',
      type: 'reference',
      title: 'Human',
      to: [{type: 'human'}],
    },
    {
      name: 'friends',
      description: '…and this is an array of references!',
      type: 'array',
      title: 'Friends',
      of: [{type: 'reference', to: [{type: 'pet'}]}],
    },
    {
      name: 'toys',
      title: 'Favourite toys & treats',
      description:
        'This is an ordered list where the first item will appear in the first position within the preview.',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      group: 'favourites',
    },
  ],
}
