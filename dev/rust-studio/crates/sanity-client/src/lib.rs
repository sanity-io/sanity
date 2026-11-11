//! Port of the parts of `@sanity/client` Studio uses, on top of the browser's `fetch`.

mod listen;
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
        let headers = Headers::new().unwrap();
        if let Some(token) = &self.config.token {
            headers.set("Authorization", &format!("Bearer {token}")).unwrap();
        }
        let init = RequestInit::new();
        init.set_method(method);
        if let Some(body) = body {
            headers.set("Content-Type", "application/json").unwrap();
            init.set_body(&JsValue::from_str(&body.to_string()));
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
        let response = self.fetch(url, &self.init(method, body, None)).await?;
        let text = read_text(&response).await?;
        serde_json::from_str(&text).map_err(|err| Error { status: None, message: err.to_string() })
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
        let (tag_key, tag) = self.tag(tag);
        let mut query = vec![("query".to_owned(), groq.to_owned()), ("perspective".into(), perspective.to_owned())];
        query.extend(params.iter().map(|(key, value)| (format!("${key}"), value.to_string())));
        query.push((tag_key.into(), tag.clone()));
        let url = self.data_url("query", query);
        let response = if url.len() > 11_000 {
            // The body only takes the query and its params; options stay in the URL.
            let body = json!({"query": groq, "params": params});
            let url = self.data_url("query", [("perspective", perspective), (tag_key, tag.as_str())]);
            self.request("POST", &url, Some(&body)).await?
        } else {
            self.request("GET", &url, None).await?
        };
        Ok(response.get("result").cloned().unwrap_or(Value::Null))
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

    pub async fn current_user(&self) -> Result<Option<Value>> {
        match self.request("GET", &self.url("/users/me", [self.tag("users.get-current")]), None).await {
            Ok(user) if user.get("id").is_some() => Ok(Some(user)),
            Ok(_) => Ok(None),
            Err(err) if err.is_unauthorized() => Ok(None),
            Err(err) => Err(err),
        }
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
        params.set("type", "token");
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
