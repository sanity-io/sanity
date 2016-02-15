/* eslint-disable no-console */
export default {
  print(...args) {
    console.log(...args)
  },

  error(...args) {
    if (args[0] instanceof Error) {
      console.error(args[0].stack)
    } else {
      console.error(...args)
    }
  }
}
