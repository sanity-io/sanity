# @sanity/sanity-type-bundle-block-editor

Type bundle for the Sanity block editor.

It returns configurable types ``block`` and ``span``, which are the minimal needed types for the Sanity block editor to work.

## Interface

### ``createBlockEditorTypes(options: Object) => Array``

### Options
```
  {
    marks: Array|Function,
    styles: Array|Function,
    lists: Array|Function,
    spanTypes: Array|Function
  }
```

Options can either be an array or a function.
An array will override the default value completely,
where a function will make it possible manipulate the default values.

```
  marks: defaultMarks => {
    return defaultMarks.filter(mark => mark.value !== 'code')
  }

  or

  marks: [
    {title: 'Strong', value: 'strong'}
  ]

```

### Default values

#### marks:
```
[
  {title: 'Strong', value: 'strong'},
  {title: 'Emphasis', value: 'em'},
  {title: 'Code', value: 'code'},
  {title: 'Underline', value: 'underline'},
  {title: 'Strike', value: 'strike-through'}
]
```

#### styles:
```
[
  {title: 'Normal', value: 'normal'},
  {title: 'H1', value: 'h1'},
  {title: 'H2', value: 'h2'},
  {title: 'H3', value: 'h3'},
  {title: 'H4', value: 'h4'},
  {title: 'H5', value: 'h5'},
  {title: 'H6', value: 'h6'},
  {title: 'Quote', value: 'blockquote'}
]
```

#### lists:
```
[
  {title: 'Bullet', value: 'bullet'},
  {title: 'Numbered', value: 'number'}
]
```

#### spanTypes:
```
[
  {
    type: 'object',
    name: 'link',
    title: 'Link',
    fields: [
      {
        type: 'url',
        name: 'href',
      }
    ]
  }
]
```

## Examples

### Minimal example for a blogpost type with the vanilla block editor setup.

```

import {SlateInput} from '@sanity/form-builder'
import createBlockEditorTypes from '@sanity/sanity-type-bundle-block-editor'

const blockEditorTypes = createBlockEditorTypes()

export default [
  ...blockEditorTypes,
  {
    name: 'blogPost',
    title: 'Blog post',
    type: 'object',
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
      },
      {
        name: 'content',
        title: 'Content',
        type: 'array',
        inputComponent: SlateInput, // Tell the formBuilder to use the Slate based block editor.
        of: [
          {
            type: 'block', // Comes from blockEditorTypes above
            title: 'Block'
          }
        ]
      }
    ]
  }
]
```

### Custom block types

Let users add an image block in the editor:

```
{
  name: 'content',
  title: 'Content',
  type: 'array',
  inputComponent: SlateInput,
  of: [
    {
      type: 'block',
      title: 'Block'
    },
    {
      type: 'image',
      title: 'Image'
    },
    ... // More custom types here if you want
  ]
}

```

### Overriding default editor types through options:

```
const blockEditorTypes = createBlockEditorTypes({
  // Don't allow code marks
  marks: defaultMarks => {
    return defaultMarks.filter(mark => mark.value !== 'code')
  },

  lists: [], // Don't allow any lists

  // Don't allow H1 headers
  styles: defaultStyles => {
    return defaultStyles.filter(style => style.value !== 'h1')
  },

  // Make it possible to link a text to an author
  // in addition to the default link type
  spanTypes: defaultSpanTypes => {
    return [
      ...defaultSpanTypes,
      {
        type: 'author',
        title: 'Author',
        name: 'author'
      }
    ]
  }
})
```

## Data output

The block editor will produce structured data like this:

```
{
  "_type": "blogPost",
  "_id": "fdPnZmAQK1adOUQJGtByQ",
  "title": "My first blogpost",
  "content": [
    {
      "_type": "block",
      "style": "h2",
      "spans": [
        {
          "_type": "span",
          "text": "A header text",
          "marks": []
        }
      ]
    },
    {
      "_type": "block",
      "style": "normal",
      "spans": [
        {
          "_type": "span",
          "text": "A normal paragraph text. With ",
          "marks": []
        },
        {
          "_type": "span",
          "text": "bold",
          "marks": [
            "strong"
          ]
        },
        {
          "_type": "span",
          "text": " and ",
          "marks": []
        },
        {
          "_type": "span",
          "text": "italic.",
          "marks": [
            "em"
          ]
        },
        {
          "_type": "span",
          "text": "And this ",
          "marks": []
        },
        {
          "_type": "span",
          "text": "is a link.",
          "marks": [],
          "link": {
            "href": "https://sanity.io"
          }
        }
      ]
    },
    {
      "_type": "block",
      "listItem": "bullet",
      "style": "normal",
      "spans": [
        {
          "_type": "span",
          "text": "This is a list item",
          "marks": []
        }
      ]
    },
    {
      "_type": "block",
      "listItem": "bullet",
      "style": "normal",
      "spans": [
        {
          "_type": "span",
          "text": "Another list item",
          "marks": []
        }
      ]
    },
    {
      "_type": "image",
      "caption": "An image caption",
      "asset": {
        "_type": "reference",
        "_ref": "image-CWwrmPOTbm3wYtEqiQCjviSf"
      }
    },
    {
      "_type": "block",
      "style": "blockquote",
      "spans": [
        {
          "_type": "span",
          "text": "A blockquote saying something inspiring.",
          "marks": []
        }
      ]
    }
  ]
}
```