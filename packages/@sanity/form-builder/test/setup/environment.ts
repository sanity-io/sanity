// get rid of context warning
const warn = console.warn
window.console = {
  ...window.console,
  warn: (...args: any[]) => {
    if (!/No context provided/.test(args[0])) {
      warn(...args)
    }
  },
}
