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
  {blockContentType}
)

// Convert a Slate state to blocks
const blocks = blockTools.slateStateToBlocks(slateJson, blockContentType)

// Convert blocks to a JSON serialized Slate state
const slateState = blockTools.blocksToSlateState(blocks, blockContentType)

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
  {
    blockContentType,
    parseHtml: html => new JSDOM(html).window.document
  }
)


```

##### ``rules``

You may add your own rules to deal with special HTML cases.

```js
blockTools.htmlToBlocks(
  '<html><body><pre><code>const foo = "bar"</code></pre></body></html>',
  {
    blockContentType: compiledBlockContentType,
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

### ``blocksToSlateState(blocks, blockContentTypeSchema)``

Convert blocks to a serialized Slate state respecting the input schema.


### ``slateStateToBlocks(slateState, blockContentTypeSchema)``

Convert a slate state to blocks respecting the input schema.


### ``getBlockContentFeatures(blockContentType)``

Will return an object with the features enabled for the input block content type.

```js
{
  enabledBlockAnnotations: ['link'],
  enabledSpanDecorators: [
    'strong',
    'em',
    'code',
    'underline',
    'strike-through'
  ],
  enabledBlockStyles: [
    'normal',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote'
  ]
}
```
