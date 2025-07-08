import {isInteractive} from '../../util/isInteractive'

interface Colors {
  bold: (text: string) => string
  dim: (text: string) => string
  blue: (text: string) => string
  green: (text: string) => string
  yellow: (text: string) => string
  red: (text: string) => string
}

function createColors(useColors: boolean): Colors {
  if (!useColors) {
    return {
      bold: (s: string) => s,
      dim: (s: string) => s,
      blue: (s: string) => s,
      green: (s: string) => s,
      yellow: (s: string) => s,
      red: (s: string) => s,
    }
  }

  return {
    bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
    dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
    blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
    green: (s: string) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
    red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  }
}

/**
 * Return markdown as-is without any colorization
 * Colorization can be added back later if needed
 */
export function colorizeMarkdown(markdown: string, noColor: boolean = false): string {
  return markdown
}
