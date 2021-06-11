/* eslint-disable no-undef */
// Grammar from https://github.com/sanity-io/vscode-sanity
const rules = {
  start: [
    {
      include: '#query',
    },
    {
      include: '#value',
    },
    {
      include: '#pair',
    },
  ],
  '#query': [
    {
      include: '#nullary-access-operator',
    },
    {
      include: '#arraylike',
    },
    {
      include: '#pipe',
    },
    {
      include: '#sort-order',
    },
    {
      include: '#filter',
    },
  ],
  '#variable': [
    {
      token: 'variable.other.groq',
      regex: /\$[_A-Za-z][_0-9A-Za-z]*/,
    },
  ],
  '#keyword': [
    {
      token: 'keyword.other.groq',
      regex: /\b(?:asc|desc|in|match)\b/,
    },
  ],
  '#comparison': [
    {
      token: 'keyword.operator.comparison.groq',
      regex: /==|!=|>=|<=|<!=>|<|>/,
    },
  ],
  '#operator': [
    {
      token: 'keyword.operator.arithmetic.groq',
      regex: /\+|-|\*{1,2}|\/|%/,
    },
  ],
  '#pipe': [
    {
      token: 'keyword.operator.pipe.groq',
      regex: /\|/,
    },
  ],
  '#logical': [
    {
      token: 'keyword.operator.logical.groq',
      regex: /!|&&|\|\|/,
    },
  ],
  '#reference': [
    {
      token: 'keyword.operator.reference.groq',
      regex: /\->/,
    },
  ],
  '#pair': [
    {
      include: '#identifier',
    },
    {
      include: '#value',
    },
    {
      include: '#filter',
    },
    {
      token: 'keyword.operator.pair.groq',
      regex: /=>/,
    },
  ],
  '#arraylike': [
    {
      token: 'punctuation.definition.bracket.begin.groq',
      regex: /\[/,
      push: [
        {
          token: ['text', 'keyword.operator.descendant.groq'],
          regex: /(\])((?:\s*\.)?)/,
          next: 'pop',
        },
        {
          include: '#range',
        },
        {
          include: '#filter',
        },
        {
          include: '#array-values',
        },
      ],
    },
  ],
  '#array': [
    {
      token: 'punctuation.definition.bracket.begin.groq',
      regex: /\[/,
      push: [
        {
          token: 'punctuation.definition.bracket.end.groq',
          regex: /\]/,
          next: 'pop',
        },
        {
          include: '#array-values',
        },
        {
          defaultToken: 'meta.structure.array.groq',
        },
      ],
    },
  ],
  '#range': [
    {
      token: [
        'meta.structure.range.groq',
        'constant.numeric.groq',
        'meta.structure.range.groq',
        'keyword.operator.range.groq',
        'meta.structure.range.groq',
        'constant.numeric.groq',
        'meta.structure.range.groq',
      ],
      regex: /(\s*)(\d+)(\s*)(\.{2,3})(\s*)(\d+)(\s*)/,
    },
  ],
  '#spread': [
    {
      token: 'punctuation.definition.spread.begin.groq',
      regex: /\.\.\./,
      push: [
        {
          include: '#array',
        },
        {
          include: '#function-call',
        },
        {
          include: '#projection',
        },
        {
          token: 'punctuation.definition.spread.end.groq',
          regex: /(?=.)/,
          next: 'pop',
        },
        {
          defaultToken: 'meta.structure.spread.groq',
        },
      ],
    },
  ],
  '#array-values': [
    {
      include: '#value',
    },
    {
      include: '#spread',
    },
    {
      token: 'punctuation.separator.array.groq',
      regex: /,/,
    },
    {
      token: 'invalid.illegal.expected-array-separator.groq',
      regex: /[^\s\]]/,
    },
  ],
  '#filter': [
    {
      include: '#function-call',
    },
    {
      include: '#keyword',
    },
    {
      include: '#constant',
    },
    {
      include: '#identifier',
    },
    {
      include: '#value',
    },
    {
      include: '#comparison',
    },
    {
      include: '#operator',
    },
    {
      include: '#logical',
    },
  ],
  '#comments': [
    {
      token: ['punctuation.definition.comment.groq', 'comment.line.double-slash.js'],
      regex: /(\/\/)(.*$)/,
    },
  ],
  '#nullary-access-operator': [
    {
      token: 'constant.language.groq',
      regex: /[*@^]/,
    },
  ],
  '#constant': [
    {
      token: 'constant.language.groq',
      regex: /\b(?:true|false|null)\b/,
    },
  ],
  '#number': [
    {
      token: 'constant.numeric.groq',
      regex: /-?(?:0|[1-9]\d*)(?:(?:\.\d+)?(?:[eE][+-]?\d+)?)?/,
    },
  ],
  '#named-projection': [
    {
      include: '#identifier',
    },
    {
      include: '#objectkey',
    },
    {
      include: '#projection',
    },
  ],
  '#projection': [
    {
      token: 'punctuation.definition.projection.begin.groq',
      regex: /\{/,
      push: [
        {
          token: 'punctuation.definition.projection.end.groq',
          regex: /\}/,
          next: 'pop',
        },
        {
          include: '#identifier',
        },
        {
          include: '#objectkey',
        },
        {
          include: '#named-projection',
        },
        {
          include: '#comments',
        },
        {
          include: '#spread',
        },
        {
          include: '#pair',
        },
        {
          token: 'punctuation.separator.projection.key-value.groq',
          regex: /:/,
          push: [
            {
              token: 'punctuation.separator.projection.pair.groq',
              regex: /,|(?=\})/,
              next: 'pop',
            },
            {
              include: '#nullary-access-operator',
            },
            {
              include: '#arraylike',
            },
            {
              include: '#value',
            },
            {
              include: '#spread',
            },
            {
              include: '#identifier',
            },
            {
              include: '#operator',
            },
            {
              include: '#comparison',
            },
            {
              include: '#pair',
            },
            {
              token: 'invalid.illegal.expected-projection-separator.groq',
              regex: /[^\s,]/,
            },
            {
              defaultToken: 'meta.structure.projection.value.groq',
            },
          ],
        },
        {
          token: 'invalid.illegal.expected-projection-separator.groq',
          regex: /[^\s\},]/,
        },
        {
          defaultToken: 'meta.structure.projection.groq',
        },
      ],
    },
  ],
  '#string': [
    {
      include: '#single-string',
    },
    {
      include: '#double-string',
    },
  ],
  '#double-string': [
    {
      token: 'punctuation.definition.string.begin.groq',
      regex: /"/,
      push: [
        {
          token: 'punctuation.definition.string.end.groq',
          regex: /"/,
          next: 'pop',
        },
        {
          include: '#stringcontent',
        },
        {
          defaultToken: 'string.quoted.double.groq',
        },
      ],
    },
  ],
  '#single-string': [
    {
      token: 'punctuation.definition.string.single.begin.groq',
      regex: /'/,
      push: [
        {
          token: 'punctuation.definition.string.single.end.groq',
          regex: /'/,
          next: 'pop',
        },
        {
          include: '#stringcontent',
        },
        {
          defaultToken: 'string.quoted.single.groq',
        },
      ],
    },
  ],
  '#objectkey': [
    {
      include: '#string',
    },
  ],
  '#stringcontent': [
    {
      token: 'constant.character.escape.groq',
      regex: /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/,
    },
    {
      token: 'invalid.illegal.unrecognized-string-escape.groq',
      regex: /\\./,
    },
  ],
  '#sort-pair': [
    {
      token: ['variable.other.readwrite.groq', 'text', 'keyword.other.groq'],
      regex: /([_A-Za-z][_0-9A-Za-z]*)(?:(\s*)(asc|desc))?/,
    },
    {
      token: ['constant.language.groq', 'punctuation.definition.bracket.begin.groq'],
      regex: /(@)(\[)/,
      push: [
        {
          token: ['punctuation.definition.bracket.begin.groq', 'text', 'keyword.other.groq'],
          regex: /(\])(?:(\s*)(asc|desc))?/,
          next: 'pop',
        },
        {
          include: '#string',
        },
      ],
    },
  ],
  '#sort-order': [
    {
      token: 'support.function.sortorder.begin.groq',
      regex: /\border\s*\(/,
      push: [
        {
          token: 'support.function.sortorder.end.groq',
          regex: /\)/,
          next: 'pop',
        },
        {
          include: '#sort-pair',
        },
        {
          token: 'punctuation.separator.array.groq',
          regex: /,/,
        },
        {
          token: 'invalid.illegal.expected-sort-separator.groq',
          regex: /[^\s\]]/,
        },
        {
          defaultToken: 'support.function.sortorder.groq',
        },
      ],
    },
  ],
  '#function-call': [
    {
      include: '#function-var-arg',
    },
    {
      include: '#function-single-arg',
    },
    {
      include: '#function-round',
    },
  ],
  '#function-var-arg': [
    {
      token: 'support.function.vararg.begin.groq',
      regex: /\b(?:coalesce|select)\s*\(/,
      push: [
        {
          token: 'support.function.vararg.end.groq',
          regex: /\)/,
          next: 'pop',
        },
        {
          include: '#value',
        },
        {
          include: '#identifier',
        },
        {
          include: '#filter',
        },
        {
          include: '#pair',
        },
        {
          token: 'punctuation.separator.array.groq',
          regex: /,/,
        },
        {
          defaultToken: 'support.function.vararg.groq',
        },
      ],
    },
  ],
  '#function-single-arg': [
    {
      token: 'support.function.singlearg.begin.groq',
      regex: /\b(?:count|defined|length|path|references)\s*\(/,
      push: [
        {
          token: 'support.function.singlearg.end.groq',
          regex: /\)/,
          next: 'pop',
        },
        {
          include: '#query',
        },
        {
          include: '#identifier',
        },
        {
          include: '#value',
        },
        {
          include: '#pair',
        },
        {
          defaultToken: 'support.function.singlearg.groq',
        },
      ],
    },
  ],
  '#identifier': [
    {
      token: [
        'variable.other.readwrite.groq',
        'text',
        'punctuation.definition.block.js',
        'text',
        'keyword.operator.reference.groq',
      ],
      regex: /([_A-Za-z][_0-9A-Za-z]*)(\s*)((?:\[\s*\])?)(\s*)(\->)/,
    },
    {
      token: [
        'variable.other.readwrite.groq',
        'constant.language.groq',
        'text',
        'punctuation.definition.block.js',
        'text',
        'keyword.operator.descendant.groq',
      ],
      regex: /(?:([_A-Za-z][_0-9A-Za-z]*)|([@^]))(\s*)((?:\[\s*\])?)(\s*)(\.)/,
    },
    {
      token: 'variable.other.readwrite.groq',
      regex: /[_A-Za-z][_0-9A-Za-z]*/,
    },
  ],
  '#value': [
    {
      include: '#constant',
    },
    {
      include: '#number',
    },
    {
      include: '#string',
    },
    {
      include: '#array',
    },
    {
      include: '#variable',
    },
    {
      include: '#projection',
    },
    {
      include: '#comments',
    },
    {
      include: '#function-call',
    },
  ],
}

ace.define(
  'ace/mode/groq_highlight_rules',
  ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text_highlight_rules'],
  function (acequire, exports, module) {
    const oop = acequire('../lib/oop')
    const TextHighlightRules = acequire('./text_highlight_rules').TextHighlightRules

    const GroqHighlightRules = function () {
      this.$rules = rules
      this.normalizeRules()
    }

    oop.inherits(GroqHighlightRules, TextHighlightRules)

    exports.GroqHighlightRules = GroqHighlightRules
  }
)

ace.define(
  'ace/mode/groq',
  [
    'require',
    'exports',
    'module',
    'ace/lib/oop',
    'ace/mode/text',
    'ace/tokenizer',
    'ace/mode/groq_highlight_rules',
    'ace/mode/folding/cstyle',
  ],
  function (acequire, exports, module) {
    // eslint-disable-next-line strict
    'use strict'
    const oop = acequire('../lib/oop')
    const TextMode = acequire('./text').Mode
    const Tokenizer = acequire('../tokenizer').Tokenizer
    const GroqHighlightRules = acequire('./groq_highlight_rules').GroqHighlightRules
    const FoldMode = acequire('./folding/cstyle').FoldMode

    const Mode = function () {
      const highlighter = new GroqHighlightRules()
      this.foldingRules = new FoldMode()
      this.$tokenizer = new Tokenizer(highlighter.getRules())
      this.$keywordList = highlighter.$keywordList
    }
    oop.inherits(Mode, TextMode)
    ;(function () {
      this.lineCommentStart = "'"
    }.call(Mode.prototype))

    exports.Mode = Mode
  }
)
