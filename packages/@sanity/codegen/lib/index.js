import fs$1, { readFile } from "node:fs/promises";
import json5 from "json5";
import * as z from "zod";
import { parse } from "groq-js";
import createDebug from "debug";
import glob from "globby";
import fs, { existsSync } from "node:fs";
import path, { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { parse as parse$1, traverse } from "@babel/core";
import * as t from "@babel/types";
import { Scope } from "@babel/traverse";
import { loadConfig, createMatchPath } from "tsconfig-paths";
import register from "@babel/register";
import { CodeGenerator } from "@babel/generator";
const configDefinition = z.object({
  path: z.string().or(z.array(z.string())).default([
    "./src/**/*.{ts,tsx,js,jsx,mjs,cjs,astro}",
    "./app/**/*.{ts,tsx,js,jsx,mjs,cjs}",
    "./sanity/**/*.{ts,tsx,js,jsx,mjs,cjs}"
  ]),
  schema: z.string().default("./schema.json"),
  generates: z.string().default("./sanity.types.ts"),
  formatGeneratedCode: z.boolean().default(!0),
  overloadClientMethods: z.boolean().default(!0)
});
async function readConfig(path2) {
  try {
    const content = await readFile(path2, "utf-8"), json = json5.parse(content);
    return configDefinition.parseAsync(json);
  } catch (error) {
    if (error instanceof z.ZodError)
      throw new Error(
        `Error in config file
 ${error.errors.map((err) => err.message).join(`
`)}`,
        { cause: error }
      );
    if (typeof error == "object" && error !== null && "code" in error && error.code === "ENOENT")
      return configDefinition.parse({});
    throw error;
  }
}
async function readSchema(path2) {
  const content = await readFile(path2, "utf-8");
  return JSON.parse(content);
}
function safeParseQuery(query) {
  const params = {};
  for (const param of extractSliceParams(query))
    params[param] = 0;
  return parse(query, { params });
}
function* extractSliceParams(query) {
  const sliceRegex = /\[(\$(\w+)|\d)\.\.\.?(\$(\w+)|\d)\]/g, matches = query.matchAll(sliceRegex);
  if (matches)
    for (const match of matches) {
      const start = match[1] === `$${match[2]}` ? match[2] : null;
      start !== null && (yield start);
      const end = match[3] === `$${match[4]}` ? match[4] : null;
      end !== null && (yield end);
    }
}
const __dirname$1 = dirname(fileURLToPath(import.meta.url));
function findBabelConfig(path2) {
  const configPath = join(path2, "babel.config.json");
  if (existsSync(configPath))
    return configPath;
  const parent = resolve(join(path2, ".."));
  if (parent && parent !== path2)
    return findBabelConfig(parent);
  throw new Error("Could not find `babel.config.json` in @sanity/codegen");
}
function getBabelConfig(path2) {
  return { extends: findBabelConfig(__dirname$1) };
}
function parseSourceFile(_source, _filename, babelOptions) {
  let source = _source, filename = _filename;
  filename.endsWith(".astro") ? (filename += ".ts", source = parseAstro(source)) : filename.endsWith(".vue") && (filename += ".ts", source = parseVue(source));
  const result = parse$1(source, {
    ...babelOptions,
    filename
  });
  if (!result)
    throw new Error(`Failed to parse ${filename}`);
  return result;
}
function parseAstro(source) {
  const codeFences = source.match(/---\n([\s\S]*?)\n---/g);
  return codeFences ? codeFences.map((codeFence) => codeFence.split(`
`).slice(1, -1).join(`
`)).join(`
`) : "";
}
function parseVue(source) {
  const matches = matchAllPolyfill(source, /<script(?:\s+generic=["'][^"']*["'])?[^>]*>([\s\S]*?)<\/script>/g);
  return matches.length ? matches.map((match) => match[1]).join(`
`) : "";
}
function matchAllPolyfill(str, regex) {
  if (!regex.global)
    throw new Error("matchAll polyfill requires a global regex (with /g flag)");
  const matches = [];
  let match;
  for (; (match = regex.exec(str)) !== null; )
    matches.push(match);
  return matches;
}
const debug$2 = createDebug("sanity:codegen:findQueries:debug"), TAGGED_TEMPLATE_ALLOW_LIST = ["groq"], FUNCTION_WRAPPER_ALLOW_LIST = ["defineQuery"];
function resolveExpression({
  node,
  file,
  scope,
  filename,
  resolver,
  babelConfig,
  params = [],
  fnArguments = []
}) {
  if (debug$2(
    `Resolving node ${node.type} in ${filename}:${node.loc?.start.line}:${node.loc?.start.column}`
  ), t.isTaggedTemplateExpression(node) && t.isIdentifier(node.tag) && TAGGED_TEMPLATE_ALLOW_LIST.includes(node.tag.name))
    return resolveExpression({
      node: node.quasi,
      scope,
      filename,
      file,
      resolver,
      params,
      babelConfig,
      fnArguments
    });
  if (t.isTemplateLiteral(node)) {
    const resolvedExpressions = node.expressions.map(
      (expression) => resolveExpression({
        node: expression,
        scope,
        filename,
        file,
        resolver,
        params,
        babelConfig,
        fnArguments
      })
    );
    return node.quasis.map((quasi, idx) => (quasi.value.cooked || "") + (resolvedExpressions[idx] || "")).join("");
  }
  if (t.isLiteral(node)) {
    if (node.type === "NullLiteral" || node.type === "RegExpLiteral")
      throw new Error(`Unsupported literal type: ${node.type}`);
    return node.value.toString();
  }
  if (t.isIdentifier(node))
    return resolveIdentifier({
      node,
      scope,
      filename,
      file,
      resolver,
      fnArguments,
      babelConfig,
      params
    });
  if (t.isVariableDeclarator(node)) {
    const init = node.init ?? (t.isAssignmentPattern(node.id) && node.id.right);
    if (!init)
      throw new Error("Unsupported variable declarator");
    return resolveExpression({
      node: init,
      fnArguments,
      scope,
      filename,
      file,
      babelConfig,
      resolver
    });
  }
  if (t.isCallExpression(node) && t.isIdentifier(node.callee) && FUNCTION_WRAPPER_ALLOW_LIST.includes(node.callee.name))
    return resolveExpression({
      node: node.arguments[0],
      scope,
      filename,
      file,
      resolver,
      babelConfig,
      params
    });
  if (t.isCallExpression(node))
    return resolveCallExpression({
      node,
      scope,
      filename,
      file,
      resolver,
      babelConfig,
      params
    });
  if (t.isArrowFunctionExpression(node) || t.isFunctionDeclaration(node) || t.isFunctionExpression(node)) {
    const newScope = new Scope(scope.path, scope);
    return params.forEach((param, i) => {
      newScope.push({
        id: param,
        init: fnArguments[i]
      });
    }), resolveExpression({
      node: node.body,
      params: node.params,
      fnArguments,
      scope: newScope,
      filename,
      file,
      babelConfig,
      resolver
    });
  }
  if (t.isNewExpression(node))
    return resolveExpression({
      node: node.callee,
      scope,
      filename,
      file,
      babelConfig,
      resolver
    });
  if (t.isImportDefaultSpecifier(node) || t.isImportSpecifier(node))
    return resolveImportSpecifier({ node, file, filename, fnArguments, resolver, babelConfig });
  if (t.isAssignmentPattern(node))
    return resolveExpression({
      node: node.right,
      scope,
      filename,
      file,
      resolver,
      params,
      babelConfig,
      fnArguments
    });
  if (t.isTSAsExpression(node))
    return resolveExpression({
      node: node.expression,
      scope,
      filename,
      file,
      resolver,
      params,
      babelConfig,
      fnArguments
    });
  throw new Error(
    `Unsupported expression type: ${node.type} in ${filename}:${node.loc?.start.line}:${node.loc?.start.column}`
  );
}
function resolveIdentifier({
  node,
  scope,
  filename,
  file,
  resolver,
  babelConfig,
  fnArguments,
  params
}) {
  const paramIndex = params.findIndex(
    (param) => t.isIdentifier(param) && node.name === param.name || t.isAssignmentPattern(param) && t.isIdentifier(param.left) && node.name === param.left.name
  );
  let argument = fnArguments[paramIndex];
  if (!argument && paramIndex >= 0 && t.isAssignmentPattern(params[paramIndex]) && (argument = params[paramIndex].right), argument && t.isLiteral(argument))
    return resolveExpression({
      node: argument,
      scope,
      filename,
      file,
      resolver,
      params,
      babelConfig,
      fnArguments
    });
  const binding = scope.getBinding(node.name);
  if (binding) {
    if (t.isIdentifier(binding.path.node) && binding.path.node.name === node.name)
      throw new Error(
        `Could not resolve same identifier "${node.name}" in "${filename}:${node.loc?.start.line}:${node.loc?.start.column}"`
      );
    return resolveExpression({
      node: binding.path.node,
      params,
      fnArguments,
      scope,
      filename,
      babelConfig,
      file,
      resolver
    });
  }
  throw new Error(
    `Could not find binding for node "${node.name}" in ${filename}:${node.loc?.start.line}:${node.loc?.start.column}`
  );
}
function resolveCallExpression({
  node,
  scope,
  filename,
  file,
  resolver,
  babelConfig,
  params
}) {
  const { callee } = node;
  return resolveExpression({
    node: callee,
    scope,
    filename,
    file,
    resolver,
    babelConfig,
    params,
    fnArguments: node.arguments
  });
}
function resolveImportSpecifier({
  node,
  file,
  filename,
  fnArguments,
  resolver,
  babelConfig
}) {
  let importDeclaration;
  if (traverse(file, {
    ImportDeclaration(n) {
      if (t.isImportDeclaration(n.node))
        for (const specifier of n.node.specifiers) {
          if (t.isImportDefaultSpecifier(specifier) && specifier.local.loc?.identifierName === node.local.name) {
            importDeclaration = n.node;
            break;
          }
          specifier.local.name === node.local.name && (importDeclaration = n.node);
        }
    }
  }), !importDeclaration)
    throw new Error(`Could not find import declaration for ${node.local.name}`);
  const importName = node.local.name, importFileName = importDeclaration.source.value, importPath = importFileName.startsWith("./") || importFileName.startsWith("../") ? path.resolve(path.dirname(filename), importFileName) : importFileName, resolvedFile = resolver(importPath), source = fs.readFileSync(resolvedFile), tree = parseSourceFile(source.toString(), resolvedFile, babelConfig);
  let newScope;
  if (traverse(tree, {
    Program(p) {
      newScope = p.scope;
    }
  }), !newScope)
    throw new Error(`Could not find scope for ${filename}`);
  const binding = newScope.getBinding(importName);
  if (binding)
    return resolveExpression({
      node: binding.path.node,
      file: tree,
      scope: newScope,
      fnArguments,
      babelConfig,
      filename: resolvedFile,
      resolver
    });
  let namedExport, newImportName;
  if (traverse(tree, {
    ExportDeclaration(p) {
      if (p.node.type === "ExportNamedDeclaration")
        for (const specifier of p.node.specifiers)
          specifier.type === "ExportSpecifier" && specifier.exported.type === "Identifier" && specifier.exported.name === importName && (namedExport = p.node, newImportName = specifier.exported.name);
    }
  }), namedExport && newImportName)
    return resolveExportSpecifier({
      node: namedExport,
      importName: newImportName,
      filename: resolvedFile,
      fnArguments,
      resolver,
      babelConfig
    });
  let result;
  if (traverse(tree, {
    ExportDeclaration(p) {
      if (p.node.type === "ExportAllDeclaration")
        try {
          result = resolveExportSpecifier({
            node: p.node,
            importName,
            filename: resolvedFile,
            fnArguments,
            resolver,
            babelConfig
          });
        } catch (e) {
          if (e.cause !== `noBinding:${importName}`) throw e;
        }
    }
  }), result) return result;
  throw new Error(`Could not find binding for import "${importName}" in ${importFileName}`);
}
function resolveExportSpecifier({
  node,
  importName,
  filename,
  fnArguments,
  babelConfig,
  resolver
}) {
  if (!node.source)
    throw new Error(`Could not find source for export "${importName}" in ${filename}`);
  const importFileName = node.source.value, importPath = path.resolve(path.dirname(filename), importFileName), resolvedFile = resolver(importPath), source = fs.readFileSync(resolvedFile), tree = parseSourceFile(source.toString(), resolvedFile, babelConfig);
  let newScope;
  if (traverse(tree, {
    Program(p) {
      newScope = p.scope;
    }
  }), !newScope)
    throw new Error(`Could not find scope for ${filename}`);
  const binding = newScope.getBinding(importName);
  if (binding)
    return resolveExpression({
      node: binding.path.node,
      file: tree,
      scope: newScope,
      filename: resolvedFile,
      babelConfig,
      resolver,
      fnArguments
    });
  throw new Error(`Could not find binding for export "${importName}" in ${importFileName}`, {
    cause: `noBinding:${importName}`
  });
}
const require$2 = createRequire(import.meta.url), groqTagName = "groq", defineQueryFunctionName = "defineQuery", groqModuleName = "groq", nextSanityModuleName = "next-sanity", ignoreValue = "@sanity-typegen-ignore";
function findQueriesInSource(source, filename, babelConfig = getBabelConfig(), resolver = require$2.resolve) {
  const queries = [], file = parseSourceFile(source, filename, babelConfig);
  return traverse(file, {
    // Look for variable declarations, e.g. `const myQuery = groq`... and extract the query.
    // The variable name is used as the name of the query result type
    VariableDeclarator(path2) {
      const { node, scope } = path2, init = node.init, isGroqTemplateTag = t.isTaggedTemplateExpression(init) && t.isIdentifier(init.tag) && init.tag.name === groqTagName, isDefineQueryCall = t.isCallExpression(init) && (isImportFrom(groqModuleName, defineQueryFunctionName, scope, init.callee) || isImportFrom(nextSanityModuleName, defineQueryFunctionName, scope, init.callee));
      if (t.isIdentifier(node.id) && (isGroqTemplateTag || isDefineQueryCall)) {
        if (declarationLeadingCommentContains(path2, ignoreValue))
          return;
        const queryName = `${node.id.name}`, queryResult = resolveExpression({
          node: init,
          file,
          scope,
          babelConfig,
          filename,
          resolver
        }), location = node.loc ? {
          start: {
            ...node.loc?.start
          },
          end: {
            ...node.loc?.end
          }
        } : {};
        queries.push({ name: queryName, result: queryResult, location });
      }
    }
  }), queries;
}
function declarationLeadingCommentContains(path2, comment) {
  const variableDeclaration = path2.find((node) => node.isVariableDeclaration());
  return variableDeclaration ? !!(variableDeclaration.node.leadingComments?.find(
    (commentItem) => commentItem.value.trim() === comment
  ) || variableDeclaration.parent.leadingComments?.find(
    (commentItem) => commentItem.value.trim() === comment
  )) : !1;
}
function isImportFrom(moduleName, importName, scope, node) {
  if (t.isIdentifier(node)) {
    const binding = scope.getBinding(node.name);
    if (!binding)
      return !1;
    const { path: path2 } = binding;
    if (t.isImportSpecifier(path2.node))
      return path2.node.importKind === "value" && path2.parentPath && t.isImportDeclaration(path2.parentPath.node) && path2.parentPath.node.source.value === moduleName && t.isIdentifier(path2.node.imported) && path2.node.imported.name === importName;
    if (t.isVariableDeclarator(path2.node)) {
      const { init } = path2.node;
      return t.isCallExpression(init) && t.isIdentifier(init.callee) && init.callee.name === "require" && t.isStringLiteral(init.arguments[0]) && init.arguments[0].value === moduleName;
    }
  }
  if (t.isMemberExpression(node)) {
    const { object, property } = node;
    if (!t.isIdentifier(object))
      return !1;
    const binding = scope.getBinding(object.name);
    if (!binding)
      return !1;
    const { path: path2 } = binding;
    return t.isIdentifier(object) && t.isIdentifier(property) && property.name === importName && t.isImportNamespaceSpecifier(path2.node) && path2.parentPath && t.isImportDeclaration(path2.parentPath.node) && path2.parentPath.node.source.value === moduleName;
  }
  return !1;
}
const require$1 = createRequire(import.meta.url), debug$1 = createDebug("sanity:codegen:moduleResolver");
function getResolver(cwd) {
  const tsConfig = loadConfig(cwd);
  if (tsConfig.resultType === "failed")
    return debug$1("Could not load tsconfig, using default resolver: %s", tsConfig.message), require$1.resolve;
  const matchPath = createMatchPath(
    tsConfig.absoluteBaseUrl,
    tsConfig.paths,
    tsConfig.mainFields,
    tsConfig.addMatchAll
  ), resolve2 = function(request, options) {
    const found = matchPath(request);
    return found !== void 0 ? require$1.resolve(found, options) : require$1.resolve(request, options);
  };
  return resolve2.paths = (request) => require$1.resolve.paths(request), resolve2;
}
const debug = createDebug("sanity:codegen:findQueries:debug");
async function* findQueriesInPath({
  path: path2,
  babelOptions = getBabelConfig(),
  resolver = getResolver()
}) {
  const queryNames = /* @__PURE__ */ new Set();
  debug(`Globing ${path2}`);
  const files = glob.sync(path2, {
    absolute: !1,
    ignore: ["**/node_modules/**"],
    // we never want to look in node_modules
    onlyFiles: !0
  }).sort();
  for (const filename of files)
    if (typeof filename == "string") {
      debug(`Found file "${filename}"`);
      try {
        const source = await fs$1.readFile(filename, "utf8"), queries = findQueriesInSource(source, filename, babelOptions, resolver);
        for (const query of queries) {
          if (queryNames.has(query.name))
            throw new Error(
              `Duplicate query name found: "${query.name}". Query names must be unique across all files.`
            );
          queryNames.add(query.name);
        }
        yield { type: "queries", filename, queries };
      } catch (error) {
        debug(`Error in file "${filename}"`, error), yield { type: "error", error, filename };
      }
    }
}
function registerBabel(babelOptions) {
  const options = babelOptions || getBabelConfig();
  register({ ...options, extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"] });
}
const REFERENCE_SYMBOL_NAME = "internalGroqTypeReferenceTo", ALL_SCHEMA_TYPES = "AllSanitySchemaTypes";
class TypeGenerator {
  // Simple set to keep track of generated type names, to avoid conflicts
  generatedTypeName = /* @__PURE__ */ new Set();
  // Map between type names and their generated type names, used to resolve the correct generated type name
  typeNameMap = /* @__PURE__ */ new Map();
  // Map between type nodes and their generated type names, used for query mapping
  typeNodeNameMap = /* @__PURE__ */ new Map();
  schema;
  constructor(schema) {
    this.schema = schema, this.schema.forEach((s) => {
      this.getTypeName(s.name, s);
    });
  }
  /**
   * Generate TypeScript types for the given schema
   * @returns string
   * @internal
   * @beta
   */
  generateSchemaTypes() {
    const typeDeclarations = [], schemaNames = /* @__PURE__ */ new Set();
    return this.schema.forEach((schema) => {
      const typeLiteral = this.getTypeNodeType(schema), schemaName = this.typeNodeNameMap.get(schema);
      if (!schemaName)
        throw new Error(`Schema name not found for schema ${schema.name}`);
      schemaNames.add(schemaName);
      const typeAlias = t.tsTypeAliasDeclaration(t.identifier(schemaName), null, typeLiteral);
      typeDeclarations.push(t.exportNamedDeclaration(typeAlias));
    }), typeDeclarations.push(
      t.exportNamedDeclaration(
        t.tsTypeAliasDeclaration(
          t.identifier(this.getTypeName(ALL_SCHEMA_TYPES)),
          null,
          t.tsUnionType(
            [...schemaNames].map((typeName) => t.tsTypeReference(t.identifier(typeName)))
          )
        )
      )
    ), typeDeclarations.map((decl) => new CodeGenerator(decl).generate().code).join(`

`);
  }
  /**
   * Takes a identifier and a type node and generates a type alias for the type node.
   * @param identifierName - The name of the type to generated
   * @param typeNode - The type node to generate the type for
   * @returns
   * @internal
   * @beta
   */
  generateTypeNodeTypes(identifierName, typeNode) {
    const type = this.getTypeNodeType(typeNode), typeName = this.getTypeName(identifierName, typeNode), typeAlias = t.tsTypeAliasDeclaration(t.identifier(typeName), null, type);
    return new CodeGenerator(t.exportNamedDeclaration(typeAlias)).generate().code.trim();
  }
  static generateKnownTypes() {
    const typeOperator = t.tsTypeOperator(t.tsSymbolKeyword(), "unique"), identifier = t.identifier(REFERENCE_SYMBOL_NAME);
    identifier.typeAnnotation = t.tsTypeAnnotation(typeOperator);
    const decleration = t.variableDeclaration("const", [t.variableDeclarator(identifier)]);
    return decleration.declare = !0, new CodeGenerator(t.exportNamedDeclaration(decleration)).generate().code.trim();
  }
  /**
   * Takes a list of queries from the codebase and generates a type declaration
   * for SanityClient to consume.
   *
   * Note: only types that have previously been generated with `generateTypeNodeTypes`
   * will be included in the query map.
   *
   * @param queries - A list of queries to generate a type declaration for
   * @returns
   * @internal
   * @beta
   */
  generateQueryMap(queries) {
    const typesByQuerystring = {};
    for (const query of queries) {
      const name = this.typeNodeNameMap.get(query.typeNode);
      name && (typesByQuerystring[query.query] ??= [], typesByQuerystring[query.query].push(name));
    }
    const queryReturnInterface = t.tsInterfaceDeclaration(
      t.identifier("SanityQueries"),
      null,
      [],
      t.tsInterfaceBody(
        Object.entries(typesByQuerystring).map(([query, types]) => t.tsPropertySignature(
          t.stringLiteral(query),
          t.tsTypeAnnotation(
            t.tsUnionType(types.map((type) => t.tsTypeReference(t.identifier(type))))
          )
        ))
      )
    ), declareModule = t.declareModule(
      t.stringLiteral("@sanity/client"),
      t.blockStatement([queryReturnInterface])
    ), clientImport = t.importDeclaration([], t.stringLiteral("@sanity/client"));
    return new CodeGenerator(t.program([clientImport, declareModule])).generate().code.trim();
  }
  /**
   * Since we are sanitizing identifiers we migt end up with collisions. Ie there might be a type mux.video and muxVideo, both these
   * types would be sanityized into MuxVideo. To avoid this we keep track of the generated type names and add a index to the name.
   * When we reference a type we also keep track of the original name so we can reference the correct type later.
   */
  getTypeName(name, typeNode) {
    const desiredName = uppercaseFirstLetter(sanitizeIdentifier(name));
    let generatedName = desiredName, i = 2;
    for (; this.generatedTypeName.has(generatedName); )
      generatedName = `${desiredName}_${i++}`;
    return this.generatedTypeName.add(generatedName), this.typeNameMap.set(name, generatedName), typeNode && this.typeNodeNameMap.set(typeNode, generatedName), generatedName;
  }
  getTypeNodeType(typeNode) {
    switch (typeNode.type) {
      case "string":
        return typeNode.value !== void 0 ? t.tsLiteralType(t.stringLiteral(typeNode.value)) : t.tsStringKeyword();
      case "number":
        return typeNode.value !== void 0 ? t.tsLiteralType(t.numericLiteral(typeNode.value)) : t.tsNumberKeyword();
      case "boolean":
        return typeNode.value !== void 0 ? t.tsLiteralType(t.booleanLiteral(typeNode.value)) : t.tsBooleanKeyword();
      case "unknown":
        return t.tsUnknownKeyword();
      case "document":
        return this.generateDocumentType(typeNode);
      case "type":
        return this.getTypeNodeType(typeNode.value);
      case "array":
        return this.generateArrayTsType(typeNode);
      case "object":
        return this.generateObjectTsType(typeNode);
      case "union":
        return this.generateUnionTsType(typeNode);
      case "inline":
        return this.generateInlineTsType(typeNode);
      case "null":
        return t.tsNullKeyword();
      default:
        throw new Error(`Type "${typeNode.type}" not found in schema`);
    }
  }
  // Helper function used to generate TS types for array type nodes.
  generateArrayTsType(typeNode) {
    const typeNodes = this.getTypeNodeType(typeNode.of);
    return t.tsTypeReference(
      t.identifier("Array"),
      t.tsTypeParameterInstantiation([typeNodes])
    );
  }
  // Helper function used to generate TS types for object properties.
  generateObjectProperty(key, attribute) {
    const type = this.getTypeNodeType(attribute.value), propertySignature = t.tsPropertySignature(
      t.identifier(sanitizeIdentifier(key)),
      t.tsTypeAnnotation(type)
    );
    return propertySignature.optional = attribute.optional, propertySignature;
  }
  // Helper function used to generate TS types for object type nodes.
  generateObjectTsType(typeNode) {
    const props = [];
    Object.entries(typeNode.attributes).forEach(([key, attribute]) => {
      props.push(this.generateObjectProperty(key, attribute));
    });
    const rest = typeNode.rest;
    if (rest !== void 0)
      switch (rest.type) {
        case "unknown":
          return t.tsUnknownKeyword();
        case "object": {
          Object.entries(rest.attributes).forEach(([key, attribute]) => {
            props.push(this.generateObjectProperty(key, attribute));
          });
          break;
        }
        case "inline": {
          const resolved = this.generateInlineTsType(rest);
          return t.isTSUnknownKeyword(resolved) ? resolved : t.tsIntersectionType([t.tsTypeLiteral(props), resolved]);
        }
        default:
          throw new Error(`Type "${rest.type}" not found in schema`);
      }
    if (typeNode.dereferencesTo !== void 0) {
      const derefType = t.tsPropertySignature(
        t.identifier(REFERENCE_SYMBOL_NAME),
        t.tsTypeAnnotation(t.tsLiteralType(t.stringLiteral(typeNode.dereferencesTo)))
      );
      derefType.computed = !0, derefType.optional = !0, props.push(derefType);
    }
    return t.tsTypeLiteral(props);
  }
  generateInlineTsType(typeNode) {
    const referencedTypeNode = this.schema.find((schema) => schema.name === typeNode.name);
    if (referencedTypeNode === void 0) {
      const generatedName2 = this.typeNameMap.get(typeNode.name);
      if (generatedName2)
        return t.tsTypeReference(t.identifier(generatedName2));
      const missing = t.tsUnknownKeyword();
      return missing.trailingComments = [
        {
          type: "CommentLine",
          value: ` Unable to locate the referenced type "${typeNode.name}" in schema`
        }
      ], missing;
    }
    const generatedName = this.typeNameMap.get(referencedTypeNode.name);
    return generatedName ? t.tsTypeReference(t.identifier(generatedName)) : t.tsUnknownKeyword();
  }
  // Helper function used to generate TS types for union type nodes.
  generateUnionTsType(typeNode) {
    if (typeNode.of.length === 0)
      return t.tsNeverKeyword();
    if (typeNode.of.length === 1)
      return this.getTypeNodeType(typeNode.of[0]);
    const typeNodes = typeNode.of.map((node) => this.getTypeNodeType(node));
    return t.tsUnionType(typeNodes);
  }
  // Helper function used to generate TS types for document type nodes.
  generateDocumentType(document) {
    const props = Object.entries(document.attributes).map(
      ([key, node]) => this.generateObjectProperty(key, node)
    );
    return t.tsTypeLiteral(props);
  }
}
function uppercaseFirstLetter(input) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}
function sanitizeIdentifier(input) {
  return `${input.replace(/^\d/, "_").replace(/[^$\w]+(.)/g, (_, char) => char.toUpperCase())}`;
}
export {
  TypeGenerator,
  configDefinition,
  findQueriesInPath,
  findQueriesInSource,
  getResolver,
  readConfig,
  readSchema,
  registerBabel,
  safeParseQuery
};
//# sourceMappingURL=index.js.map
