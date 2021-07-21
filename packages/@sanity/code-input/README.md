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
      type: 'code'
    }
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
      {title: 'SASS', value: 'sass'},
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

## License

MIT-licensed. See LICENSE.
