import {globSync, readFileSync} from 'node:fs'
import path from 'node:path'

import {type Selector, transform} from 'lightningcss'
import {describe, expect, test} from 'vitest'

const packageRoot = path.resolve(import.meta.dirname, '../..')
const modules = globSync('src/redesign/**/*.module.css', {cwd: packageRoot}).toSorted()
const sources = globSync('src/redesign/**/*.tsx', {cwd: packageRoot}).toSorted()

const MOVING_PROPERTIES = new Set(['transform', 'scale', 'zoom'])

function isPressSelector(selector: Selector): boolean {
  return selector.some(
    (component) =>
      (component.type === 'pseudo-class' && component.kind === 'active') ||
      (component.type === 'attribute' && /^(data|aria)-pressed$/.test(component.name)),
  )
}

/** The selectors of every rule that moves an element while it is pressed */
function pressTransforms(file: string): string[] {
  const found: string[] = []
  transform({
    filename: file,
    code: readFileSync(path.join(packageRoot, file)),
    cssModules: true,
    visitor: {
      Rule: {
        style(rule) {
          const {selectors, declarations} = rule.value
          const moves = [
            ...(declarations.declarations ?? []),
            ...(declarations.importantDeclarations ?? []),
          ].some((declaration) => MOVING_PROPERTIES.has(declaration.property))
          if (moves && selectors.some(isPressSelector)) {
            found.push(JSON.stringify(selectors))
          }
          return undefined
        },
      },
    },
  })
  return found
}

// Studio's buttons, tabs and chips stay put when pressed, and Vision's redesign matches them
describe('pressed controls do not scale or move', () => {
  test.each(modules)('%s', (file) => {
    expect(pressTransforms(file)).toEqual([])
  })

  test('no motion component scales on tap', () => {
    const offenders = sources.filter((file) =>
      /\bwhile(Tap|Press)\b/.test(readFileSync(path.join(packageRoot, file), 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})
