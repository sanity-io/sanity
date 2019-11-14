import {getNextFocusableMenuItemIdx, getPreviousFocusableMenuItemIdx} from './helpers'

describe('DocumentStatusBar/helpers/getPreviousFocusableMenuItemIdx', () => {
  it('should yield prev/next focusable action indexes when no actions are disabled', () => {
    const actions = [{}, {}, {}, {}]

    // next
    expect(getNextFocusableMenuItemIdx(actions, -1)).toBe(0)
    expect(getNextFocusableMenuItemIdx(actions, 0)).toBe(1)
    expect(getNextFocusableMenuItemIdx(actions, 1)).toBe(2)
    expect(getNextFocusableMenuItemIdx(actions, 2)).toBe(0)

    // previous
    expect(getPreviousFocusableMenuItemIdx(actions, -1)).toBe(2)
    expect(getPreviousFocusableMenuItemIdx(actions, 0)).toBe(2)
    expect(getPreviousFocusableMenuItemIdx(actions, 1)).toBe(0)
    expect(getPreviousFocusableMenuItemIdx(actions, 2)).toBe(1)
  })

  it('should yield prev/next focusable action indexes when some actions are disabled', () => {
    const actions = [{}, {disabled: true}, {}, {}, {disabled: true}]

    // next
    expect(getNextFocusableMenuItemIdx(actions, -1)).toBe(1)
    expect(getNextFocusableMenuItemIdx(actions, 1)).toBe(2)
    expect(getNextFocusableMenuItemIdx(actions, 2)).toBe(1)

    // previous
    expect(getPreviousFocusableMenuItemIdx(actions, -1)).toBe(2)
    expect(getPreviousFocusableMenuItemIdx(actions, 1)).toBe(2)
    expect(getPreviousFocusableMenuItemIdx(actions, 2)).toBe(1)
  })
})
