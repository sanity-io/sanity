/* eslint-disable max-nested-callbacks */

import {omit} from 'lodash'
import {Observable, BehaviorSubject} from 'rxjs'
import {createUserColorManager, UserColorManagerOptions} from '../manager'
import {UserColor} from '../types'

const colorPreferences: Record<string, string> = {
  anders: 'orange',
  devin: 'blue',
  even: 'magenta',
  kokos: 'purple',
  magnus: 'cyan',
  yggrasil: 'yellow',
}

const peopleNames = Object.keys(colorPreferences)

const getMockUserStore = (): UserColorManagerOptions['userStore'] => ({
  me: new BehaviorSubject({id: 'current'}),
})

const hues = ['blue', 'cyan', 'yellow', 'orange', 'magenta', 'purple']
const colors: UserColorManagerOptions['colors'] = hues.reduce<UserColorManagerOptions['colors']>(
  (acc, hue) => {
    if (acc) acc[hue] = {background: hue, text: hue, border: hue} as any
    return acc
  },
  {}
)

const options: UserColorManagerOptions = {
  currentUserColor: 'blue',
  colors,
  scheme: 'light',
}

describe('user color manager', () => {
  test('chooses prefered color based on hash if unused', () => {
    expectColor(createUserColorManager(options).listen('bamse'), 'magenta')

    return nextTick()
  })

  test('returns same color when still assigned', () => {
    const manager = createUserColorManager(options)
    expectColor(manager.listen('bamse'), 'magenta')
    expectColor(manager.listen('bamse'), 'magenta')

    return nextTick()
  })

  test('returns same color when still assigned (has open subscriptions)', () => {
    const manager = createUserColorManager(options)
    const sub1 = manager.listen('bamse').subscribe((color) => expect(color).toBe(colors?.magenta))
    const sub2 = manager.listen('bamse').subscribe((color) => expect(color).toBe(colors?.magenta))
    sub1.unsubscribe()
    sub2.unsubscribe()

    return nextTick()
  })

  test('falls back to "least used" if preferred color is not available', () => {
    // kokos and espen has the same preferred color (purple),
    // but as kokos got it assigned first, espen will have to waive
    let manager = createUserColorManager(options)
    let sub = manager.listen('kokos').subscribe((color) => expect(color).toBe(colors?.purple))
    expectColor(manager.listen('espen'), 'blue')
    sub.unsubscribe()

    // just to make sure, reverse and see that the opposite is also true:
    // kokos and espen has the same preferred color (purple),
    // but as espen got it assigned first, kokos will have to waive
    manager = createUserColorManager(options)
    sub = manager.listen('espen').subscribe((color) => expect(color).toBe(colors?.purple))
    expectColor(manager.listen('kokos'), 'blue')
    sub.unsubscribe()

    return nextTick()
  })

  test('returns the same color as previously chosen if there are no unused', () => {
    const manager = createUserColorManager(options)

    // Ask for a color, but release it right away
    expectColor(manager.listen('kokos'), 'purple')

    // Both espen and kokos prefers purple. Assign all but one color slot to non-kokos
    // people, and include Espen. This means kokos will ask at a time when there are
    // unused colors, and the previously assigned color is in use, which should prioritize
    // giving a unique color instead of giving the previously used one.
    const nonKokos = ['espen'].concat(
      peopleNames.filter((name) => name !== 'kokos' && name !== 'yggrasil')
    )

    const subs = nonKokos.map((name) =>
      manager
        .listen(name)
        .subscribe((color) => expect(color).toBe(colors?.[colorPreferences[name] || 'purple']))
    )

    // Now, when kokos wants her previous color, and there is an unused slot, she should
    // be given the unused color instead of the previously assigned one
    expectColor(manager.listen('kokos'), 'yellow')

    subs.forEach((sub) => sub.unsubscribe())

    return nextTick()
  })

  test('falls back on last used color if all colors are taken', () => {
    const manager = createUserColorManager(options)

    const subs = [
      manager.listen('espen').subscribe((color) => expect(color).toBe(colors?.purple)),
    ].concat(
      peopleNames
        .filter((name) => name !== 'kokos')
        .map((name) =>
          manager
            .listen(name)
            .subscribe((color) => expect(color).toBe(colors?.[colorPreferences[name]]))
        )
    )

    // espen "stole" purple, so kokos will have to pick a different color
    expectColor(manager.listen('kokos'), 'blue')

    // subsequent calls will still give that color
    expectColor(manager.listen('kokos'), 'blue')

    subs.forEach((sub) => sub.unsubscribe())

    return nextTick()
  })

  test('"current user" has static color (empty state)', () => {
    const manager = createUserColorManager({...options, userStore: getMockUserStore()})
    expectColor(manager.listen('current'), options.currentUserColor!)
    return nextTick()
  })

  test('"current user" has static color (all slots filled state)', () => {
    const manager = createUserColorManager({...options, userStore: getMockUserStore()})
    const subs = peopleNames.map((name) => manager.listen(name).subscribe(() => null))

    expectColor(manager.listen('current'), options.currentUserColor!)

    subs.forEach((sub) => sub.unsubscribe())
    return nextTick()
  })

  test('"current user" presence means default color is taken from the start', async () => {
    const manager = createUserColorManager({...options, userStore: getMockUserStore()})
    await nextTick()

    const nextHueInLine = hues.find((color) => color !== options.currentUserColor)
    const prefersBlue = peopleNames.find(
      (name) => colorPreferences[name] === options.currentUserColor
    )

    expectColor(manager.listen(prefersBlue!), nextHueInLine!)

    await new Promise((resolve) => setTimeout(resolve, 100))

    return nextTick()
  })

  test('throws if current user color is not in colors list', () => {
    const incompleteColors = omit(options.colors, ['blue'])

    expect(() => {
      createUserColorManager({...options, colors: incompleteColors})
    }).toThrowErrorMatchingInlineSnapshot(`"'colors' must contain 'currentUserColor' (blue)"`)
  })

  test('can return sync value', () => {
    expect(createUserColorManager(options).get('kokos')).toBe(colors?.[colorPreferences.kokos])
  })
})

function expectColor(obs: Observable<UserColor>, expectedHue: string) {
  let returned: UserColor | undefined
  obs
    .subscribe((color) => {
      returned = color
    })
    .unsubscribe()

  expect(returned).toBe(colors?.[expectedHue])
}

// Because observables can be both sync and async, and errors are async,
// returning a promise that waits until the next tick (ish) will ensure
// that errors thrown after test code does not silently get swallowed
function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}
