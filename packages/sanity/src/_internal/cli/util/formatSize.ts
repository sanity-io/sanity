import chalk from 'chalk'

export function formatSize(bytes: number): string {
  return chalk.cyan(`${(bytes / 1024).toFixed()} kB`)
}
