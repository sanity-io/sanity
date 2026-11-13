//! The `/data/listen` event stream, read through `fetch` so the token can go in a header.

use std::cell::{Cell, RefCell};
use std::rc::Rc;

use serde_json::{Map, Value};
use wasm_bindgen_futures::spawn_local;
use web_sys::AbortController;

use crate::sse::{SseEvent, SseParser};
use crate::{Client, Error, read_chunks, sleep};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Transition {
    Update,
    Appear,
    Disappear,
}

#[derive(Clone, Debug)]
pub struct MutationEvent {
    pub document_id: String,
    pub transaction_id: String,
    pub transition: Transition,
    /// The document after the transaction, `None` when it disappeared.
    pub result: Option<Value>,
    pub identity: Option<String>,
    pub previous_rev: Option<String>,
    pub result_rev: Option<String>,
    pub timestamp: Option<String>,
    pub mutations: Vec<Value>,
}

impl MutationEvent {
    fn parse(data: &str) -> Option<MutationEvent> {
        let value: Value = serde_json::from_str(data).ok()?;
        let text = |key: &str| value.get(key).and_then(Value::as_str).map(str::to_owned);
        let transition = match value.get("transition").and_then(Value::as_str) {
            Some("appear") => Transition::Appear,
            Some("disappear") => Transition::Disappear,
            _ => Transition::Update,
        };
        Some(MutationEvent {
            document_id: text("documentId")?,
            transaction_id: text("transactionId").unwrap_or_default(),
            result: if transition == Transition::Disappear { None } else { value.get("result").cloned() },
            transition,
            identity: text("identity"),
            previous_rev: text("previousRev"),
            result_rev: text("resultRev"),
            timestamp: text("timestamp"),
            mutations: value.get("mutations").and_then(Value::as_array).cloned().unwrap_or_default(),
        })
    }
}

#[derive(Clone, Debug)]
pub enum ListenEvent {
    /// The stream is open. After a reconnect, events may have been missed, so snapshots taken
    /// before it should be fetched again.
    Welcome {
        reconnected: bool,
    },
    Mutation(Box<MutationEvent>),
    /// The connection dropped and the listener is about to retry.
    Reconnecting,
    /// The listener stopped for good.
    Error(Error),
}

#[derive(Clone)]
pub struct ListenOptions {
    pub include_result: bool,
    /// Also report mutations of release versions (`versions.<release>.<id>`), which the
    /// listener leaves out otherwise, whatever the query matches.
    pub include_all_versions: bool,
    pub tag: String,
}

impl Default for ListenOptions {
    fn default() -> Self {
        ListenOptions { include_result: true, include_all_versions: false, tag: "listen".into() }
    }
}

#[derive(Default)]
struct State {
    stopped: Cell<bool>,
    controller: RefCell<Option<AbortController>>,
}

impl State {
    fn stop(&self) {
        self.stopped.set(true);
        if let Some(controller) = self.controller.borrow_mut().take() {
            controller.abort();
        }
    }
}

/// A running listener; dropping it closes the connection.
pub struct Listener {
    state: Rc<State>,
}

impl Listener {
    pub fn stop(&self) {
        self.state.stop();
    }
}

impl Drop for Listener {
    fn drop(&mut self) {
        self.state.stop();
    }
}

pub(crate) fn start(
    client: Client,
    query: String,
    params: Map<String, Value>,
    options: ListenOptions,
    on_event: Rc<dyn Fn(ListenEvent)>,
) -> Listener {
    let state = Rc::new(State::default());
    spawn_local(run(client, query, params, options, on_event, state.clone()));
    Listener { state }
}

enum Outcome {
    Retry,
    Stop(Option<Error>),
}

async fn run(
    client: Client,
    query: String,
    params: Map<String, Value>,
    options: ListenOptions,
    on_event: Rc<dyn Fn(ListenEvent)>,
    state: Rc<State>,
) {
    let mut attempt: u32 = 0;
    let connected = Cell::new(false);
    loop {
        if state.stopped.get() {
            return;
        }
        let controller = AbortController::new().unwrap();
        *state.controller.borrow_mut() = Some(controller.clone());

        let (tag_key, tag) = client.tag(&options.tag);
        let mut url_query = vec![
            ("query".to_owned(), query.clone()),
            ("includeResult".into(), options.include_result.to_string()),
            ("visibility".into(), "query".into()),
        ];
        if options.include_all_versions {
            url_query.push(("includeAllVersions".into(), "true".into()));
        }
        url_query.extend(params.iter().map(|(key, value)| (format!("${key}"), value.to_string())));
        url_query.push((tag_key.into(), tag));
        let url = client.data_url("listen", url_query);
        let init = client.init("GET", None, Some(&controller.signal()));

        let outcome = match client.fetch(&url, &init).await {
            Ok(response) => {
                let mut parser = SseParser::new();
                let outcome = RefCell::new(Outcome::Retry);
                let handle = |event: SseEvent| match event.event.as_str() {
                    "welcome" => {
                        attempt = 0;
                        on_event(ListenEvent::Welcome { reconnected: connected.replace(true) });
                    }
                    "mutation" => {
                        if let Some(mutation) = MutationEvent::parse(&event.data) {
                            on_event(ListenEvent::Mutation(Box::new(mutation)));
                        }
                    }
                    "channelError" => {
                        let message = serde_json::from_str::<Value>(&event.data)
                            .ok()
                            .and_then(|data| {
                                data.pointer("/error/description")
                                    .or_else(|| data.get("message"))
                                    .and_then(Value::as_str)
                                    .map(str::to_owned)
                            })
                            .unwrap_or_else(|| event.event.clone());
                        *outcome.borrow_mut() = Outcome::Stop(Some(Error { status: None, message }));
                        state.stop();
                    }
                    // The server closes the stream, after a `channelError` or when it is draining;
                    // the latter reconnects like a dropped connection.
                    "disconnect" => controller.abort(),
                    _ => {}
                };
                let mut handle = handle;
                let _ = read_chunks(&response, |chunk| {
                    for event in parser.push(chunk) {
                        handle(event);
                    }
                })
                .await;
                outcome.into_inner()
            }
            Err(err) if matches!(err.status, Some(400..=499)) && err.status != Some(429) => Outcome::Stop(Some(err)),
            Err(_) => Outcome::Retry,
        };

        match outcome {
            Outcome::Stop(error) => {
                state.stop();
                if let Some(error) = error {
                    on_event(ListenEvent::Error(error));
                }
                return;
            }
            Outcome::Retry if state.stopped.get() => return,
            Outcome::Retry => {
                on_event(ListenEvent::Reconnecting);
                sleep((500 * 2u32.pow(attempt.min(5))).min(15_000)).await;
                attempt += 1;
            }
        }
    }
}
