/* eslint-disable max-nested-callbacks */
import {Observable, BehaviorSubject} from 'rxjs'
import {createUserColorManager} from '../src/user-color/manager'
import {ManagerOptions} from '../src/user-color/types'

const colorPreferences = {
  anders: 'orange',
  devin: 'blue',
  even: 'magenta',
  kokos: 'purple',
  magnus: 'cyan',
  yggrasil: 'yellow'
}
const peopleNames = Object.keys(colorPreferences)

const mockUserStore: ManagerOptions['userStore'] = {
  currentUser: new BehaviorSubject({
    type: 'snapshot' as 'snapshot',
    user: {id: 'current'}
  })
}

const options: ManagerOptions = {
  currentUserColor: 'blue',
  colors: ['blue', 'cyan', 'yellow', 'orange', 'magenta', 'purple']
}

describe('user color manager', () => {
  test('chooses prefered color based on hash if unused', () => {
    expectColor(createUserColorManager(options).get('bamse'), 'magenta')

    return nextTick()
  })

  test('returns same color when still assigned', () => {
    const manager = createUserColorManager(options)
    expectColor(manager.get('bamse'), 'magenta')
    expectColor(manager.get('bamse'), 'magenta')

    return nextTick()
  })

  test('returns same color when still assigned (has open subscriptions)', () => {
    const manager = createUserColorManager(options)
    const sub1 = manager.get('bamse').subscribe(color => expect(color).toBe('magenta'))
    const sub2 = manager.get('bamse').subscribe(color => expect(color).toBe('magenta'))
    sub1.unsubscribe()
    sub2.unsubscribe()

    return nextTick()
  })

  test('falls back to "least used" if preferred color is not available', () => {
    // kokos and espen has the same preferred color (purple),
    // but as kokos got it assigned first, espen will have to waive
    let manager = createUserColorManager(options)
    let sub = manager.get('kokos').subscribe(color => expect(color).toBe('purple'))
    expectColor(manager.get('espen'), 'blue')
    sub.unsubscribe()

    // just to make sure, reverse and see that the opposite is also true:
    // kokos and espen has the same preferred color (purple),
    // but as espen got it assigned first, kokos will have to waive
    manager = createUserColorManager(options)
    sub = manager.get('espen').subscribe(color => expect(color).toBe('purple'))
    expectColor(manager.get('kokos'), 'blue')
    sub.unsubscribe()

    return nextTick()
  })

  test('returns the same color as previously chosen if there are no unused', () => {
    const manager = createUserColorManager(options)

    // Ask for a color, but release it right away
    expectColor(manager.get('kokos'), 'purple')

    // Both espen and kokos prefers purple. Assign all but one color slot to non-kokos
    // people, and include Espen. This means kokos will ask at a time when there are
    // unused colors, and the previously assigned color is in use, which should prioritize
    // giving a unique color instead of giving the previously used one.
    const nonKokos = ['espen'].concat(
      peopleNames.filter(name => name !== 'kokos' && name !== 'yggrasil')
    )

    const subs = nonKokos.map(name =>
      manager.get(name).subscribe(color => expect(color).toBe(colorPreferences[name] || 'purple'))
    )

    // Now, when kokos wants her previous color, and there is an unused slot, she should
    // be given the unused color instead of the previously assigned one
    expectColor(manager.get('kokos'), 'yellow')

    subs.forEach(sub => sub.unsubscribe())

    return nextTick()
  })

  test('falls back on last used color if all colors are taken', () => {
    const manager = createUserColorManager(options)

    const subs = [manager.get('espen').subscribe(color => expect(color).toBe('purple'))].concat(
      peopleNames
        .filter(name => name !== 'kokos')
        .map(name =>
          manager.get(name).subscribe(color => expect(color).toBe(colorPreferences[name]))
        )
    )

    // espen "stole" purple, so kokos will have to pick a different color
    expectColor(manager.get('kokos'), 'blue')

    // subsequent calls will still give that color
    expectColor(manager.get('kokos'), 'blue')

    subs.forEach(sub => sub.unsubscribe())

    return nextTick()
  })

  test('"current user" has static color (empty state)', () => {
    const manager = createUserColorManager({...options, userStore: mockUserStore})
    expectColor(manager.get('current'), options.currentUserColor)
    return nextTick()
  })

  test('"current user" has static color (all slots filled state)', () => {
    const manager = createUserColorManager({...options, userStore: mockUserStore})
    const subs = peopleNames.map(name => manager.get(name).subscribe(() => null))

    expectColor(manager.get('current'), options.currentUserColor)

    subs.forEach(sub => sub.unsubscribe())
    return nextTick()
  })

  test('"current user" presence means default color is taken from the start', () => {
    const manager = createUserColorManager({...options, userStore: mockUserStore})
    const subs = peopleNames.map(name => {
      const preference = colorPreferences[name]
      const nextInLine = options.colors.find(color => color !== options.currentUserColor)
      return manager
        .get(name)
        .subscribe(color =>
          expect(color).toBe(preference === options.currentUserColor ? nextInLine : preference)
        )
    })

    subs.forEach(sub => sub.unsubscribe())
    return nextTick()
  })

  test('throws if current user color is not in colors list', () => {
    const incompleteColors = options.colors.filter(color => color !== options.currentUserColor)

    expect(() => {
      createUserColorManager({...options, colors: incompleteColors})
    }).toThrowErrorMatchingInlineSnapshot(`"'colors' must contain 'currentUserColor' (blue)"`)
  })
})

function expectColor(obs: Observable<string>, expectedColor: string) {
  let returned = '<did not syncronously return>'
  obs
    .subscribe(color => {
      returned = color
    })
    .unsubscribe()

  expect(returned).toBe(expectedColor)
}

// Because observables can be both sync and async, and errors are async,
// returning a promise that waits until the next tick (ish) will ensure
// that errors thrown after test code does not silently get swallowed
function nextTick() {
  return new Promise(resolve => setImmediate(resolve))
}
