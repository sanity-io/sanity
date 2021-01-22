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
- `languageAlternatives` - Array of languages that should be available
- `theme` - Name of the theme to use. Possible values: `['github', 'monokai', 'terminal', 'tomorrow']`
- `withFilename` - Boolean option to display input field for filename

```js
// ...fields...
{
  name: 'exampleUsage',
  title: 'Example usage',
  type: 'code',
  options: {
    language: 'js'
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

```jsx
import React from "react";
import Prism from "prismjs";
import './highlightstyle.css';
import { useRef } from "react";

export function Code(props) {
  const ref = useRef(null);
  
  useEffect(() => Prism.highlightElement(ref.current), []);
  
  return (
    <div>
      <div>{props.language}</div>
      <pre>
        <code ref={ref} className={"language-" + props.language}>
          {props.code}
        </code>
      </pre>
    </div>
  );
}

export default Code;

```

Optional code-highlighting with prismjs (you have to [download](https://prismjs.com/download) or create your own stylesheet)

## License

MIT-licensed. See LICENSE.
