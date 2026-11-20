//! Port of the parts of `@sanity/client` Studio uses, on top of the browser's `fetch`.

pub mod bifur;
mod listen;
mod split;
pub mod sse;
mod util;

use std::fmt;
use std::rc::Rc;

use js_sys::{Reflect, Uint8Array};
use serde_json::{Map, Value, json};
use wasm_bindgen::{JsCast, JsValue};
use wasm_bindgen_futures::JsFuture;
use web_sys::{
    AbortSignal, Headers, ReadableStreamDefaultReader, RequestCredentials, RequestInit, Response, UrlSearchParams,
};

pub use listen::{ListenEvent, ListenOptions, Listener, MutationEvent, Transition};
pub use util::{now_iso, random_key, sleep};

pub const API_VERSION: &str = "2025-02-19";

const NO_QUERY: [(&str, &str); 0] = [];

#[derive(Clone, Debug, PartialEq)]
pub struct Error {
    pub status: Option<u16>,
    pub message: String,
}

impl Error {
    fn network(err: JsValue) -> Error {
        let message = err
            .dyn_ref::<js_sys::Error>()
            .map(|e| String::from(e.message()))
            .or_else(|| err.as_string())
            .unwrap_or_else(|| "Network request failed".into());
        Error { status: None, message }
    }

    pub fn is_unauthorized(&self) -> bool {
        self.status == Some(401)
    }

    /// A rate limit, an upstream failure or a network error, which a later attempt may not hit.
    pub fn is_retriable(&self) -> bool {
        matches!(self.status, None | Some(429 | 502 | 503))
    }
}

/// How often `@sanity/client` retries a request by default.
pub const MAX_RETRIES: u32 = 5;

/// `@sanity/client`'s default backoff: 100 ms doubling per attempt, plus up to 100 ms of jitter.
pub fn retry_delay(attempt: u32) -> u32 {
    100 * 2u32.pow(attempt.min(6)) + (js_sys::Math::random() * 100.0) as u32
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self.status {
            Some(status) => write!(f, "{} ({status})", self.message),
            None => f.write_str(&self.message),
        }
    }
}

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Config {
    pub project_id: String,
    pub dataset: String,
    /// `api.sanity.io`, or `api.sanity.work` for staging.
    pub api_host: String,
    /// Sent as a bearer token. Without one, requests carry the session cookie.
    pub token: Option<String>,
    pub request_tag_prefix: String,
}

/// A document from a [`DocumentStream`].
#[derive(Clone, Debug, PartialEq)]
pub struct QueriedDocument {
    /// The document's JSON, `None` when it is longer than the limit.
    pub json: Option<String>,
    /// The length of the document's JSON, in bytes.
    pub len: usize,
    /// The top-level fields asked for that the document has.
    pub fields: Map<String, Value>,
}

/// Chunks read from the response are split at most this many bytes at a time, so reading one
/// document never scans a whole large chunk.
const SPLIT_STEP: usize = 64 * 1024;

/// The documents of a query result, read from the response as it arrives; see
/// [`Client::query_documents`]. Dropping it cancels the rest of the response.
pub struct DocumentStream {
    reader: ReadableStreamDefaultReader,
    splitter: split::Splitter,
    fields: Vec<String>,
    chunk: Vec<u8>,
    offset: usize,
    done: bool,
}

impl DocumentStream {
    /// The next document, or `None` once the result has been read.
    pub async fn next(&mut self) -> Result<Option<QueriedDocument>> {
        loop {
            if let Some(split) = self.splitter.pop() {
                return self.document(split).map(Some);
            }
            if self.offset < self.chunk.len() {
                let end = (self.offset + SPLIT_STEP).min(self.chunk.len());
                self.splitter.push(&self.chunk[self.offset..end]);
                self.offset = end;
                continue;
            }
            if self.done {
                return Ok(None);
            }
            let result = JsFuture::from(self.reader.read()).await.map_err(Error::network)?;
            if Reflect::get(&result, &"done".into()).map_or(true, |done| done.is_truthy()) {
                self.done = true;
                self.splitter.finish().map_err(|message| Error { status: None, message: message.into() })?;
                continue;
            }
            let value: Uint8Array = Reflect::get(&result, &"value".into()).map_err(Error::network)?.unchecked_into();
            self.chunk.resize(value.length() as usize, 0);
            value.copy_to(&mut self.chunk);
            self.offset = 0;
        }
    }

    fn document(&self, split: split::Split) -> Result<QueriedDocument> {
        let utf8 =
            |bytes: Vec<u8>| String::from_utf8(bytes).map_err(|err| Error { status: None, message: err.to_string() });
        let fields = split
            .fields
            .into_iter()
            .filter_map(|(index, raw)| Some((self.fields[index].clone(), serde_json::from_slice(&raw).ok()?)))
            .collect();
        Ok(QueriedDocument { json: split.json.map(utf8).transpose()?, len: split.len, fields })
    }
}

impl Drop for DocumentStream {
    fn drop(&mut self) {
        if !self.done {
            let _ = self.reader.cancel();
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AssetKind {
    Image,
    File,
}

impl AssetKind {
    /// The `_type` of the asset documents.
    pub fn document_type(self) -> &'static str {
        match self {
            AssetKind::Image => "sanity.imageAsset",
            AssetKind::File => "sanity.fileAsset",
        }
    }
}

#[derive(Clone)]
pub struct Client {
    config: Rc<Config>,
}

impl Client {
    pub fn new(config: Config) -> Client {
        Client { config: Rc::new(config) }
    }

    pub fn config(&self) -> &Config {
        &self.config
    }

    pub fn with_token(&self, token: Option<String>) -> Client {
        Client::new(Config { token, ..(*self.config).clone() })
    }

    fn url<K: AsRef<str>, V: AsRef<str>>(&self, path: &str, query: impl IntoIterator<Item = (K, V)>) -> String {
        let params = UrlSearchParams::new().unwrap();
        for (key, value) in query {
            params.append(key.as_ref(), value.as_ref());
        }
        let query = String::from(params.to_string());
        format!(
            "https://{}.{}/v{API_VERSION}{path}{}{query}",
            self.config.project_id,
            self.config.api_host,
            if query.is_empty() { "" } else { "?" }
        )
    }

    fn data_url<K: AsRef<str>, V: AsRef<str>>(
        &self,
        endpoint: &str,
        query: impl IntoIterator<Item = (K, V)>,
    ) -> String {
        self.url(&format!("/data/{endpoint}/{}", self.config.dataset), query)
    }

    fn tag(&self, tag: &str) -> (&'static str, String) {
        ("tag", format!("{}.{tag}", self.config.request_tag_prefix))
    }

    fn init(&self, method: &str, body: Option<&Value>, signal: Option<&AbortSignal>) -> RequestInit {
        let body = body.map(|body| (JsValue::from_str(&body.to_string()), "application/json".to_owned()));
        self.init_with(method, body, signal)
    }

    fn init_with(&self, method: &str, body: Option<(JsValue, String)>, signal: Option<&AbortSignal>) -> RequestInit {
        let headers = Headers::new().unwrap();
        if let Some(token) = &self.config.token {
            headers.set("Authorization", &format!("Bearer {token}")).unwrap();
        }
        let init = RequestInit::new();
        init.set_method(method);
        if let Some((body, content_type)) = body {
            if !content_type.is_empty() {
                headers.set("Content-Type", &content_type).unwrap();
            }
            init.set_body(&body);
        }
        init.set_headers(&headers);
        init.set_credentials(if self.config.token.is_some() {
            RequestCredentials::Omit
        } else {
            RequestCredentials::Include
        });
        init.set_signal(signal);
        init
    }

    async fn fetch(&self, url: &str, init: &RequestInit) -> Result<Response> {
        let window = web_sys::window().expect("window");
        let response = JsFuture::from(window.fetch_with_str_and_init(url, init)).await.map_err(Error::network)?;
        let response: Response = response.unchecked_into();
        if response.ok() {
            return Ok(response);
        }
        let status = response.status();
        let text = read_text(&response).await.unwrap_or_default();
        let message = serde_json::from_str::<Value>(&text)
            .ok()
            .and_then(|body| {
                let error = body.get("error").unwrap_or(&body);
                error
                    .get("description")
                    .or_else(|| error.get("message"))
                    .or_else(|| body.get("message"))
                    .and_then(Value::as_str)
                    .map(str::to_owned)
                    .or_else(|| error.as_str().map(str::to_owned))
            })
            .unwrap_or_else(|| format!("Request failed with status {status}"));
        Err(Error { status: Some(status), message })
    }

    async fn request(&self, method: &str, url: &str, body: Option<&Value>) -> Result<Value> {
        let text = self.request_text(method, url, body).await?;
        serde_json::from_str(&text).map_err(|err| Error { status: None, message: err.to_string() })
    }

    async fn request_text(&self, method: &str, url: &str, body: Option<&Value>) -> Result<String> {
        read_text(&self.request_response(method, url, body).await?).await
    }

    async fn request_response(&self, method: &str, url: &str, body: Option<&Value>) -> Result<Response> {
        // Like `@sanity/client`: reads and queries are retried when the request was rate limited,
        // an upstream service hiccuped, or the network failed, with a growing, jittered delay.
        let retriable = method == "GET" || method == "HEAD" || url.contains("/data/query/");
        let mut attempt = 0;
        loop {
            match self.fetch(url, &self.init(method, body, None)).await {
                Ok(response) => return Ok(response),
                Err(err) if retriable && attempt < MAX_RETRIES && err.is_retriable() => {
                    sleep(retry_delay(attempt)).await;
                    attempt += 1;
                }
                Err(err) => return Err(err),
            }
        }
    }

    /// Runs a GROQ query and returns its `result`, in the `raw` perspective so drafts and
    /// published documents both come back.
    pub async fn query(&self, groq: &str, params: &Map<String, Value>, tag: &str) -> Result<Value> {
        self.query_in("raw", groq, params, tag).await
    }

    /// Runs a GROQ query in a perspective: `drafts` returns each document once, with its draft
    /// (when there is one) merged over the published version under the published id.
    pub async fn query_in(
        &self,
        perspective: &str,
        groq: &str,
        params: &Map<String, Value>,
        tag: &str,
    ) -> Result<Value> {
        let text = self.query_text(perspective, groq, params, tag).await?;
        let mut response: Value =
            serde_json::from_str(&text).map_err(|err| Error { status: None, message: err.to_string() })?;
        Ok(response.get_mut("result").map(Value::take).unwrap_or(Value::Null))
    }

    /// Runs a GROQ query and returns the response body as it arrived, `{"result": …, "ms": …}`,
    /// for callers that keep parts of the result as JSON text.
    pub async fn query_text(
        &self,
        perspective: &str,
        groq: &str,
        params: &Map<String, Value>,
        tag: &str,
    ) -> Result<String> {
        read_text(&self.query_response(perspective, groq, params, tag).await?).await
    }

    /// Runs a GROQ query whose result is an array of documents, and reads the documents as the
    /// response arrives: each with the top-level `fields` asked for, and as its JSON when it is no
    /// longer than `limit` bytes. Neither the response nor a document longer than the limit is
    /// ever held whole.
    pub async fn query_documents(
        &self,
        perspective: &str,
        groq: &str,
        params: &Map<String, Value>,
        tag: &str,
        limit: usize,
        fields: &[&str],
    ) -> Result<DocumentStream> {
        let response = self.query_response(perspective, groq, params, tag).await?;
        let body = response.body().ok_or_else(|| Error { status: None, message: "Response has no body".into() })?;
        Ok(DocumentStream {
            reader: body.get_reader().unchecked_into(),
            splitter: split::Splitter::new(limit, fields),
            fields: fields.iter().map(|field| (*field).to_owned()).collect(),
            chunk: Vec::new(),
            offset: 0,
            done: false,
        })
    }

    async fn query_response(
        &self,
        perspective: &str,
        groq: &str,
        params: &Map<String, Value>,
        tag: &str,
    ) -> Result<Response> {
        let (tag_key, tag) = self.tag(tag);
        let mut query = vec![("query".to_owned(), groq.to_owned()), ("perspective".into(), perspective.to_owned())];
        query.extend(params.iter().map(|(key, value)| (format!("${key}"), value.to_string())));
        query.push((tag_key.into(), tag.clone()));
        let url = self.data_url("query", query);
        if url.len() > 11_000 {
            // The body only takes the query and its params; options stay in the URL.
            let body = json!({"query": groq, "params": params});
            let url = self.data_url("query", [("perspective", perspective), (tag_key, tag.as_str())]);
            self.request_response("POST", &url, Some(&body)).await
        } else {
            self.request_response("GET", &url, None).await
        }
    }

    /// Fetches documents by id, in the order given, `None` for those that do not exist.
    pub async fn get_documents(&self, ids: &[String], tag: &str) -> Result<Vec<Option<Value>>> {
        if ids.is_empty() {
            return Ok(Vec::new());
        }
        let path = format!("/data/doc/{}/{}", self.config.dataset, ids.join(","));
        let url = self.url(&path, [self.tag(tag)]);
        let response = self.request("GET", &url, None).await?;
        let documents = response.get("documents").and_then(Value::as_array).cloned().unwrap_or_default();
        Ok(ids
            .iter()
            .map(|id| documents.iter().find(|doc| doc.get("_id").and_then(Value::as_str) == Some(id)).cloned())
            .collect())
    }

    /// Commits mutations as one transaction.
    pub async fn mutate(&self, mutations: Vec<Value>, transaction_id: &str, tag: &str) -> Result<Value> {
        let body = json!({"mutations": mutations, "transactionId": transaction_id});
        let url = self.data_url(
            "mutate",
            [
                ("returnIds", "true".to_owned()),
                ("visibility", "async".to_owned()),
                ("autoGenerateArrayKeys", "true".to_owned()),
                self.tag(tag),
            ],
        );
        self.request("POST", &url, Some(&body)).await
    }

    /// Runs document actions (`sanity.action.document.publish`, …) as one transaction.
    pub async fn actions(&self, actions: Vec<Value>, transaction_id: &str, tag: &str) -> Result<Value> {
        let body = json!({"actions": actions, "transactionId": transaction_id});
        self.request("POST", &self.data_url("actions", [self.tag(tag)]), Some(&body)).await
    }

    /// Uploads a file as an image or file asset and returns the asset document. Uploading the
    /// same bytes again returns the existing asset.
    pub async fn upload_asset(&self, kind: AssetKind, file: &web_sys::File, tag: &str) -> Result<Value> {
        let endpoint = match kind {
            AssetKind::Image => "images",
            AssetKind::File => "files",
        };
        let path = format!("/assets/{endpoint}/{}", self.config.dataset);
        let (tag_key, tag) = self.tag(tag);
        let url = self.url(&path, [("filename", file.name()), (tag_key, tag)]);
        let init = self.init_with("POST", Some((file.clone().into(), file.type_())), None);
        let response = self.fetch(&url, &init).await?;
        let text = read_text(&response).await?;
        let body: Value =
            serde_json::from_str(&text).map_err(|err| Error { status: None, message: err.to_string() })?;
        body.get("document")
            .cloned()
            .ok_or_else(|| Error { status: None, message: "The upload did not return an asset".into() })
    }

    /// The latest transactions that touched any of `ids`, newest first, without their content,
    /// like the JS studio's history timeline asks for them.
    pub async fn history_transactions(&self, ids: &[String], limit: usize, tag: &str) -> Result<Vec<Value>> {
        let path = format!("/data/history/{}/transactions/{}", self.config.dataset, ids.join(","));
        let url = self.url(
            &path,
            [
                ("excludeContent", "true".to_owned()),
                ("includeIdentifiedDocumentsOnly", "true".to_owned()),
                ("reverse", "true".to_owned()),
                ("limit", limit.to_string()),
                self.tag(tag),
            ],
        );
        let response = self.fetch(&url, &self.init("GET", None, None)).await?;
        let text = read_text(&response).await?;
        Ok(text.lines().filter_map(|line| serde_json::from_str(line).ok()).collect())
    }

    /// The document `id` as the transaction `revision` left it.
    pub async fn history_document(&self, id: &str, revision: &str, tag: &str) -> Result<Option<Value>> {
        let path = format!("/data/history/{}/documents/{id}", self.config.dataset);
        let url = self.url(&path, [("revision", revision.to_owned()), self.tag(tag)]);
        let response = self.request("GET", &url, None).await?;
        Ok(response.pointer("/documents/0").cloned())
    }

    /// The add-on dataset that holds the comments (and tasks) of the client's dataset, found the
    /// way the JS studio finds it: by its `comments` profile and the dataset it is an add-on for.
    pub async fn addon_dataset(&self) -> Result<Option<String>> {
        let query = [("datasetProfile", "comments".to_owned()), ("addonFor", self.config.dataset.clone())];
        let url = self.url(&format!("/projects/{}/datasets", self.config.project_id), query);
        let datasets = self.request("GET", &url, None).await?;
        Ok(datasets.pointer("/0/name").and_then(Value::as_str).map(str::to_owned))
    }

    /// Sets up the add-on dataset of the client's dataset and returns its name.
    pub async fn setup_addon_dataset(&self) -> Result<Option<String>> {
        let url = self.url(&format!("/comments/{}/setup", self.config.dataset), NO_QUERY);
        let response = self.request("POST", &url, None).await?;
        Ok(response.get("datasetName").and_then(Value::as_str).map(str::to_owned))
    }

    /// A client for another dataset of the project, eg the comments add-on dataset.
    pub fn with_dataset(&self, dataset: &str) -> Client {
        Client::new(Config { dataset: dataset.to_owned(), ..(*self.config).clone() })
    }

    pub async fn current_user(&self) -> Result<Option<Value>> {
        match self.request("GET", &self.url("/users/me", [self.tag("users.get-current")]), None).await {
            Ok(user) if user.get("id").is_some() => Ok(Some(user)),
            Ok(_) => Ok(None),
            Err(err) if err.is_unauthorized() => Ok(None),
            Err(err) => Err(err),
        }
    }

    /// The public profiles of users by id, as `@sanity/client` `users.getById` returns them.
    pub async fn users(&self, ids: &[String]) -> Result<Vec<Value>> {
        if ids.is_empty() {
            return Ok(Vec::new());
        }
        let url = self.url(&format!("/users/{}", ids.join(",")), [self.tag("users.get")]);
        Ok(match self.request("GET", &url, None).await? {
            Value::Array(users) => users,
            Value::Null => Vec::new(),
            user => vec![user],
        })
    }

    pub async fn auth_providers(&self) -> Result<Value> {
        self.request("GET", &self.url("/auth/providers", NO_QUERY), None).await
    }

    /// Exchanges the session id a login redirect returns (`#sid=`) for a token.
    pub async fn exchange_session_id(&self, sid: &str) -> Result<String> {
        let response = self.request("GET", &self.url("/auth/fetch", [("sid", sid)]), None).await?;
        response
            .get("token")
            .and_then(Value::as_str)
            .map(str::to_owned)
            .ok_or_else(|| Error { status: None, message: "Login did not return a token".into() })
    }

    pub async fn logout(&self) -> Result<()> {
        self.request("POST", &self.url("/auth/logout", NO_QUERY), None).await.map(|_| ())
    }

    pub fn login_url(&self, provider_url: &str, origin: &str) -> String {
        let url = web_sys::Url::new(provider_url).unwrap();
        let params = url.search_params();
        params.set("origin", origin);
        params.set("projectId", &self.config.project_id);
        // `type=token` would hand the session id back in the query, which reaches server logs.
        params.set("withSid", "true");
        url.href()
    }

    pub fn listen(
        &self,
        query: &str,
        params: Map<String, Value>,
        options: ListenOptions,
        on_event: impl Fn(ListenEvent) + 'static,
    ) -> Listener {
        listen::start(self.clone(), query.to_owned(), params, options, Rc::new(on_event))
    }

    pub fn asset_url(&self, asset_ref: &str) -> Option<String> {
        // `image-<hash>-<w>x<h>-<ext>` / `file-<hash>-<ext>`
        let mut parts = asset_ref.split('-');
        let kind = parts.next()?;
        let rest: Vec<&str> = parts.collect();
        let (folder, name) = match (kind, rest.as_slice()) {
            ("image", [hash, size, ext]) => ("images", format!("{hash}-{size}.{ext}")),
            ("file", [hash, ext]) => ("files", format!("{hash}.{ext}")),
            _ => return None,
        };
        Some(format!("https://cdn.sanity.io/{folder}/{}/{}/{name}", self.config.project_id, self.config.dataset))
    }
}

async fn read_text(response: &Response) -> Result<String> {
    let text = JsFuture::from(response.text().map_err(Error::network)?).await.map_err(Error::network)?;
    Ok(text.as_string().unwrap_or_default())
}

/// Reads a response body chunk by chunk, calling `on_chunk` for each. Returns when the stream
/// ends or the request is aborted.
async fn read_chunks(response: &Response, mut on_chunk: impl FnMut(&[u8])) -> Result<()> {
    let body = response.body().ok_or_else(|| Error { status: None, message: "Response has no body".into() })?;
    let reader: ReadableStreamDefaultReader = body.get_reader().unchecked_into();
    loop {
        let result = JsFuture::from(reader.read()).await.map_err(Error::network)?;
        let done = Reflect::get(&result, &"done".into()).map(|d| d.is_truthy()).unwrap_or(true);
        if done {
            return Ok(());
        }
        if let Ok(value) = Reflect::get(&result, &"value".into()) {
            on_chunk(&value.unchecked_into::<Uint8Array>().to_vec());
        }
    }
}
