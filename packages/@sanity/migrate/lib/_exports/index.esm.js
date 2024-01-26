import FIFO from 'fast-fifo';
import { open } from 'node:fs/promises';
import createDebug from 'debug';
import { createSafeJsonParser } from '@sanity/util/createSafeJsonParser';
import arrify from 'arrify';
import { SanityEncoder } from '@bjoerge/mutiny';
import { fromString } from '@sanity/util/paths';
import { tmpdir } from 'node:os';
import path from 'node:path';
import groq from 'groq-js';
import { createClient } from '@sanity/client';
import { from, switchMap, finalize } from 'rxjs';
const objectToString = Object.prototype.toString;
const uint8ArrayStringified = "[object Uint8Array]";
function isUint8Array(value) {
  if (!value) {
    return false;
  }
  if (value.constructor === Uint8Array) {
    return true;
  }
  return objectToString.call(value) === uint8ArrayStringified;
}
function assertUint8Array(value) {
  if (!isUint8Array(value)) {
    throw new TypeError("Expected `Uint8Array`, got `".concat(typeof value, "`"));
  }
}
function concatUint8Arrays(arrays, totalLength) {
  if (arrays.length === 0) {
    return new Uint8Array(0);
  }
  totalLength != null ? totalLength : totalLength = arrays.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0);
  const returnValue = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    assertUint8Array(array);
    returnValue.set(array, offset);
    offset += array.length;
  }
  return returnValue;
}
function areUint8ArraysEqual(a, b) {
  assertUint8Array(a);
  assertUint8Array(b);
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
}
function peekInto(readable, options) {
  const {
    size
  } = options;
  return new Promise((resolve, reject) => {
    let totalBytesRead = 0;
    let streamCompleted = false;
    const chunks = [];
    const reader = readable.getReader();
    function settled() {
      const head = concatUint8Arrays(chunks);
      resolve([head, new ReadableStream({
        start(controller) {
          controller.enqueue(head);
          if (streamCompleted) {
            controller.close();
          }
        },
        async pull(controller) {
          const {
            done,
            value
          } = await reader.read();
          if (done) {
            controller.close();
          } else {
            controller.enqueue(value);
          }
        }
      })]);
    }
    (async () => {
      while (true) {
        const {
          done,
          value: chunk
        } = await reader.read();
        if (done) {
          streamCompleted = true;
          break;
        } else {
          totalBytesRead += chunk.byteLength;
          chunks.push(chunk);
          if (totalBytesRead >= size) {
            break;
          }
        }
      }
    })().then(settled, reject);
  });
}
function isGzip(buffer) {
  return buffer.length > 3 && buffer[0] === 31 && buffer[1] === 139 && buffer[2] === 8;
}
function isDeflate(buf) {
  return buf.length > 2 && buf[0] === 120 && (buf[1] === 1 || buf[1] === 156 || buf[1] === 218);
}
async function maybeDecompress(readable) {
  const [head, stream] = await peekInto(readable, {
    size: 10
  });
  if (isGzip(head)) {
    return stream.pipeThrough(new DecompressionStream("gzip"));
  }
  if (isDeflate(head)) {
    return stream.pipeThrough(new DecompressionStream("deflate-raw"));
  }
  return stream;
}
const EMPTY = new Uint8Array();
class BufferList {
  constructor() {
    this.buffered = 0;
    this.shifted = 0;
    this.queue = new FIFO();
    this._offset = 0;
  }
  push(buffer) {
    this.buffered += buffer.byteLength;
    this.queue.push(buffer);
  }
  shiftFirst(size) {
    return this.buffered === 0 ? null : this._next(size);
  }
  shift(size) {
    if (size > this.buffered) return null;
    if (size === 0) return EMPTY;
    let chunk = this._next(size);
    if (size === chunk.byteLength) return chunk;
    const chunks = [chunk];
    while ((size -= chunk.byteLength) > 0) {
      chunk = this._next(size);
      chunks.push(chunk);
    }
    return concatUint8Arrays(chunks);
  }
  _next(size) {
    const buf = this.queue.peek();
    const rem = buf.byteLength - this._offset;
    if (size >= rem) {
      const sub = this._offset ? buf.subarray(this._offset, buf.byteLength) : buf;
      this.queue.shift();
      this._offset = 0;
      this.buffered -= rem;
      this.shifted += rem;
      return sub;
    }
    this.buffered -= size;
    this.shifted += size;
    return buf.subarray(this._offset, this._offset += size);
  }
}
const ZERO_OFFSET = "0".charCodeAt(0);
const USTAR_MAGIC = new Uint8Array([117, 115, 116, 97, 114, 0]);
const GNU_MAGIC = new Uint8Array([117, 115, 116, 97, 114, 32]);
const GNU_VER = new Uint8Array([32, 0]);
const MAGIC_OFFSET = 257;
const VERSION_OFFSET = 263;
function decode(buf, filenameEncoding, allowUnknownFormat) {
  let typeflag = buf[156] === 0 ? 0 : buf[156] - ZERO_OFFSET;
  let name = decodeStr(buf, 0, 100, filenameEncoding);
  const mode = decodeOct(buf, 100, 8);
  const uid = decodeOct(buf, 108, 8);
  const gid = decodeOct(buf, 116, 8);
  const size = decodeOct(buf, 124, 12);
  const mtime = decodeOct(buf, 136, 12);
  const type = toType(typeflag);
  const linkname = buf[157] === 0 ? null : decodeStr(buf, 157, 100, filenameEncoding);
  const uname = decodeStr(buf, 265, 32);
  const gname = decodeStr(buf, 297, 32);
  const devmajor = decodeOct(buf, 329, 8);
  const devminor = decodeOct(buf, 337, 8);
  const c = cksum(buf);
  if (c === 8 * 32) return null;
  if (c !== decodeOct(buf, 148, 8)) {
    throw new Error("Invalid tar header. Maybe the tar is corrupted or it needs to be gunzipped?");
  }
  if (isUSTAR(buf)) {
    if (buf[345]) name = "".concat(decodeStr(buf, 345, 155, filenameEncoding), "/").concat(name);
  } else if (isGNU(buf)) ;else if (!allowUnknownFormat) {
    throw new Error("Invalid tar header: unknown format.");
  }
  if (typeflag === 0 && name && name[name.length - 1] === "/") typeflag = 5;
  return {
    type,
    name,
    mode,
    uid,
    gid,
    size,
    mtime: mtime ? new Date(1e3 * mtime) : null,
    linkname,
    uname,
    gname,
    devmajor,
    devminor
  };
}
function isUSTAR(buf) {
  return areUint8ArraysEqual(USTAR_MAGIC, buf.subarray(MAGIC_OFFSET, MAGIC_OFFSET + 6));
}
function isGNU(buf) {
  return areUint8ArraysEqual(GNU_MAGIC, buf.subarray(MAGIC_OFFSET, MAGIC_OFFSET + 6)) && areUint8ArraysEqual(GNU_VER, buf.subarray(VERSION_OFFSET, VERSION_OFFSET + 2));
}
function clamp(index, len, defaultValue) {
  if (typeof index !== "number") return defaultValue;
  index = ~~index;
  if (index >= len) return len;
  if (index >= 0) return index;
  index += len;
  if (index >= 0) return index;
  return 0;
}
function toType(flag) {
  switch (flag) {
    case 0:
      return "file";
    case 1:
      return "link";
    case 2:
      return "symlink";
    case 3:
      return "character-device";
    case 4:
      return "block-device";
    case 5:
      return "directory";
    case 6:
      return "fifo";
    case 7:
      return "contiguous-file";
    case 72:
      return "pax-header";
    case 55:
      return "pax-global-header";
    case 27:
      return "gnu-long-link-path";
    case 28:
    case 30:
      return "gnu-long-path";
    default:
      return null;
  }
}
function indexOf(block, num, offset, end) {
  for (; offset < end; offset++) {
    if (block[offset] === num) return offset;
  }
  return end;
}
function cksum(block) {
  let sum = 8 * 32;
  for (let i = 0; i < 148; i++) sum += block[i];
  for (let j = 156; j < 512; j++) sum += block[j];
  return sum;
}
function parse256(buf) {
  let positive;
  if (buf[0] === 128) positive = true;else if (buf[0] === 255) positive = false;else return null;
  const tuple = [];
  let i;
  for (i = buf.length - 1; i > 0; i--) {
    const byte = buf[i];
    if (positive) tuple.push(byte);else tuple.push(255 - byte);
  }
  let sum = 0;
  const l = tuple.length;
  for (i = 0; i < l; i++) {
    sum += tuple[i] * Math.pow(256, i);
  }
  return positive ? sum : -1 * sum;
}
const decoders = {};
const getCachedDecoder = encoding => {
  if (!(encoding in decoders)) {
    decoders[encoding] = new TextDecoder(encoding);
  }
  return decoders[encoding];
};
function toString(uint8) {
  let encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "utf-8";
  return getCachedDecoder(encoding).decode(uint8);
}
function decodeOct(val, offset, length) {
  val = val.subarray(offset, offset + length);
  offset = 0;
  if (val[offset] & 128) {
    return parse256(val);
  }
  while (offset < val.length && val[offset] === 32) offset++;
  const end = clamp(indexOf(val, 32, offset, val.length), val.length, val.length);
  while (offset < end && val[offset] === 0) offset++;
  if (end === offset) return 0;
  return parseInt(toString(val.subarray(offset, end)), 8);
}
function decodeStr(val, offset, length, encoding) {
  return toString(val.subarray(offset, indexOf(val, 0, offset, offset + length)), encoding);
}
const emptyReadableStream = () => new ReadableStream({
  pull(controller) {
    controller.close();
  }
});
function untar(stream) {
  let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  const buffer = new BufferList();
  const reader = stream.getReader();
  let readingChunk = false;
  return new ReadableStream({
    async pull(controller) {
      var _a, _b;
      if (readingChunk) {
        return;
      }
      const {
        done,
        value
      } = await reader.read();
      if (!done) {
        buffer.push(value);
      }
      const headerChunk = buffer.shift(512);
      if (!headerChunk) {
        throw new Error("Unexpected end of tar file. Expected 512 bytes of headers.");
      }
      const header = decode(headerChunk, (_a = options.filenameEncoding) != null ? _a : "utf-8", (_b = options.allowUnknownFormat) != null ? _b : false);
      if (header) {
        if (header.size === null || header.size === 0 || header.type === "directory") {
          controller.enqueue([header, emptyReadableStream()]);
        } else {
          readingChunk = true;
          controller.enqueue([header, entryStream(reader, header.size, buffer, () => {
            readingChunk = false;
          })]);
        }
      } else if (done) {
        controller.close();
      }
    }
  });
}
function entryStream(reader, expectedBytes, buffer, next) {
  let totalBytesRead = 0;
  return new ReadableStream({
    async pull(controller) {
      const {
        done,
        value
      } = await reader.read();
      const remaining = expectedBytes - totalBytesRead;
      if (!done) {
        buffer.push(value);
      }
      const chunk = buffer.shiftFirst(remaining);
      if (!chunk) {
        throw new Error("Premature end of tar stream");
      }
      controller.enqueue(chunk);
      totalBytesRead += chunk.byteLength;
      if ((chunk == null ? void 0 : chunk.byteLength) === remaining) {
        discardPadding(buffer, expectedBytes);
        controller.close();
        next();
      }
    }
  });
}
function getPadding(size) {
  size &= 511;
  return size === 0 ? 0 : 512 - size;
}
function discardPadding(bl, size) {
  const overflow = getPadding(size);
  if (overflow > 0) {
    bl.shift(overflow);
  }
}
async function* streamToAsyncIterator(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const {
        done,
        value
      } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
var baseDebug = createDebug("sanity:migrate");
const debug$1 = baseDebug.extend("readFileAsWebStream");
function readFileAsWebStream(filename) {
  const CHUNK_SIZE = 1024;
  let fileHandle;
  let position = 0;
  return new ReadableStream({
    async start() {
      debug$1("Starting readable stream from", filename);
      fileHandle = await open(filename, "r");
    },
    async pull(controller) {
      const buffer = new Uint8Array(CHUNK_SIZE);
      const {
        bytesRead
      } = await fileHandle.read(buffer, 0, CHUNK_SIZE, position);
      if (bytesRead === 0) {
        await fileHandle.close();
        debug$1("Closing readable stream from", filename);
        controller.close();
      } else {
        position += bytesRead;
        controller.enqueue(buffer.subarray(0, bytesRead));
      }
    },
    cancel() {
      debug$1("Cancelling readable stream from", filename);
      return fileHandle.close();
    }
  });
}
async function* fromExportArchive(path) {
  for await (const [header, entry] of streamToAsyncIterator(untar(await maybeDecompress(readFileAsWebStream(path))))) {
    if (header.type === "file" && header.name.endsWith(".ndjson")) {
      for await (const chunk of streamToAsyncIterator(entry)) {
        yield chunk;
      }
    }
  }
}
async function assert2xx(res) {
  if (res.status < 200 || res.status > 299) {
    const response = await res.json().catch(() => {
      throw new Error("Error parsing JSON ".concat(res.status, ": ").concat(res.statusText));
    });
    const message = response.error ? response.error.description : "HTTP Error ".concat(res.status, ": ").concat(res.statusText);
    const err = new Error(message);
    err.statusCode = res.status;
    throw err;
  }
}
async function fetchStream(_ref) {
  let {
    url,
    init
  } = _ref;
  const response = await fetch(url, init);
  await assert2xx(response);
  if (response.body === null) throw new Error("No response received");
  return response.body;
}
async function fetchAsyncIterator(options) {
  return streamToAsyncIterator(await fetchStream(options));
}
function getUserAgent() {
  if (typeof window === "undefined") {
    try {
      const pkg = require("../../package.json");
      return "".concat(pkg.name, "@").concat(pkg.version);
    } catch (err) {}
  }
  return null;
}
function normalizeApiHost(apiHost) {
  return apiHost.replace(/^https?:\/\//, "");
}
function toFetchOptions(req) {
  const {
    endpoint,
    apiVersion,
    tag,
    projectId,
    apiHost,
    token,
    body
  } = req;
  const requestInit = {
    method: endpoint.method || "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body
  };
  const ua = getUserAgent();
  if (ua) {
    requestInit.headers = {
      ...requestInit.headers,
      "User-Agent": ua
    };
  }
  if (token) {
    requestInit.headers = {
      ...requestInit.headers,
      Authorization: "bearer ".concat(token)
    };
  }
  const normalizedApiHost = normalizeApiHost(apiHost);
  const path = "/".concat(apiVersion).concat(endpoint.path);
  const host = endpoint.global ? normalizedApiHost : "".concat(projectId, ".").concat(normalizedApiHost);
  const searchParams = new URLSearchParams([...endpoint.searchParams, ...(tag ? [["tag", tag]] : [])]).toString();
  return {
    url: "https://".concat(host, "/").concat(path).concat(searchParams ? "?".concat(searchParams) : ""),
    init: requestInit
  };
}
const endpoints = {
  users: {
    me: () => ({
      global: true,
      path: "/users/me",
      method: "GET",
      searchParams: []
    })
  },
  data: {
    query: dataset => ({
      global: false,
      method: "GET",
      path: "/query/".concat(dataset),
      searchParams: []
    }),
    export: (dataset, documentTypes) => ({
      global: false,
      method: "GET",
      path: "/data/export/".concat(dataset),
      searchParams: documentTypes && (documentTypes == null ? void 0 : documentTypes.length) > 0 ? [["types", documentTypes.join(",")]] : []
    }),
    mutate: (dataset, options) => {
      const params = [(options == null ? void 0 : options.tag) && ["tag", options.tag], (options == null ? void 0 : options.returnIds) && ["returnIds", "true"], (options == null ? void 0 : options.returnDocuments) && ["returnDocuments", "true"], (options == null ? void 0 : options.visiblity) && ["visibility", options.visiblity], (options == null ? void 0 : options.dryRun) && ["dryRun", "true"]].filter(Boolean);
      return {
        global: false,
        method: "POST",
        path: "/data/mutate/".concat(dataset),
        searchParams: params
      };
    }
  }
};
function fromExportEndpoint(options) {
  var _a;
  return fetchStream(toFetchOptions({
    projectId: options.projectId,
    apiVersion: options.apiVersion,
    token: options.token,
    apiHost: (_a = options.apiHost) != null ? _a : "api.sanity.io",
    tag: "sanity.migration.export",
    endpoint: endpoints.data.export(options.dataset, options.documentTypes)
  }));
}
const safeJsonParser = createSafeJsonParser({
  errorLabel: "Error streaming dataset"
});
function* fromDocuments(documents) {
  for (const document of documents) {
    yield document;
  }
}
function defineMigration(migration) {
  return migration;
}
async function* decodeText(it) {
  const decoder = new TextDecoder();
  for await (const chunk of it) {
    yield decoder.decode(chunk);
  }
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function* delay(it, ms) {
  for await (const chunk of it) {
    await sleep(ms);
    yield chunk;
  }
}
function parseJSON(it) {
  try {
    let {
      parse = JSON.parse
    } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return async function* () {
      for await (const chunk of it) {
        yield parse(chunk);
      }
    }();
  } catch (e) {
    return Promise.reject(e);
  }
}
async function* stringifyJSON(it) {
  for await (const chunk of it) {
    yield JSON.stringify(chunk);
  }
}
async function* filter(it, predicate) {
  for await (const chunk of it) {
    if (await predicate(chunk)) {
      yield chunk;
    }
  }
}
async function* map(it, project) {
  for await (const chunk of it) {
    yield project(chunk);
  }
}
async function* split(it, delimiter) {
  let buf = "";
  for await (const chunk of it) {
    buf += chunk;
    if (buf.includes(delimiter)) {
      const lastIndex = buf.lastIndexOf(delimiter);
      const parts = buf.substring(0, lastIndex).split(delimiter);
      for (const part of parts) {
        yield part;
      }
      buf = buf.substring(lastIndex + delimiter.length);
    }
  }
  yield buf;
}
function parse(it, options) {
  return parseJSON(filter(split(it, "\n"), line => Boolean(line && line.trim())), options);
}
async function* stringify(iterable) {
  for await (const doc of iterable) {
    yield "".concat(JSON.stringify(doc), "\n");
  }
}
async function* take(it, count) {
  let i = 0;
  for await (const chunk of it) {
    if (i++ >= count) return;
    yield chunk;
  }
}
async function toArray(it) {
  const result = [];
  for await (const chunk of it) {
    result.push(chunk);
  }
  return result;
}
async function* tap(it, interceptor) {
  for await (const chunk of it) {
    interceptor(chunk);
    yield chunk;
  }
}
async function mapAsync(it, project, concurrency) {
  const {
    pMapIterable
  } = await import('p-map');
  return pMapIterable(it, v => project(v), {
    concurrency
  });
}
async function lastValueFrom(it, options) {
  const defaultGiven = ("defaultValue" in (options != null ? options : {}));
  let latestValue;
  let didYield = false;
  for await (const value of it) {
    didYield = true;
    latestValue = value;
  }
  if (!didYield) {
    if (defaultGiven) {
      return options.defaultValue;
    }
    throw new Error("No value yielded from async iterable. If this iterable is empty, provide a default value.");
  }
  return latestValue;
}
async function* concatStr(it) {
  let buf = "";
  for await (const chunk of it) {
    buf += chunk;
  }
  yield buf;
}
const debug = baseDebug.extend("bufferThroughFile");
const CHUNK_SIZE = 1024;
function bufferThroughFile(source, filename, options) {
  const signal = options == null ? void 0 : options.signal;
  let writeHandle;
  let readHandle;
  let bufferDone = false;
  signal == null ? void 0 : signal.addEventListener("abort", async () => {
    debug("Aborting bufferThroughFile");
    await Promise.all([writeHandle && writeHandle.close(), readHandle && (await readHandle).close()]);
  });
  let readerCount = 0;
  let ready;
  async function pump(reader) {
    try {
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done || (signal == null ? void 0 : signal.aborted)) {
          return;
        }
        await writeHandle.write(value);
      }
    } finally {
      await writeHandle.close();
      bufferDone = true;
      reader.releaseLock();
    }
  }
  function createBufferedReader() {
    let totalBytesRead = 0;
    return async function tryReadFromBuffer(handle) {
      const {
        bytesRead,
        buffer
      } = await handle.read(new Uint8Array(CHUNK_SIZE), 0, CHUNK_SIZE, totalBytesRead);
      if (bytesRead === 0 && !bufferDone && !(signal == null ? void 0 : signal.aborted)) {
        debug("Not enough data in buffer file, waiting for more data to be written");
        return tryReadFromBuffer(handle);
      }
      totalBytesRead += bytesRead;
      return {
        bytesRead,
        buffer
      };
    };
  }
  function init() {
    if (!ready) {
      ready = (async () => {
        debug("Initializing bufferThroughFile");
        writeHandle = await open(filename, "w");
        debug("Start buffering source stream to file");
        pump(source.getReader()).then(() => {
          debug("Buffering source stream to buffer file");
        });
      })();
    }
    return ready;
  }
  function getReadHandle() {
    if (!readHandle) {
      debug("Opening read handle on %s", filename);
      readHandle = open(filename, "r");
    }
    return readHandle;
  }
  function onReaderStart() {
    readerCount++;
  }
  async function onReaderEnd() {
    readerCount--;
    if (readerCount === 0 && readHandle) {
      const handle = readHandle;
      readHandle = null;
      debug("Closing read handle on %s", filename);
      await (await handle).close();
    }
  }
  return () => {
    const readChunk = createBufferedReader();
    return new ReadableStream({
      async start() {
        if (signal == null ? void 0 : signal.aborted) {
          throw new Error("Cannot create new buffered readers on aborted stream");
        }
        debug("Reader started reading from file handle");
        onReaderStart();
        await init();
        await getReadHandle();
      },
      async pull(controller) {
        if (!readHandle) {
          throw new Error("Cannot read from closed handle");
        }
        const {
          bytesRead,
          buffer
        } = await readChunk(await readHandle);
        if (bytesRead === 0 && bufferDone) {
          debug("Reader done reading from file handle");
          await onReaderEnd();
          controller.close();
        } else {
          controller.enqueue(buffer.subarray(0, bytesRead));
        }
      }
    });
  };
}
function asyncIterableToStream(it) {
  return new ReadableStream({
    async pull(controller) {
      const {
        value,
        done
      } = await it.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    }
  });
}
function isMutation(mutation) {
  return mutation !== null && typeof mutation === "object" && "type" in mutation && (mutation.type === "create" || mutation.type === "createIfNotExists" || mutation.type === "createOrReplace" || mutation.type === "patch" || mutation.type === "delete");
}
function isTransaction(mutation) {
  return mutation !== null && typeof mutation === "object" && "type" in mutation && mutation.type === "transaction";
}
async function* toSanityMutations(it) {
  for await (const mutation of it) {
    for (const mut of arrify(mutation)) {
      if (isTransaction(mut)) {
        yield {
          transactionId: mut.id,
          mutations: SanityEncoder.encode(mut.mutations)
        };
        continue;
      }
      yield SanityEncoder.encode(mutation);
    }
  }
}
const MUTATION_ENDPOINT_MAX_BODY_SIZE = 1024 * 256;
const DEFAULT_MUTATION_CONCURRENCY = 6;
const MAX_MUTATION_CONCURRENCY = 10;
const PADDING_SIZE = '{"mutations":[]}'.length;
function isTransactionPayload(payload) {
  return payload && payload.mutations && Array.isArray(payload.mutations);
}
async function* batchMutations(mutations, maxBatchSize) {
  let currentBatch = [];
  let currentBatchSize = 0;
  for await (const mutation of mutations) {
    if (isTransactionPayload(mutation)) {
      yield {
        mutations: currentBatch
      };
      yield mutation;
      currentBatch = [];
      currentBatchSize = 0;
      continue;
    }
    const mutationSize = JSON.stringify(mutation).length;
    if (mutationSize >= maxBatchSize + PADDING_SIZE) {
      if (currentBatch.length) {
        yield {
          mutations: currentBatch
        };
      }
      yield {
        mutations: [...arrify(mutation)]
      };
      currentBatch = [];
      currentBatchSize = 0;
      continue;
    }
    currentBatchSize += mutationSize;
    if (currentBatchSize >= maxBatchSize + PADDING_SIZE) {
      yield {
        mutations: currentBatch
      };
      currentBatch = [];
      currentBatchSize = 0;
    }
    currentBatch.push(...arrify(mutation));
  }
  if (currentBatch.length > 0) {
    yield {
      mutations: currentBatch
    };
  }
}
function create(document) {
  return {
    type: "create",
    document
  };
}
function patch(id, patches, options) {
  return {
    type: "patch",
    id,
    patches: arrify(patches),
    ...(options ? {
      options
    } : {})
  };
}
function at(path, operation) {
  return {
    path: typeof path === "string" ? fromString(path) : path,
    op: operation
  };
}
function createIfNotExists(document) {
  return {
    type: "createIfNotExists",
    document
  };
}
function createOrReplace(document) {
  return {
    type: "createOrReplace",
    document
  };
}
function delete_(id) {
  return {
    type: "delete",
    id
  };
}
const del = delete_;
const set = value => ({
  type: "set",
  value
});
const setIfMissing = value => ({
  type: "setIfMissing",
  value
});
const unset = () => ({
  type: "unset"
});
const inc = function () {
  let amount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
  return {
    type: "inc",
    amount
  };
};
const dec = function () {
  let amount = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
  return {
    type: "dec",
    amount
  };
};
const diffMatchPatch = value => ({
  type: "diffMatchPatch",
  value
});
function insert(items, position, indexOrReferenceItem) {
  return {
    type: "insert",
    referenceItem: indexOrReferenceItem,
    position,
    items: arrify(items)
  };
}
function append(items) {
  return insert(items, "after", -1);
}
function prepend(items) {
  return insert(items, "before", 0);
}
function insertBefore(items, indexOrReferenceItem) {
  return insert(items, "before", indexOrReferenceItem);
}
const insertAfter = (items, indexOrReferenceItem) => {
  return insert(items, "after", indexOrReferenceItem);
};
function truncate(startIndex, endIndex) {
  return {
    type: "truncate",
    startIndex,
    endIndex
  };
}
function replace(items, referenceItem) {
  return {
    type: "replace",
    referenceItem,
    items: arrify(items)
  };
}
function transaction(idOrMutations, _mutations) {
  const [id, mutations] = typeof idOrMutations === "string" ? [idOrMutations, _mutations] : [void 0, idOrMutations];
  return {
    type: "transaction",
    id,
    mutations
  };
}
function getValueType(value) {
  if (Array.isArray(value)) {
    return "array";
  }
  return value === null ? "null" : typeof value;
}
function callMap(mapFn, value, path) {
  const res = mapFn(value, path);
  return Array.isArray(res) ? res : [res];
}
function getPathWithKey(item, index, container) {
  if (item && Array.isArray(container) && typeof item === "object" && "_key" in item && typeof item._key === "string") {
    return {
      _key: item._key
    };
  }
  return index;
}
function mapObject(reducerFn, object, path) {
  return [...callMap(reducerFn, object, path), ...Object.keys(object).flatMap(key => flatMapAny(reducerFn, object[key], path.concat(getPathWithKey(object[key], key, object))))];
}
function mapArray(mapFn, array, path) {
  return [...callMap(mapFn, array, path), ...array.flatMap((item, index) => flatMapAny(mapFn, item, path.concat(getPathWithKey(item, index, array))))];
}
function flatMapAny(mapFn, val, path) {
  const type = getValueType(val);
  if (type === "object") {
    return mapObject(mapFn, val, path);
  }
  if (type === "array") {
    return mapArray(mapFn, val, path);
  }
  return callMap(mapFn, val, path);
}
function flatMapDeep(value, mapFn) {
  return flatMapAny(mapFn, value, []);
}
function normalizeMigrateDefinition(migration) {
  if (typeof migration.migrate == "function") {
    return normalizeIteratorValues(migration.migrate);
  }
  return createAsyncIterableMutation(migration.migrate, {
    filter: migration.filter,
    documentTypes: migration.documentTypes
  });
}
function normalizeIteratorValues(asyncIterable) {
  return async function* run(docs, context) {
    for await (const documentMutations of asyncIterable(docs, context)) {
      yield normalizeMutation(documentMutations);
    }
  };
}
function normalizeMutation(change) {
  if (Array.isArray(change)) {
    return change.flatMap(ch => normalizeMutation(ch));
  }
  if (isRawMutation(change)) {
    return SanityEncoder.decode([change]);
  }
  return [change];
}
function isRawMutation(mutation) {
  return "createIfNotExists" in mutation || "createOrReplace" in mutation || "create" in mutation || "patch" in mutation || "delete" in mutation;
}
function isOperation(value) {
  return "type" in value && (value.type === "set" || value.type === "unset" || value.type === "insert" || value.type === "diffMatchPatch" || value.type === "dec" || value.type === "inc" || value.type === "upsert" || value.type === "unassign" || value.type === "truncate" || value.type === "setIfMissing");
}
function createAsyncIterableMutation(migration, opts) {
  const documentTypesSet = new Set(opts.documentTypes);
  return async function* run(docs, context) {
    for await (const doc of docs()) {
      if (opts.documentTypes && !documentTypesSet.has(doc._type)) continue;
      const documentMutations = await collectDocumentMutations(migration, doc, context);
      if (documentMutations.length > 0) {
        yield documentMutations;
      }
    }
  };
}
async function collectDocumentMutations(migration, doc, context) {
  var _a;
  const documentMutations = Promise.resolve((_a = migration.document) == null ? void 0 : _a.call(migration, doc, context));
  const nodeMigrations = flatMapDeep(doc, async (value, path) => {
    var _a2;
    const [nodeReturnValues, nodeTypeReturnValues] = await Promise.all([Promise.resolve((_a2 = migration.node) == null ? void 0 : _a2.call(migration, value, path, context)), Promise.resolve(migrateNodeType(migration, value, path, context))]);
    return [...arrify(nodeReturnValues), ...arrify(nodeTypeReturnValues)].map(change => change && normalizeNodeMutation(path, change));
  });
  return (await Promise.all([...arrify(await documentMutations), ...nodeMigrations])).flat().flatMap(change => change ? normalizeDocumentMutation(doc._id, change) : []);
}
function normalizeDocumentMutation(documentId, change) {
  if (Array.isArray(change)) {
    return change.flatMap(ch => normalizeDocumentMutation(documentId, ch));
  }
  if (isRawMutation(change)) {
    return SanityEncoder.decode([change])[0];
  }
  if (isTransaction(change)) {
    return change;
  }
  return isMutation(change) ? change : patch(documentId, change);
}
function normalizeNodeMutation(path, change) {
  if (Array.isArray(change)) {
    return change.flatMap(ch => normalizeNodeMutation(path, ch));
  }
  if (isRawMutation(change)) {
    return SanityEncoder.decode([change])[0];
  }
  return isOperation(change) ? at(path, change) : change;
}
function migrateNodeType(migration, value, path, context) {
  var _a, _b, _c, _d, _e, _f;
  switch (getValueType(value)) {
    case "string":
      return (_a = migration.string) == null ? void 0 : _a.call(migration, value, path, context);
    case "number":
      return (_b = migration.number) == null ? void 0 : _b.call(migration, value, path, context);
    case "boolean":
      return (_c = migration.boolean) == null ? void 0 : _c.call(migration, value, path, context);
    case "object":
      return (_d = migration.object) == null ? void 0 : _d.call(migration, value, path, context);
    case "array":
      return (_e = migration.array) == null ? void 0 : _e.call(migration, value, path, context);
    case "null":
      return (_f = migration.null) == null ? void 0 : _f.call(migration, value, path, context);
    default:
      throw new Error("Unknown value type");
  }
}
function collectMigrationMutations(migration, documents, context) {
  const migrate = normalizeMigrateDefinition(migration);
  return migrate(documents, context);
}
function getBufferFilePath() {
  return path.join(tmpdir(), "/export-buffer-".concat(Date.now(), ".tmp"));
}
function createFilteredDocumentsClient(getFilteredDocumentsReadableStream) {
  function getAllDocumentsFromBuffer() {
    return parse(decodeText(streamToAsyncIterator(getFilteredDocumentsReadableStream())), {
      parse: safeJsonParser
    });
  }
  async function getDocumentsFromBuffer(ids) {
    const found = {};
    let remaining = ids.length;
    for await (const doc of getAllDocumentsFromBuffer()) {
      if (ids.includes(doc._id)) {
        remaining--;
        found[doc._id] = doc;
      }
      if (remaining === 0) break;
    }
    return ids.map(id => found[id]);
  }
  async function getDocumentFromBuffer(id) {
    return (await getDocumentsFromBuffer([id]))[0];
  }
  return {
    getDocument: getDocumentFromBuffer,
    getDocuments: getDocumentsFromBuffer
  };
}
function isSystemDocumentId(id) {
  return id.startsWith("_.");
}
function parseGroqFilter(filter) {
  try {
    return groq.parse("*[".concat(filter, "]"));
  } catch (err) {
    err.message = 'Failed to parse GROQ filter "'.concat(filter, '": ').concat(err.message);
    throw err;
  }
}
async function matchesFilter(parsedFilter, document) {
  const result = await (await groq.evaluate(parsedFilter, {
    dataset: [document]
  })).get();
  return result.length === 1;
}
async function* applyFilters(migration, documents) {
  const documentTypes = migration.documentTypes;
  const parsedFilter = migration.filter ? parseGroqFilter(migration.filter) : void 0;
  for await (const doc of documents) {
    if (isSystemDocumentId(doc._id)) {
      continue;
    }
    if (documentTypes && documentTypes.length > 0 && !documentTypes.includes(doc._type)) {
      continue;
    }
    if (parsedFilter && !(await matchesFilter(parsedFilter, doc))) {
      continue;
    }
    yield doc;
  }
}
class ConcurrencyLimiter {
  constructor(max) {
    this.max = max;
    this.current = 0;
    this.resolvers = [];
    /**
     * Indicates when a slot for a new operation is ready.
     * If under the limit, it resolves immediately; otherwise, it waits until a slot is free.
     */
    this.ready = () => {
      if (this.max === Infinity) return Promise.resolve();
      if (this.current < this.max) {
        this.current++;
        return Promise.resolve();
      }
      return new Promise(resolve => {
        this.resolvers.push(resolve);
      });
    };
    /**
     * Releases a slot, decrementing the current count of operations if nothing is in the queue.
     * If there are operations waiting, it allows the next one in the queue to proceed.
     */
    this.release = () => {
      if (this.max === Infinity) return;
      const nextResolver = this.resolvers.shift();
      if (nextResolver) {
        nextResolver();
        return;
      }
      this.current = Math.max(0, this.current - 1);
    };
  }
}
function createClientConcurrencyLimiter(maxConcurrency) {
  const limiter = new ConcurrencyLimiter(maxConcurrency);
  function wrapClient(client) {
    return new Proxy(client, {
      get: (target, property) => {
        switch (property) {
          case "fetch":
            {
              return async function () {
                await limiter.ready();
                try {
                  return await target.fetch(...arguments);
                } finally {
                  limiter.release();
                }
              };
            }
          case "clone":
            {
              return function () {
                return wrapClient(target.clone(...arguments));
              };
            }
          case "config":
            {
              return function () {
                const result = target.config(...arguments);
                if (arguments.length <= 0 ? undefined : arguments[0]) return wrapClient(result);
                return result;
              };
            }
          case "withConfig":
            {
              return function () {
                return wrapClient(target.withConfig(...arguments));
              };
            }
          case "observable":
            {
              return wrapObservableClient(target.observable);
            }
          default:
            {
              return target[property];
            }
        }
      }
    });
  }
  function wrapObservableClient(observableSanityClient) {
    return new Proxy(observableSanityClient, {
      get: (target, property) => {
        switch (property) {
          case "fetch":
            {
              return function () {
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }
                return from(limiter.ready()).pipe(switchMap(() => target.fetch(...args)), finalize(() => limiter.release()));
              };
            }
          case "clone":
            {
              return function () {
                return wrapObservableClient(target.clone(...arguments));
              };
            }
          case "config":
            {
              return function () {
                const result = target.config(...arguments);
                if (arguments.length <= 0 ? undefined : arguments[0]) return wrapObservableClient(result);
                return result;
              };
            }
          case "withConfig":
            {
              return function () {
                return wrapObservableClient(target.withConfig(...arguments));
              };
            }
          default:
            {
              return target[property];
            }
        }
      }
    });
  }
  return wrapClient;
}
const MAX_FETCH_CONCURRENCY = 10;
const limitClientConcurrency = createClientConcurrencyLimiter(MAX_FETCH_CONCURRENCY);
function createContextClient(config) {
  return restrictClient(limitClientConcurrency(createClient({
    ...config,
    useCdn: false,
    requestTagPrefix: "sanity.migration"
  })));
}
const ALLOWED_PROPERTIES = ["fetch", "clone", "config", "withConfig", "getDocument", "getDocuments", "users", "projects"];
function restrictClient(client) {
  return new Proxy(client, {
    get: (target, property) => {
      switch (property) {
        case "clone":
          {
            return function () {
              return restrictClient(target.clone(...arguments));
            };
          }
        case "config":
          {
            return function () {
              const result = target.config(...arguments);
              if (arguments.length <= 0 ? undefined : arguments[0]) return restrictClient(result);
              return result;
            };
          }
        case "withConfig":
          {
            return function () {
              return restrictClient(target.withConfig(...arguments));
            };
          }
        default:
          {
            if (ALLOWED_PROPERTIES.includes(property)) {
              return target[property];
            }
            throw new Error('Client method "'.concat(String(property), '" can not be called during a migration. Only ').concat(ALLOWED_PROPERTIES.join(", "), " are allowed."));
          }
      }
    }
  });
}
async function* toFetchOptionsIterable(apiConfig, mutations) {
  var _a;
  for await (const transaction of mutations) {
    yield toFetchOptions({
      projectId: apiConfig.projectId,
      apiVersion: apiConfig.apiVersion,
      token: apiConfig.token,
      tag: "sanity.migration.mutate",
      apiHost: (_a = apiConfig.apiHost) != null ? _a : "api.sanity.io",
      endpoint: endpoints.data.mutate(apiConfig.dataset, {
        returnIds: true
      }),
      body: JSON.stringify(transaction)
    });
  }
}
async function run(config, migration) {
  var _a, _b, _c;
  const stats = {
    documents: 0,
    mutations: 0,
    pending: 0,
    queuedBatches: 0,
    completedTransactions: [],
    currentTransactions: []
  };
  const filteredDocuments = applyFilters(migration, parse(decodeText(streamToAsyncIterator(await fromExportEndpoint({
    ...config.api,
    documentTypes: migration.documentTypes
  }))), {
    parse: safeJsonParser
  }));
  const abortController = new AbortController();
  const createReader = bufferThroughFile(asyncIterableToStream(stringify(filteredDocuments)), getBufferFilePath(), {
    signal: abortController.signal
  });
  const client = createContextClient({
    ...config.api,
    useCdn: false,
    requestTagPrefix: "sanity.migration"
  });
  const filteredDocumentsClient = createFilteredDocumentsClient(createReader);
  const context = {
    client,
    filtered: filteredDocumentsClient
  };
  const documents = () => tap(parse(decodeText(streamToAsyncIterator(createReader())), {
    parse: safeJsonParser
  }), () => {
    var _a2;
    (_a2 = config.onProgress) == null ? void 0 : _a2.call(config, {
      ...stats,
      documents: ++stats.documents
    });
  });
  const mutations = tap(collectMigrationMutations(migration, documents, context), muts => {
    var _a2;
    stats.currentTransactions = arrify(muts);
    (_a2 = config.onProgress) == null ? void 0 : _a2.call(config, {
      ...stats,
      mutations: ++stats.mutations
    });
  });
  const concurrency = (_a = config == null ? void 0 : config.concurrency) != null ? _a : DEFAULT_MUTATION_CONCURRENCY;
  if (concurrency > MAX_MUTATION_CONCURRENCY) {
    throw new Error("Concurrency exceeds maximum allowed value (".concat(MAX_MUTATION_CONCURRENCY, ")"));
  }
  const batches = tap(batchMutations(toSanityMutations(mutations), MUTATION_ENDPOINT_MAX_BODY_SIZE), () => {
    var _a2;
    (_a2 = config.onProgress) == null ? void 0 : _a2.call(config, {
      ...stats,
      queuedBatches: ++stats.queuedBatches
    });
  });
  const submit = async opts => lastValueFrom(parseJSON(concatStr(decodeText(await fetchAsyncIterator(opts)))));
  const commits = await mapAsync(toFetchOptionsIterable(config.api, batches), opts => {
    var _a2;
    (_a2 = config.onProgress) == null ? void 0 : _a2.call(config, {
      ...stats,
      pending: ++stats.pending
    });
    return submit(opts);
  }, concurrency);
  for await (const result of commits) {
    stats.completedTransactions.push(result);
    (_b = config.onProgress) == null ? void 0 : _b.call(config, {
      ...stats
    });
  }
  (_c = config.onProgress) == null ? void 0 : _c.call(config, {
    ...stats,
    done: true
  });
  abortController.abort();
}
async function runFromArchive(migration, path, config) {
  var _a, _b, _c;
  const stats = {
    documents: 0,
    mutations: 0,
    pending: 0,
    queuedBatches: 0,
    completedTransactions: [],
    currentTransactions: []
  };
  const filteredDocuments = applyFilters(migration, parse(decodeText(fromExportArchive(path)), {
    parse: safeJsonParser
  }));
  const abortController = new AbortController();
  const createReader = bufferThroughFile(asyncIterableToStream(stringify(filteredDocuments)), getBufferFilePath(), {
    signal: abortController.signal
  });
  const documents = () => tap(parse(decodeText(streamToAsyncIterator(createReader())), {
    parse: safeJsonParser
  }), () => {
    var _a2;
    (_a2 = config.onProgress) == null ? void 0 : _a2.call(config, {
      ...stats,
      documents: ++stats.documents
    });
  });
  const client = createContextClient({
    ...config.api,
    useCdn: false
  });
  const filteredDocumentsClient = createFilteredDocumentsClient(createReader);
  const context = {
    client,
    filtered: filteredDocumentsClient
  };
  const payloads = tap(collectMigrationMutations(migration, documents, context), muts => {
    var _a2;
    stats.currentTransactions = arrify(muts);
    (_a2 = config.onProgress) == null ? void 0 : _a2.call(config, {
      ...stats,
      mutations: ++stats.mutations
    });
  });
  const batches = tap(batchMutations(toSanityMutations(payloads), MUTATION_ENDPOINT_MAX_BODY_SIZE), () => {
    var _a2;
    (_a2 = config.onProgress) == null ? void 0 : _a2.call(config, {
      ...stats,
      queuedBatches: ++stats.queuedBatches
    });
  });
  const concurrency = (_a = config == null ? void 0 : config.concurrency) != null ? _a : DEFAULT_MUTATION_CONCURRENCY;
  if (concurrency > MAX_MUTATION_CONCURRENCY) {
    throw new Error("Concurrency exceeds maximum allowed value (".concat(MAX_MUTATION_CONCURRENCY, ")"));
  }
  const commits = await mapAsync(toFetchOptionsIterable(config.api, batches), opts => {
    var _a2;
    (_a2 = config.onProgress) == null ? void 0 : _a2.call(config, {
      ...stats,
      pending: ++stats.pending
    });
    return Promise.resolve();
  }, concurrency);
  for await (const result of commits) {
    (_b = config.onProgress) == null ? void 0 : _b.call(config, {
      ...stats
    });
  }
  abortController.abort();
  (_c = config.onProgress) == null ? void 0 : _c.call(config, {
    ...stats,
    done: true
  });
}
async function* dryRun(config, migration) {
  const filteredDocuments = applyFilters(migration, parse(decodeText(streamToAsyncIterator(await fromExportEndpoint({
    ...config.api,
    documentTypes: migration.documentTypes
  }))), {
    parse: safeJsonParser
  }));
  const abortController = new AbortController();
  const createReader = bufferThroughFile(asyncIterableToStream(stringify(filteredDocuments)), getBufferFilePath(), {
    signal: abortController.signal
  });
  const client = createContextClient({
    ...config.api,
    useCdn: false
  });
  const filteredDocumentsClient = createFilteredDocumentsClient(createReader);
  const context = {
    client,
    filtered: filteredDocumentsClient
  };
  yield* collectMigrationMutations(migration, () => parse(decodeText(streamToAsyncIterator(createReader())), {
    parse: safeJsonParser
  }), context);
  abortController.abort();
}
export { DEFAULT_MUTATION_CONCURRENCY, MAX_MUTATION_CONCURRENCY, append, at, collectMigrationMutations, create, createIfNotExists, createOrReplace, dec, decodeText, defineMigration, del, delay, delete_, diffMatchPatch, dryRun, filter, fromDocuments, fromExportArchive, fromExportEndpoint, inc, insert, insertAfter, insertBefore, map, parse, parseJSON, patch, prepend, replace, run, runFromArchive, safeJsonParser, set, setIfMissing, split, stringify, stringifyJSON, take, toArray, toFetchOptionsIterable, transaction, truncate, unset };
//# sourceMappingURL=index.esm.js.map
