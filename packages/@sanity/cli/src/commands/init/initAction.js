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

  // Do not use this, unless you're really sure you know what you're doing
  if (type === 'blåbær') {
    return initPlugin(args, context, {sanityStyle: true})
  }

  return Promise.reject(new Error(`Unknown init type "${type}"`))
}
