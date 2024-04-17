export type ParseError<T extends string = 'unknown'> = T & {error: true}

export type SplitAll<
  S extends string,
  Char extends string,
> = S extends `${infer First}${Char}${infer Remainder}`
  ? [First, ...SplitAll<Remainder, Char>]
  : [S]

export type Split<
  S extends string,
  Char extends string,
  IncludeSeparator extends boolean = false,
> = S extends `${infer First}${Char}${infer Remainder}`
  ? [First, `${IncludeSeparator extends true ? Char : ''}${Remainder}`]
  : [S]

export type TrimLeft<
  Str extends string,
  Char extends string = ' ',
> = string extends Str
  ? Str
  : Str extends `${Char}${infer Trimmed}`
    ? TrimLeft<Trimmed, Char>
    : Str

export type TrimRight<
  Str extends string,
  Char extends string = ' ',
> = string extends Str
  ? Str
  : Str extends `${infer Trimmed}${Char}`
    ? TrimRight<Trimmed, Char>
    : Str

export type Trim<S extends string, Char extends string = ' '> = TrimRight<
  TrimLeft<S, Char>,
  Char
>

export type ParseKVPair<S extends string> =
  Split<S, '=='> extends [`${infer LHS}`, `${infer RHS}`]
    ? ParseValue<Trim<RHS>> extends infer Res
      ? Res extends [null, infer Value]
        ? Ok<{[P in Trim<LHS>]: Value}>
        : Err<
            ParseError<`Can't parse right hand side as a value in "${S}" (Invalid value ${RHS})`>
          >
      : never
    : Err<ParseError<`Can't parse key value pair from ${S}`>>

export type ParseObject<S extends string> =
  S extends `${infer Pair},${infer Remainder}`
    ? Trim<Remainder> extends ''
      ? Ok<Record<never, never>>
      : MergeInner<ParseKVPair<Pair>, ParseObject<Remainder>>
    : ParseKVPair<S>

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

export type OnlyDigits<S> = S extends `${infer Head}${infer Tail}`
  ? Head extends Digit
    ? Tail extends ''
      ? true
      : OnlyDigits<Tail> extends true
        ? true
        : false
    : false
  : false

export type ParseNumber<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Head extends '-'
      ? OnlyDigits<Tail> extends true
        ? Ok<ToNumber<S>>
        : Err<ParseError<`Invalid integer value "${S}"`>>
      : OnlyDigits<S> extends true
        ? Ok<ToNumber<S>>
        : Err<ParseError<`Invalid integer value "${S}"`>>
    : Err<ParseError<`Invalid integer value "${S}"`>>

export type ToNumber<T extends string> = T extends `${infer N extends number}`
  ? N
  : never

export type ParseValue<S extends string> = string extends S
  ? Err<ParseError<'ParseValue got generic string type'>>
  : S extends 'null'
    ? Ok<null>
    : S extends 'true'
      ? Ok<true>
      : S extends 'false'
        ? Ok<false>
        : S extends `"${infer Value}"`
          ? Ok<Value>
          : Try<
              ParseNumber<S>,
              Err<
                ParseError<`ParseValue failed. Can't parse "${S}" as a value.`>
              >
            >

export type Result<E, V> = [E, V]
export type Err<E> = Result<E, null>
export type Ok<V> = Result<null, V>

export type Try<R extends Result<any, any>, Handled> = R[1] extends null
  ? Handled
  : R

export type Concat<
  R extends Result<any, any>,
  Arr extends any[],
> = R[1] extends any[] ? Ok<[...R[1], ...Arr]> : R

export type ConcatInner<
  R extends Result<any, any>,
  R2 extends Result<any, any>,
> = R2[1] extends any[] ? Concat<R, R2[1]> : R2

export type Merge<R extends Result<any, any>, E> = R[0] extends null
  ? Ok<R[1] & E>
  : R

export type MergeInner<
  R extends Result<any, any>,
  R2 extends Result<any, any>,
> = R2[0] extends null ? Merge<R, R2[1]> : R

export type ToArray<R extends Result<any, any>> = R extends [infer E, infer V]
  ? E extends null
    ? V extends any[]
      ? R
      : Ok<[R[1]]>
    : R
  : R

export type ParseInnerExpression<S extends string> = S extends ''
  ? Err<ParseError<'Saw an empty expression'>>
  : Try<ParseNumber<S>, ParseObject<S>>

export type ParseExpressions<S extends string> =
  S extends `[${infer Expr}]${infer Remainder}`
    ? Trim<Remainder> extends ''
      ? ToArray<ParseInnerExpression<Trim<Expr>>>
      : ConcatInner<
          ToArray<ParseInnerExpression<Trim<Expr>>>,
          ParseExpressions<Remainder>
        >
    : Err<ParseError<`Cannot parse object from "${S}"`>>

export type ParseProperty<S extends string> =
  Trim<S> extends ''
    ? Err<ParseError<'Empty property'>>
    : Split<Trim<S>, '[', true> extends [`${infer Prop}`, `${infer Expression}`]
      ? Trim<Prop> extends ''
        ? ParseExpressions<Trim<Expression>>
        : ConcatInner<Ok<[Trim<Prop>]>, ParseExpressions<Trim<Expression>>>
      : Ok<[Trim<S>]>

export type ParseAllProps<Props extends string[]> = Props extends [
  `${infer Head}`,
  ...infer Tail,
]
  ? Tail extends string[]
    ? ConcatInner<ParseProperty<Trim<Head>>, ParseAllProps<Tail>>
    : ParseProperty<Trim<Head>>
  : Ok<[]>

export type Unwrap<R extends Result<any, any>> = R extends [infer E, infer V]
  ? E extends null
    ? V
    : E
  : never

export type StringToPath<S extends string> = Unwrap<
  ParseAllProps<SplitAll<Trim<S>, '.'>>
>

type ExcludeError<S extends StringToPath<string> | ParseError<string>> =
  S extends ParseError<string> ? never : S

export type SafePath<S extends string> = ExcludeError<StringToPath<S>>
