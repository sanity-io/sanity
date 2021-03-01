const path = require('path')
const extractCssCustomProperties = require('../src/v3/extractCssCustomProperties')

const basePath = path.join(__dirname, 'fixtures')
const entryPath = path.join(basePath, 'root.css')
const missingPath = path.join(basePath, 'missing.css')
const brokenPath = path.join(basePath, 'broken.css')
const nonPartPath = path.join(basePath, 'non-part.css')

describe('extract css custom properties', () => {
  test('replaces all variables, regardless of depth', async () => {
    const customProps = await extractCssCustomProperties(basePath, entryPath)
    for (const value of Object.values(customProps)) {
      expect(value).not.toContain('--')
    }
  })

  test('finds all variables', async () => {
    const customProps = await extractCssCustomProperties(basePath, entryPath)
    expect(customProps).toMatchInlineSnapshot(`
      Object {
        "--blend-amount": "20%",
        "--border-base": "blue",
        "--bottom-border": "rgb(189, 25, 68)",
        "--composed-from-deepest": "rgb(213, 230, 247)",
        "--composed-from-non-part": "rgba(128, 128, 128, 0.05)",
        "--deeper-composed-from-non-part": "rgba(128, 128, 128, 0.1)",
        "--from-deeper": "#bf1942",
        "--from-deepest": "#abcdef",
        "--from-non-part": "rgb(128, 128, 128)",
        "--imported-reference": "#bf1942",
        "--left-border": "rgb(191, 25, 66)",
        "--plain": "#f00baa",
        "--right-border": "rgb(183, 24, 74)",
        "--root-composed-from-deeper-non-part": "rgba(128, 128, 128, 0.15)",
        "--scoped-reference": "#f00baa",
        "--top-border": "rgb(153, 20, 104)",
      }
    `)
  })

  test('warns and skips declarations referencing undeclared variables', async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const customProps = await extractCssCustomProperties(basePath, missingPath)
    expect(customProps).toMatchInlineSnapshot(`
          Object {
            "--color": "#bf1942",
            "--present": "#bf1942",
          }
        `)

    expect(spy).toHaveBeenCalledWith(
      'variable var(--bar) references undeclared variable, "--bar" - skipping'
    )
    spy.mockRestore()
  })

  test('logs error and returns undefined on broken css', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    const customProps = await extractCssCustomProperties(basePath, brokenPath)
    expect(customProps).toBe(undefined)

    expect(spy).toHaveBeenCalled()
    expect(spy.mock.calls[0][0]).toMatch('Failed to read CSS custom properties')
    spy.mockRestore()
  })

  test('works on css without using parts', async () => {
    const customProps = await extractCssCustomProperties(basePath, nonPartPath)
    expect(customProps).toMatchInlineSnapshot(`
      Object {
        "--from-non-part": "rgb(128, 128, 128)",
      }
    `)
  })
})
