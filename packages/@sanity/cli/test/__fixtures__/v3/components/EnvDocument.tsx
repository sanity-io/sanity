// @todo We're using straight up JS here to work around weird worker issues
// when testing with Jest. Once we've moved away from Jest, rewrite this to
// regular TS/TSX.
const {createElement: h} = require('react')

module.exports = function EnvDocument(props) {
  return h(
    'html',
    {lang: 'en'},
    h(
      'head',
      null,
      h('meta', {charSet: 'utf-8'}),
      h('meta', {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      }),
      h('title', null, 'Sanity Studio w/ custom document'),
    ),

    h(
      'body',
      {
        'data-studio-mode': process.env.SANITY_STUDIO_MODE,
        'data-studio-dataset': process.env.SANITY_STUDIO_DATASET,
      },
      h('div', {id: 'sanity'}),
      h('script', {type: 'module', src: props.entryPath}),
    ),
  )
}
