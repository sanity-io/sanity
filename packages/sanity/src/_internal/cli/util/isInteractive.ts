export const isInteractive =
  process.stdout.isTTY && process.env.TERM !== 'dumb' && !('CI' in process.env)
