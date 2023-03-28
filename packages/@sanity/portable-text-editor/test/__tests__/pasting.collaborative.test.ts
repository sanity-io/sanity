/** @jest-environment ./test/setup/collaborative.jest.env.ts */

import '../setup/globals.jest'

// Ideally pasting should be tested in a testing-library test, but I have not found a way to do it natively with testing-lib.
// The problem is to get permission to write to the host clipboard.
// We can do it in these test's though (as we can override browser permissions through packages/@sanity/portable-text-editor/test/setup/collaborative.jest.env.ts)
describe('pasting', () => {
  it('can paste into an empty editor', async () => {
    const [editorA] = await getEditors()
    await editorA.paste('Yo!')
    const valueA = await editorA.getValue()
    expect(valueA).toMatchObject([
      {
        _key: 'A-2',
        _type: 'block',
        children: [{_type: 'span', marks: [], text: 'Yo!'}], // _key is random here (from @sanity/block-tools) and is left out.
        markDefs: [],
        style: 'normal',
      },
    ])
  })
  it('can paste into an populated editor', async () => {
    const [editorA, editorB] = await getEditors()
    await editorB.insertText('Hey!')
    await editorA.paste('Yo!')
    const valueA = await editorA.getValue()
    expect(valueA).toMatchObject([
      {
        _key: 'B-0',
        _type: 'block',
        children: [{_type: 'span', marks: [], text: 'Hey!Yo!'}], // _key is random here (from @sanity/block-tools) and is left out.
        markDefs: [],
        style: 'normal',
      },
    ])
  })
})
