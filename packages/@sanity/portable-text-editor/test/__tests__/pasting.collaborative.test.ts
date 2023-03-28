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
        _key: 'A-4',
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

  it('can paste empty lines from clipboard without duplicating keys', async () => {
    const [editorA] = await getEditors()
    await editorA.paste('\n\n', 'text/plain')
    const data = `<meta charset='utf-8'><div class="pt-block pt-text-block pt-text-block-style-normal" spellcheck="true"><div><div><div data-as="div" data-ui="Box" data-testid="text-block" class="sc-pyfCe ejpaYo"><div data-as="div" data-ui="Box" data-testid="text-block__wrapper" class="sc-pyfCe fzrBED sc-cqQeAO jubvhE"><div data-as="div" data-ui="Flex" class="sc-pyfCe hDoDhD sc-csuSiG dCdti"><div data-as="div" data-ui="Box" class="sc-pyfCe jRVwRg"><div data-read-only="false" data-testid="text-block__text" class="sc-jeToga carTaU"><div data-as="div" data-ui="Flex" class="sc-pyfCe fzrBED sc-csuSiG jCgSkH sc-cTVMo ixGLsO"><div data-text=""><div data-ui="Text" data-testid="text-style--normal" class="sc-bcXHqe bHshCf"><span><div class="sc-dMVFSy jJslKz"><div data-testid="text-style--normal" class="sc-dMVFSy jJslKz"><span><span><span data-slate-length="0">
    </span></span></span></div></div></span></div></div></div></div></div><div data-as="div" data-ui="Box" class="sc-pyfCe fzrBED sc-eSEOys fsTfdf"><div data-as="div" data-ui="Box" class="sc-pyfCe kflhPW sc-ayeQl gUcksj"><div data-as="div" data-ui="Flex" class="sc-pyfCe fzrBED sc-csuSiG dCdti sc-iQAVnG htHGtr"></div></div></div></div></div></div></div></div></div><div class="pt-block pt-text-block pt-text-block-style-normal" spellcheck="true"><div><div><div data-as="div" data-ui="Box" data-testid="text-block" class="sc-pyfCe ejpaYo"><div data-as="div" data-ui="Box" data-testid="text-block__wrapper" class="sc-pyfCe fzrBED sc-cqQeAO jubvhE"><div data-as="div" data-ui="Flex" class="sc-pyfCe hDoDhD sc-csuSiG dCdti"><div data-as="div" data-ui="Box" class="sc-pyfCe jRVwRg"><div data-read-only="false" data-testid="text-block__text" class="sc-jeToga carTaU"><div data-as="div" data-ui="Flex" class="sc-pyfCe fzrBED sc-csuSiG jCgSkH sc-cTVMo ixGLsO"><div data-text=""><div data-ui="Text" data-testid="text-style--normal" class="sc-bcXHqe bHshCf"><span><div class="sc-dMVFSy jJslKz"><div data-testid="text-style--normal" class="sc-dMVFSy jJslKz"><span><span><span>
    Lala</span></span></span></div></div></span></div></div></div></div></div><div data-as="div" data-ui="Box" class="sc-pyfCe fzrBED sc-eSEOys fsTfdf"><div data-as="div" data-ui="Box" class="sc-pyfCe kflhPW sc-ayeQl gUcksj"><div data-as="div" data-ui="Flex" class="sc-pyfCe fzrBED sc-csuSiG dCdti sc-iQAVnG htHGtr"></div></div></div></div></div></div></div></div></div><div class="pt-block pt-text-block pt-text-block-style-normal" spellcheck="true"><div><div><div data-as="div" data-ui="Box" data-testid="text-block" class="sc-pyfCe ejpaYo"><div data-as="div" data-ui="Box" data-testid="text-block__wrapper" class="sc-pyfCe fzrBED sc-cqQeAO jubvhE"><div data-as="div" data-ui="Flex" class="sc-pyfCe hDoDhD sc-csuSiG dCdti"><div data-as="div" data-ui="Box" class="sc-pyfCe jRVwRg"><div data-read-only="false" data-testid="text-block__text" class="sc-jeToga carTaU"><div data-as="div" data-ui="Flex" class="sc-pyfCe fzrBED sc-csuSiG jCgSkH sc-cTVMo ixGLsO"><div data-text=""><div data-ui="Text" data-testid="text-style--normal" class="sc-bcXHqe bHshCf"><span><div class="sc-dMVFSy jJslKz"><div data-testid="text-style--normal" class="sc-dMVFSy jJslKz"><span><span><span>Lala</span></span></span></div></div></span></div></div></div></div></div></div></div></div></div></div></div>`
    await editorA.paste(data, 'text/html')
    const valueA = await editorA.getValue()
    expect(valueA).toMatchObject([
      {
        _key: 'A-4',
        children: [
          {
            _type: 'span',
            text: '',
            marks: [],
          },
        ],
        markDefs: [],
        _type: 'block',
        style: 'normal',
      },
      {
        _key: 'A-6',
        children: [
          {
            _type: 'span',
            marks: [],
            text: 'LalaLala',
          },
        ],
        markDefs: [],
        _type: 'block',
        style: 'normal',
      },
    ])
  })
})
