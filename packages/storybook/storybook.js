const React = require('react')
const h = React.createElement // eslint-disable-line id-length

function Document(props) {
  return h('html', null,
    h('head', null,
      h('meta', {charSet: 'utf-8'}),
      h('meta', {httpEquiv: 'refresh', content: '0; url=http://localhost:9001/'}),
      h('title', null, 'Loading Storybook...')
    ),
    h('body', null,
      h('div', null, 'Loading Storybook...')
    )
  )
}

module.exports = Document
