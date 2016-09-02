import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/client.js',
  plugins: [buble()],
  moduleName: 'SanityClient',
  targets: [
    {dest: 'lib/client.cjs.js', format: 'cjs'},
    {dest: 'lib/client.es.js', format: 'es'},
    {dest: 'umd/bundle.js', format: 'umd'}
  ]
}
