# @sanity/code-input

Code input for [Sanity](https://sanity.io/).

Currently only a subset of languages and features are exposed, over time we will implement a richer set of options.

## Installation

```
sanity install @sanity/code-input
```

## Usage

Use it in your schema types:

```js
// [...]
{
  fields: [
    // [...]
    {
      name: 'exampleUsage',
      title: 'Example usage',
      type: 'code',
    },
  ]
}
```

Note that the above only works if you import and use the `all:part:@sanity/base/schema-type` part in your schema.

## Options

- `language` - Default language for this code field
- `languageAlternatives` - Array of languages that should be available (se its format in the example below)
- `theme` - Name of the theme to use.
  - Possible values include: `['github', 'monokai', 'terminal', 'tomorrow']`.
  - For the full list and a live playground, refer to the [react-ace page](http://securingsincity.github.io/react-ace/).
- `withFilename` - Boolean option to display input field for filename

```js
// ...fields...
{
  name: 'exampleUsage',
  title: 'Example usage',
  type: 'code',
  options: {
    theme: 'solarized_dark',
    language: 'js',
    languageAlternatives: [
      {title: 'Javascript', value: 'js'},
      {title: 'HTML', value: 'html'},
      {title: 'CSS', value: 'css'},
      {title: 'Rust', value: 'rust', mode:'rust'},
      {title: 'SASS', value: 'sass'},
    ]
  }
}
```

## Add support for more languages

Only a subset of languages are supported by default (see full list [here](https://github.com/sanity-io/sanity/blob/current/packages/@sanity/code-input/src/config.ts#L4)). You can add support for other languages by importing the ace mode yourself, and specifying `mode` for the `languageAlternatives` schema config.

Example: Add support for the Rust Programming Language

```js
// import rust support for ace, see https://github.com/securingsincity/react-ace for more details
import 'ace-builds/src-noconflict/mode-rust'

{
    name: 'exampleUsage',
    title: 'Example usage',
    type: 'code',
    options: {
      languageAlternatives: [
        {title: 'Javascript', value: 'js'},
        {
          title: 'Rust',
          value: 'rust',
          mode:'rust' // <- specify the mode to use here. Make sure this mode is also imported from ace-builds (see above)
        },
     ]
  }
}
```

## Data model

```js
{
  _type: 'code',
  language: 'js',
  highlightedLines: [1, 2],
  code: 'const foo = "bar"\nconsole.log(foo.toUpperCase())\n// BAR'
}
```

## Example usage in frontend (React)

You can use any syntax highlighter you want - but not all of them might support highlighted lines or the syntax you've defined.

As outlined above, the actual code is stored in a `code` property, so if your schema has a field called `codeExample` of type `code`, the property you'd want to pass to the highlighter would be `codeExample.code`.

Here's an example using [react-refractor](https://github.com/rexxars/react-refractor):

```jsx
import React from 'react'
import Refractor from 'react-refractor'
import js from 'refractor/lang/javascript'

Refractor.registerLanguage(js)

export function Code(props) {
  return (
    <Refractor
      // In this example, `props` is the value of a `code` field
      language={props.language}
      value={props.code}
      markers={props.highlightedLines}
    />
  )
}

export default Code
```

Other syntax highlighters include:

- [react-lowlight](https://github.com/rexxars/react-lowlight)
- [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- [highlight.js](https://github.com/highlightjs/highlight.js)
- [prism](https://github.com/PrismJS/prism)

## License

MIT-licensed. See LICENSE.
