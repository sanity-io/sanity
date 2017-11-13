import initSanity from './initSanity'
import initPlugin from './initPlugin'

export default (args, context) => {
  const [type] = args.argsWithoutOptions

  if (!type) {
    return initSanity(args, context)
  }

  if (type === 'plugin') {
    return initPlugin(args, context)
  }

  return Promise.reject(new Error(`Unknown init type "${type}"`))
}
