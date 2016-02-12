export default {
  name: 'init',
  signature: 'init [plugin]',
  description: 'Initialize a new Sanity project',
  action: function init({print, error, options}) {
    // const newArgs = yargs.command('plugin', 'Initialize new plugin').argv
    // console.log('Initialize project', newArgs)
    print(options)
  }
}
