# Sanity Block Tools

Various tools for processing Sanity block content

## Interface

Let's start with a complete example:

```js
import Schema from '@sanity/schema'
import blockTools from '@sanity/block-tools'


// Start with compiling a schema we can work against
const schema = Schema.compile({
  name: 'myBlog',
  types: [
    {
      type: 'object',
      name: 'blogPost',
      fields: [
        {
          title: 'Title',
          type: 'string',
          name: 'title'
        },
        {
          title: 'Body',
          name: 'body',
          type: 'array',
          of: [{type: 'block'}]
        }
      ]
    }
  ]
})

// The compiled schema type for the content type that holds the block array
const blockContentType = defaultSchema.get('blogPost')
  .fields.find(field => field.name === 'body').type


// Convert HTML to blocks
const blocks = blockTools.htmlToBlocks(
  '<html><body><h1>Hello world!</h1><body></html>',
  blockContentType
)

// Convert an editor value to blocks
const blocks = blockTools.editorValueToBlocks(editorValue, blockContentType)

// Convert blocks to a editor value
const slateState = blockTools.blocksToEditorValue(blocks, blockContentType)

// Get the feature-set of a blockContentType
const features = blockTools.getBlockContentFeatures(blockContentType)

```

## Methods

### ``htmlToBlocks(html, options)`` (html deserializer)

This will deserialize the input html (string) into blocks.

#### Options

##### ``blockContentType``

A compiled version of the block content schema type.
When you give this option, the deserializer will respect the schema when deserializing to blocks.
I.e. if the schema doesn't allow h2-styles, all h2 html-elements will deserialized to normal styled blocks.

##### ``parseHtml``
The HTML-deserialization is done by default by the browser's native DOMParser.
On the server side you can give the function ``parseHtml``
that parses the html into a DOMParser compatible model / API.


###### JSDOM example

```js
const jsdom = require('jsdom')
const {JSDOM} = jsdom

const blocks = blockTools.htmlToBlocks(
  '<html><body><h1>Hello world!</h1><body></html>',
  blockContentType,
  {
    parseHtml: html => new JSDOM(html).window.document
  }
)


```

##### ``rules``

You may add your own rules to deal with special HTML cases.

```js
blockTools.htmlToBlocks(
  '<html><body><pre><code>const foo = "bar"</code></pre></body></html>',
  blockContentType,
  {
    parseHtml: html => new JSDOM(html),
    rules: [

      // Special rule for code blocks (wrapped in pre and code tag)
      {
        deserialize(el, next) {
          if (el.tagName.toLowerCase() != 'pre') {
            return undefined
          }
          const code = el.children[0]
          const childNodes = code && code.tagName.toLowerCase() === 'code'
            ? code.childNodes
            : el.childNodes
          let text = ''
          childNodes.forEach(node => {
            text += node.textContent
          })
          return {
            _type: 'span',
            marks: ['code'],
            text: text
          }
        }
      }

    ]
  }
)

```

### ``blocksToEditorValue(blocks, blockContentTypeSchema)``

Convert blocks to a serialized editor value respecting the input schema.


### ``editorValueToBlocks(slateState, blockContentTypeSchema)``

Convert a slate state to blocks respecting the input schema.


### ``getBlockContentFeatures(blockContentType)``

Will return an object with the features enabled for the input block content type.

```js
{
  annotations: [{title: 'Link', value: 'link'}],
  decorators: [
    {title: 'Strong', value: 'strong'},
    {title: 'Emphasis', value: 'em'},
    {title: 'Code', value: 'code'},
    {title: 'Underline', value: 'underline'},
    {title: 'Strike', value: 'strike-through'}
  ],
  styles: [
    {title: 'Normal', value: 'normal'},
    {title: 'Heading 1', value: 'h1'},
    {title: 'H2', value: 'h2'},
    {title: 'H3', value: 'h3'},
    {title: 'H4', value: 'h4'},
    {title: 'H5', value: 'h5'},
    {title: 'H6', value: 'h6'},
    {title: 'Quote', value: 'blockquote'}
  ]
}
```
