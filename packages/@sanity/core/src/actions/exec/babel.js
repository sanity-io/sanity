import registerBabel from 'babel-register'

registerBabel({
  presets: [
    [
      'env',
      {
        targets: {
          node: 'current'
        }
      }
    ]
  ]
})
