/**
 * TypeScript version of the `neat-stack` module by
 * ISC License (ISC)
 * Copyright 2017 - 2019 Shinnosuke Watanabe
 */
import {inspect} from 'node:util'

import chalk from 'chalk'
import cleanStack from 'clean-stack'

const options = {pretty: process.platform !== 'win32'}

export function neatStack(error: string | Error): string {
  if (typeof error === 'string') {
    return chalk.red(cleanStack(error, options))
  }

  if (error === null || typeof error !== 'object' || typeof error.stack !== 'string') {
    return chalk.red(inspect(error))
  }

  const title = error.toString()
  const stack = cleanStack(error.stack, options)

  if (!stack.startsWith(title)) {
    return chalk.red(stack)
  }

  return chalk.red(`${title}${chalk.dim(cleanStack(error.stack, options).slice(title.length))}`)
}
