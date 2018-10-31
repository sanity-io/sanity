# @sanity/color-input

Color input for [Sanity](https://sanity.io/) that stores selected colors in hex, hsl, hsv and rgb format.

## Installation

```
sanity install @sanity/color-input
```

## Usage

Use it in your schema types:

```js
// [...]
{
  fields: [
    // [...]
    {
      name: 'favoriteColor',
      title: 'Favorite color',
      type: 'color'
    }
  ]
}
```

Note that the above only works if you import and use the `all:part:@sanity/base/schema-type` part in your schema.

## Options

To disable the alpha option, set `disableAlpha` to `true`:

```js
// ...fields...
{
  name: 'favoriteColor',
  title: 'Favorite color',
  type: 'color',
  options: {
    disableAlpha: true
  }
}
```

## Data model

```js
{
  _type: 'color',
  hex: '#29158a',
  alpha: 0.9,
  hsl: {
    _type: 'hslaColor',
    h: 249.99999999999994,
    s: 0.7328000000000001,
    l: 0.313,
    a: 0.9
  },
  hsv: {
    _type: 'hsvaColor',
    h: 249.99999999999994,
    s: 0.8457987072945522,
    v: 0.5423664,
    a: 0.9
  },
  rgb: {
    _type: 'rgbaColor',
    r: 41
    g: 21,
    b: 138,
    a: 0.9
  }
}
```

## License

MIT-licensed. See LICENSE.
