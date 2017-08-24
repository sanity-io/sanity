const presets = ['es2015-node4', 'stage-2']

require('babel-register')({
  presets: presets.map(preset => require.resolve(`babel-preset-${preset}`)),
})
