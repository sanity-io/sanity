import {Descendant, Editor, Operation} from 'slate'
import {
  Path,
  PortableTextBlock,
  PortableTextSpan,
  PortableTextTextBlock,
  isPortableTextSpan,
  isPortableTextTextBlock,
} from '@sanity/types'
import {makeDiff, makePatches, stringifyPatches} from '@sanity/diff-match-patch'
import {diffMatchPatch} from '../patchToOperations'
import {DiffMatchPatch} from '../../types/patch'

describe('operationToPatches: diffMatchPatch', () => {
  test.todo('skips patches for blocks that cannot be found locally')
  test.todo('skips patches for non-PT-blocks')
  test.todo('skips patches for non-spans')
  test.todo('throws if cannot find span')

  test('should apply the most basic additive operation correctly', () => {
    const source = 'Hello'
    const target = 'Hello there'
    const patch = getPteDmpPatch(stringifyPatches(makePatches(makeDiff(source, target))))
    const editor = getMockEditor({text: source})
    expect(diffMatchPatch(editor, patch)).toBe(true)
    expect(editor.getText()).toBe(target)
  })

  test('should apply the most basic removal operation correctly', () => {
    const source = 'Hello there'
    const target = 'Hello'
    const patch = getPteDmpPatch(stringifyPatches(makePatches(makeDiff(source, target))))
    const editor = getMockEditor({text: source})
    expect(diffMatchPatch(editor, patch)).toBe(true)
    expect(editor.getText()).toBe(target)
  })

  test('should treat equality as noops', () => {
    const source = 'Hello'
    const target = 'Hello'
    const patch = getPteDmpPatch(stringifyPatches(makePatches(makeDiff(source, target))))
    const editor = getMockEditor({text: source})
    expect(diffMatchPatch(editor, patch)).toBe(true)
    expect(editor.getText()).toBe(target)
  })

  test('should apply combined add + remove operations', () => {
    const source = 'A quick brown fox jumps over the very lazy dog'
    const target = 'The quick brown fox jumps over the lazy dog'
    const patch = getPteDmpPatch(stringifyPatches(makePatches(makeDiff(source, target))))
    const editor = getMockEditor({text: source})
    expect(diffMatchPatch(editor, patch)).toBe(true)
    expect(editor.getText()).toBe(target)
  })

  test('should apply combined add + remove operations', () => {
    const source = 'Many quick brown fox jumps over the very lazy dog'
    const target = 'The many, quick, brown, foxes jumps over all of the lazy dogs'
    const patch = getPteDmpPatch(stringifyPatches(makePatches(makeDiff(source, target))))
    const editor = getMockEditor({text: source})
    expect(diffMatchPatch(editor, patch)).toBe(true)
    expect(editor.getText()).toBe(target)
  })

  test('should apply reverse line edits correctly', () => {
    const line1 = 'The quick brown fox jumps over the lazy dog'
    const line2 = 'But the slow green frog jumps over the wild cat'
    const source = [line1, line2, line1, line2].join('\n')
    const target = [line2, line1, line2, line1].join('\n')
    const patch = getPteDmpPatch(stringifyPatches(makePatches(makeDiff(source, target))))
    const editor = getMockEditor({text: source})
    expect(diffMatchPatch(editor, patch)).toBe(true)
    expect(editor.getText()).toBe(target)
  })

  test('should apply larger text differences correctly', () => {
    const source = `Portable Text is a agnostic abstraction of "rich text" that can be stringified into any markup language, for instance HTML, Markdown, SSML, XML, etc. It's designed to be efficient for collaboration, and makes it possible to enrich rich text with data structures in depth.\n\nPortable Text is built on the idea of rich text as an array of blocks, themselves arrays of children spans. Each block can have a style and a set of mark dfinitions, which describe data structures distributed on the children spans. Portable Text also allows for inserting arbitrary data objects in the array, only requiring _type-key. Portable Text also allows for custom objects in the root array, enabling rendering environments to mix rich text with custom content types.\n\nPortable Text is a combination of arrays and objects. In its simplest form it's an array of objects with an array of children. Some definitions: \n- Block: Typically recognized as a section of a text, e.g. a paragraph or a heading.\n- Span: Piece of text with a set of marks, e.g. bold or italic.\n- Mark: A mark is a data structure that can be appliad to a span, e.g. a link or a comment.\n- Mark definition: A mark definition is a structure that describes a mark, a link or a comment.`
    const target = `Portable Text is an agnostic abstraction of rich text that can be serialized into pretty much any markup language, be it HTML, Markdown, SSML, XML, etc. It is designed to be efficient for real-time collaborative interfaces, and makes it possible to annotate rich text with additional data structures recursively.\n\nPortable Text is built on the idea of rich text as an array of blocks, themselves arrays of child spans. Each block can have a style and a set of mark definitions, which describe data structures that can be applied on the children spans. Portable Text also allows for inserting arbitrary data objects in the array, only requiring _type-key. Portable Text also allows for custom content objects in the root array, enabling editing- and rendering environments to mix rich text with custom content types.\n\nPortable Text is a recursive composition of arrays and objects. In its simplest form it's an array of objects of a type with an array of children. Some definitions: \n- Block: A block is what's typically recognized as a section of a text, e.g. a paragraph or a heading.\n- Span: A span is a piece of text with a set of marks, e.g. bold or italic.\n- Mark: A mark is a data structure that can be applied to a span, e.g. a link or a comment.\n- Mark definition: A mark definition is a data structure that describes a mark, e.g. a link or a comment.`
    const patch = getPteDmpPatch(stringifyPatches(makePatches(makeDiff(source, target))))
    const editor = getMockEditor({text: source})
    expect(diffMatchPatch(editor, patch)).toBe(true)
    expect(editor.getText()).toBe(target)
  })

  test('should apply offset text differences correctly', () => {
    const source = `This string has changes, but they occur somewhere near the end. That means we need to use an offset to get at the change, we cannot just rely on equality segaments in the generated diff.`
    const target = `This string has changes, but they occur somewhere near the end. That means we need to use an offset to get at the change, we cannot just rely on equality segments in the generated diff.`
    const patch = getPteDmpPatch(stringifyPatches(makePatches(makeDiff(source, target))))
    const editor = getMockEditor({text: source})
    expect(diffMatchPatch(editor, patch)).toBe(true)
    expect(editor.getText()).toBe(target)
  })
})

function getPteDmpPatch(
  value: string,
  path: Path = [{_key: 'bA'}, 'children', {_key: 's1'}, 'text']
): DiffMatchPatch {
  return {
    type: 'diffMatchPatch',
    path,
    origin: 'remote',
    value,
  }
}

type MockEditorOptions = {children: PortableTextTextBlock[]} | {text: string}

function getMockEditor(
  options: MockEditorOptions
): Pick<Editor, 'children' | 'isTextBlock' | 'apply'> & {getText: () => string} {
  let children: PortableTextBlock[] = 'children' in options ? options.children : []
  if (!('children' in options)) {
    children = [
      {
        _type: 'block',
        _key: 'bA',
        children: [{_type: 'span', _key: 's1', text: 'text' in options ? options.text : ''}],
        markDefs: [],
      },
    ]
  }

  function getText(blockKey?: string) {
    return children
      .filter((child): child is PortableTextTextBlock => isPortableTextTextBlock(child))
      .filter((child) => (blockKey ? child._key === blockKey : true))
      .flatMap((block) =>
        block.children
          .filter((span) => isPortableTextSpan(span))
          .map((span) => span.text)
          .join('')
      )
      .join('\n\n')
  }

  function isTextBlock(value: unknown): value is PortableTextTextBlock {
    return isPortableTextTextBlock(value)
  }

  function apply(operation: Operation): void {
    if (operation.type !== 'insert_text' && operation.type !== 'remove_text') {
      throw new Error(`Unexpected operation type ${operation.type}`)
    }

    // Forcing for tests, theoretically can target non-PT blocks
    const ptBlocks = children as PortableTextTextBlock<PortableTextSpan>[]

    const {type, path, offset, text} = operation
    const [blockIndex, spanIndex] = path
    const span = ptBlocks[blockIndex].children[spanIndex]
    const current = span.text

    if (type === 'insert_text') {
      const before = current.slice(0, offset)
      const after = current.slice(offset)
      span.text = `${before}${text}${after}`
    } else if (type === 'remove_text') {
      const before = current.slice(0, offset)
      const after = current.slice(offset + text.length)
      span.text = `${before}${after}`
    }
  }

  return {
    getText,
    children: children as Descendant[],
    apply,
    isTextBlock,
  }
}
