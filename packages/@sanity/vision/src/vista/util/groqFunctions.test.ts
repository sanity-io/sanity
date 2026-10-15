import {describe, expect, it} from 'vitest'

import {
  checkFunctions,
  declarationInsertion,
  describeBody,
  describeSignature,
  explainDeclarationSyntaxError,
  extractFunction,
  type FunctionExtraction,
  isSameDeclaration,
  parseDeclaration,
  parseGroq,
  readQueryFunctions,
} from './groqFunctions'

function check(query: string, library: Parameters<typeof checkFunctions>[2] = []) {
  return checkFunctions(parseGroq(query), query, library).map((finding) => ({
    rule: finding.rule,
    severity: finding.severity,
    message: finding.message,
    text: query.slice(finding.from, finding.to),
  }))
}

function applyExtraction(query: string, extraction: FunctionExtraction): string {
  let result = query
  for (const change of extraction.changes.toSorted((a, b) => b.from - a.from)) {
    result = result.slice(0, change.from) + change.insert + result.slice(change.to)
  }
  return result
}

function extract(query: string, selected: string, occurrence = 0) {
  let from = -1
  for (let index = 0; index <= occurrence; index++) {
    from = query.indexOf(selected, from + 1)
  }
  if (from === -1) throw new Error(`"${selected}" is not in the query`)
  return extractFunction(query, {from, to: from + selected.length})
}

describe('readQueryFunctions', () => {
  it('reads the declarations and the calls, with their positions', () => {
    const query =
      'fn ex::author($ref) = $ref->{name};\n*[_type == "post"]{"author": ex::author(author), "n": count(tags)} | order(_createdAt desc, title)'
    const {declarations, calls} = readQueryFunctions(parseGroq(query), query)

    expect(declarations).toHaveLength(1)
    const [author] = declarations
    expect(author).toMatchObject({id: 'ex::author', namespace: 'ex', name: 'author'})
    expect(author.parameters.map((parameter) => parameter.name)).toEqual(['$ref'])
    expect(author.text).toBe('fn ex::author($ref) = $ref->{name}')
    expect(query.slice(author.nameRange.from, author.nameRange.to)).toBe('ex::author')
    expect(describeSignature(author)).toBe('ex::author($ref)')
    expect(describeBody(author)).toBe('$ref->{name}')

    expect(
      calls.map((call) => ({
        namespace: call.namespace,
        name: call.name,
        args: call.argCount,
        piped: call.piped,
        text: query.slice(call.nameRange.from, call.nameRange.to),
      })),
    ).toEqual([
      {namespace: 'ex', name: 'author', args: 1, piped: false, text: 'ex::author'},
      {namespace: undefined, name: 'count', args: 1, piped: false, text: 'count'},
      {namespace: undefined, name: 'order', args: 2, piped: true, text: 'order'},
    ])
  })

  it('counts no arguments for an empty call and ignores a trailing comma', () => {
    const query = '{"now": now(), "c": coalesce(a, b,)}'
    const {calls} = readQueryFunctions(parseGroq(query), query)
    expect(calls.map((call) => call.argCount)).toEqual([0, 2])
  })
})

describe('checkFunctions', () => {
  it('accepts the four body forms and calls that are fine', () => {
    const query = `fn ex::bio($p) = $p{name, "posts": *[_type == "post" && references(^._id)]{title}};
fn ex::author($ref) = $ref->{name};
fn ex::tags($tags) = $tags[]{title};
fn ex::authors($refs) = $refs[]->{name, "bio": ex::bio(@)};
*[_type == "post" && defined(slug.current)]{
  "author": ex::author(author),
  "authors": ex::authors(authors),
  "tags": ex::tags(tags),
  "text": pt::text(body),
  "count": global::count(tags),
  "rounded": round(rating, 1),
  "size": select(count(tags) > 3 => "large", "small"),
  "releases": count(releases::all()),
} | score(boost(title match "groq", 2), text::semanticSimilarity("groq")) | order(_score desc)`
    expect(check(query)).toEqual([])
  })

  it('reports a body that is not one of the projections of the parameter', () => {
    expect(check('fn ex::f($p) = $p.name; *')).toEqual([
      {
        rule: 'body-shape',
        severity: 'error',
        message:
          'A function body projects its parameter: `$p{…}`, `$p->{…}`, `$p[]{…}` or `$p[]->{…}`',
        text: '$p.name',
      },
    ])
    expect(check('fn ex::f($p) = $p{name} + 1; *').map((finding) => finding.text)).toEqual([
      '$p{name} + 1',
    ])
    expect(check('fn ex::f($p) = $p[0]{name}; *').map((finding) => finding.rule)).toEqual([
      'body-shape',
    ])
  })

  it('reports a body that projects something other than the parameter', () => {
    expect(check('fn ex::f($p) = $q{name}; *')).toEqual([
      {
        rule: 'body-parameter',
        severity: 'error',
        message: '`$q` is not the parameter of this function, `$p`',
        text: '$q',
      },
    ])
  })

  it('reports the parameter used again in the body', () => {
    expect(check('fn ex::f($p) = $p{"x": $p.y, "ok": $other}; *')).toEqual([
      {
        rule: 'parameter-reuse',
        severity: 'error',
        message:
          'A function can use its parameter only once, at the start of the body: `$p` cannot be used here',
        text: '$p',
      },
    ])
  })

  it('reports `^` that reaches outside the body, counting the scopes the body opens', () => {
    expect(check('fn ex::f($p) = $p{"x": ^.title}; *').map((finding) => finding.rule)).toEqual([
      'parent-scope',
    ])
    expect(check('fn ex::f($p) = $p{"x": *[_id == ^._id][0]}; *')).toEqual([])
    expect(check('fn ex::f($p) = $p{"x": items[]{"t": ^.title}}; *')).toEqual([])
    expect(
      check('fn ex::f($p) = $p{"x": *[_id == ^.^._id]}; *').map((finding) => finding.rule),
    ).toEqual(['parent-scope'])
  })

  it('reports functions that call themselves, directly or through others', () => {
    expect(check('fn ex::r($p) = $p{"c": ex::r(child)}; *')).toEqual([
      {
        rule: 'recursion',
        severity: 'error',
        message: 'Custom functions cannot call themselves',
        text: 'ex::r',
      },
    ])
    expect(
      check('fn ex::a($p) = $p{"b": ex::b(x)}; fn ex::b($p) = $p{"a": ex::a(y)}; *').map(
        (finding) => finding.message,
      ),
    ).toEqual([
      'Calling `ex::b()` here leads back to `ex::a()`; custom functions cannot be recursive',
      'Calling `ex::a()` here leads back to `ex::b()`; custom functions cannot be recursive',
    ])
  })

  it('warns about a function declared twice and one that hides a built-in', () => {
    expect(check('fn ex::a($p) = $p{x}; fn ex::a($p) = $p{y}; fn pt::text($p) = $p{x}; *')).toEqual(
      [
        {
          rule: 'duplicate',
          severity: 'warning',
          message: '`ex::a` is declared more than once; only one of the declarations takes effect',
          text: 'ex::a',
        },
        {
          rule: 'shadows-builtin',
          severity: 'warning',
          message: 'This declaration hides the built-in `pt::text()`',
          text: 'pt::text',
        },
      ],
    )
  })

  it('warns about unknown functions, and points at the library when it has one', () => {
    const library = [{id: 'ex::author', declaration: 'fn ex::author($ref) = $ref->{name}'}]
    const query = '*{"a": foo(1), "b": bar::foo(1), "c": pt::foo(1), "d": ex::author(author)}'
    expect(check(query, library)).toEqual([
      {
        rule: 'unknown-function',
        severity: 'warning',
        message: 'Unknown function `foo()`',
        text: 'foo',
      },
      {
        rule: 'unknown-function',
        severity: 'warning',
        message: 'Unknown function `bar::foo()`',
        text: 'bar::foo',
      },
      {
        rule: 'unknown-function',
        severity: 'warning',
        message: 'Unknown function `pt::foo()`',
        text: 'pt::foo',
      },
      {
        rule: 'unknown-function',
        severity: 'warning',
        message: '`ex::author()` is not declared in this query; your functions library has it',
        text: 'ex::author',
      },
    ])
    expect(
      checkFunctions(parseGroq(query), query, library).find(
        (finding) => finding.libraryFunction !== undefined,
      )?.libraryFunction,
    ).toEqual(library[0])
    // Functions the API knows without the reference documenting them
    expect(check('*[anywhere("x")]{"s": string::lower(title)}')).toEqual([])
  })

  it('reports calls with the wrong number of arguments', () => {
    expect(
      check(
        'fn ex::a($p) = $p{x}; *{"a": ex::a(@, 1), "b": count(), "c": round(1, 2, 3), "d": now(1), "e": references()}',
      ).map((finding) => finding.message),
    ).toEqual([
      '`ex::a()` takes one argument, not 2',
      '`count()` takes one argument, not 0',
      '`round()` takes 1 or 2 arguments, not 3',
      '`now()` takes no arguments, not 1',
      '`references()` takes at least one argument, not 0',
    ])
  })

  it('warns about delta functions, pipe functions out of place and score-only functions', () => {
    expect(
      check(
        '*[delta::changedAny(title) && after().x > before().x]{"o": order(x), "b": boost(x, 2)} | count(x)',
      ).map((finding) => [finding.rule, finding.text]),
    ).toEqual([
      ['delta-only', 'delta::changedAny'],
      ['delta-only', 'after'],
      ['delta-only', 'before'],
      ['pipe', 'order'],
      ['score-only', 'boost'],
      ['pipe', 'count'],
    ])
  })

  it('checks the namespace and the parameters the editor grammar accepts', () => {
    expect(check('fn foo($p) = $p{x}; fn ex::two($a, $b) = $a{x}; *').map((it) => it.rule)).toEqual(
      ['namespace', 'parameters'],
    )
  })
})

describe('explainDeclarationSyntaxError', () => {
  it('explains the parse failures of declarations without a namespace or one parameter', () => {
    // The positions `groq-lint` reports for these
    const noNamespace = 'fn foo($p) = $p{name}; *'
    expect(explainDeclarationSyntaxError(parseGroq(noNamespace), noNamespace, 6)).toBe(
      'Custom functions need a namespace of their own: `fn my::foo(…)`',
    )
    const twoParameters = 'fn ex::f($a, $b) = $a{name}; *'
    expect(explainDeclarationSyntaxError(parseGroq(twoParameters), twoParameters, 11)).toBe(
      'A custom function takes exactly one parameter: `fn ns::name($param) = …`',
    )
    const noParameters = 'fn ex::f() = {"a": 1}; *'
    expect(explainDeclarationSyntaxError(parseGroq(noParameters), noParameters, 9)).toBe(
      'A custom function takes exactly one parameter: `fn ns::name($param) = …`',
    )
    const elsewhere = '*[_type == "a"'
    expect(explainDeclarationSyntaxError(parseGroq(elsewhere), elsewhere, 14)).toBeUndefined()
  })
})

describe('declarationInsertion', () => {
  it('adds a declaration after the last one, or at the start with a blank line before the query', () => {
    expect(declarationInsertion('*[_type == "post"]', 'fn ex::a($p) = $p{x}')).toEqual({
      from: 0,
      to: 0,
      insert: 'fn ex::a($p) = $p{x};\n\n',
    })
    const query = 'fn ex::a($p) = $p{x};\nfn ex::b($p) = $p{y};\n\n*'
    const insertion = declarationInsertion(query, 'fn ex::c($p) = $p{z}')
    expect(query.slice(0, insertion.from) + insertion.insert + query.slice(insertion.to)).toBe(
      'fn ex::a($p) = $p{x};\nfn ex::b($p) = $p{y};\nfn ex::c($p) = $p{z};\n\n*',
    )
  })
})

describe('extractFunction', () => {
  it('turns a bare projection entry into a declaration and a keyed call', () => {
    const query = '*[_type == "post"]{title, author->{name, "slug": slug.current}}'
    const extraction = extract(query, 'author->{name, "slug": slug.current}')
    expect(extraction?.declaration).toBe(
      'fn my::author($author) = $author->{name, "slug": slug.current}',
    )
    const result = applyExtraction(query, extraction!)
    expect(result).toBe(
      'fn my::author($author) = $author->{name, "slug": slug.current};\n\n*[_type == "post"]{title, "author": my::author(author)}',
    )
    expect(result.slice(extraction!.call.from, extraction!.call.to)).toBe(
      '"author": my::author(author)',
    )
    expect(check(result)).toEqual([])
  })

  it('extracts the value of a keyed entry, or of a whole pair, keeping the key', () => {
    const query = '*{"authors": authors[]->{name}, "tags": tags[]{title}}'
    const expected =
      'fn my::authors($authors) = $authors[]->{name};\n\n*{"authors": my::authors(authors), "tags": tags[]{title}}'
    expect(applyExtraction(query, extract(query, 'authors[]->{name}')!)).toBe(expected)
    expect(applyExtraction(query, extract(query, '"authors": authors[]->{name}')!)).toBe(expected)
    expect(extract(query, 'tags[]{title}')?.declaration).toBe('fn my::tags($tags) = $tags[]{title}')
  })

  it('names the function after the attribute, in the namespace the query uses, never taken', () => {
    const query =
      'fn ex::author($a) = $a->{name};\n\n*{"author": ex::author(author), "editor": editor->{name}, "a2": author->{bio}}'
    expect(extract(query, 'editor->{name}')?.declaration).toBe(
      'fn ex::editor($editor) = $editor->{name}',
    )
    const second = extract(query, 'author->{bio}')
    expect(second?.declaration).toBe('fn ex::author2($author) = $author->{bio}')
    expect(applyExtraction(query, second!)).toBe(
      'fn ex::author($a) = $a->{name};\nfn ex::author2($author) = $author->{bio};\n\n*{"author": ex::author(author), "editor": editor->{name}, "a2": ex::author2(author)}',
    )
    // The library's names are taken too, and its namespace is the next choice
    const library = [{id: 'lib::post', declaration: 'fn lib::post($p) = $p{title}'}]
    expect(extractFunction('*{post->{x}}', {from: 2, to: 11}, library)?.declaration).toBe(
      'fn lib::post2($post) = $post->{x}',
    )
  })

  it('picks another parameter name when the projection uses the attribute name as a parameter', () => {
    const query = '*{author->{name, "mine": _id == $author}}'
    expect(extract(query, 'author->{name, "mine": _id == $author}')?.declaration).toBe(
      'fn my::author($author2) = $author2->{name, "mine": _id == $author}',
    )
  })

  it('takes a projection of any expression, and lays out a multi-line one for the top level', () => {
    const query = '*[_type == "post"]{title}'
    expect(applyExtraction(query, extractFunction(query, {from: 0, to: query.length})!)).toBe(
      'fn my::projection($value) = $value{title};\n\nmy::projection(*[_type == "post"])',
    )

    const multiline = `*[_type == "post"]{
  title,
  author->{
    name,
    "slug": slug.current
  }
}`
    const extraction = extract(
      multiline,
      `author->{
    name,
    "slug": slug.current
  }`,
    )
    expect(extraction?.declaration).toBe(`fn my::author($author) = $author->{
  name,
  "slug": slug.current
}`)
  })

  it('ignores whitespace around the selection', () => {
    const query = '*{title,   author->{name}  }'
    const from = query.indexOf(',') + 1
    expect(extractFunction(query, {from, to: query.length - 1})?.declaration).toBe(
      'fn my::author($author) = $author->{name}',
    )
  })

  it('ignores the comma that separates the selected entry from the next or the previous one', () => {
    const query = '*{title, author->{name}, slug}'
    expect(extract(query, 'author->{name},')?.expression).toBe('author->{name}')
    expect(extract(query, ', author->{name}')?.expression).toBe('author->{name}')
  })

  it('takes the innermost projection around the cursor when nothing is selected', () => {
    const query =
      '*[_type == "post"]{title, "author": author->{name, "image": image{asset->{url}}}}'
    const atCursor = (text: string, offset = 1) => {
      const position = query.indexOf(text) + offset
      return extractFunction(query, {from: position, to: position})
    }
    const author = 'author->{name, "image": image{asset->{url}}}'
    expect(atCursor('name')?.expression).toBe(author)
    expect(atCursor('url')?.expression).toBe('asset->{url}')
    // On the key of the pair, and on the attribute the projection starts from
    expect(atCursor('"author"')?.expression).toBe(author)
    expect(atCursor('author->', 2)?.expression).toBe(author)
    // Right after the closing brace
    expect(atCursor('{url}', 5)?.expression).toBe('asset->{url}')
    // The query's own projection is only extracted when it is selected
    expect(atCursor('title')).toBeNull()
    expect(extractFunction('*[_type == "post"]{title}', {from: 0, to: 0})).toBeNull()
  })

  it('refuses selections that cannot become a function', () => {
    const cases: [string, string][] = [
      // Nothing projected
      ['*{author->name}', 'author->name'],
      ['*{author->{name}}', '{name}'],
      // Part of a longer chain, or of a larger expression
      ['*{a.b->{x}}', 'b->{x}'],
      ['*{"a": authors[]->{name}[0]}', 'authors[]->{name}'],
      ['*{"a": x + author->{name}}', 'x + author->{name}'],
      // `^` would reach outside the function
      ['*{author->{"x": ^.title}}', 'author->{"x": ^.title}'],
      // Already in a function
      ['fn ex::a($p) = $p{"b": b->{x}}; *', 'b->{x}'],
      // Not the whole of something
      ['*{author->{name}}', 'thor->{name}'],
    ]
    for (const [query, selected] of cases) {
      expect(extract(query, selected), `${selected} in ${query}`).toBeNull()
    }
    expect(extractFunction('*{author->{name}', {from: 2, to: 16})).toBeNull()
    // Only whitespace selected
    expect(extractFunction('*{ author->{name}}', {from: 2, to: 3})).toBeNull()
  })
})

describe('isSameDeclaration', () => {
  it('ignores the layout but not the strings', () => {
    expect(
      isSameDeclaration(
        'fn ex::a($p) = $p->{name, "s": slug}',
        'fn ex::a($p) = $p-> {\n  name,\n  "s": slug\n}',
      ),
    ).toBe(true)
    expect(isSameDeclaration('fn ex::a($p) = $p{"a b": x}', 'fn ex::a($p) = $p{"ab": x}')).toBe(
      false,
    )
    expect(isSameDeclaration('fn ex::a($p) = $p{x}', 'fn ex::a($p) = $p{y}')).toBe(false)
  })
})

describe('parseDeclaration', () => {
  it('reads a whole declaration and nothing else', () => {
    expect(parseDeclaration('fn ex::a($p) = $p[]->{name}')).toMatchObject({
      id: 'ex::a',
      text: 'fn ex::a($p) = $p[]->{name}',
    })
    expect(parseDeclaration('fn ex::a($p) = $p{x}; *')).toBeNull()
    expect(parseDeclaration('*[_type == "post"]')).toBeNull()
    expect(parseDeclaration('fn ex::a($p) = ')).toBeNull()
  })
})
