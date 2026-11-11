//! Port of the parts of `@sanity/bifur-client` presence uses: a JSON-RPC 2.0 WebSocket to
//! `/socket/<dataset>`, authorized with the token, that reconnects with backoff and resubscribes.
//! Requests are fire and forget, like the JS studio's presence requests; a request made while the
//! socket is down is dropped, and [`SocketEvent::Connected`] tells the caller to send its state
//! again.

use std::cell::RefCell;
use std::rc::{Rc, Weak};

use serde_json::{Value, json};
use wasm_bindgen::JsCast;
use wasm_bindgen::closure::Closure;
use web_sys::{CloseEvent, MessageEvent, WebSocket};

use crate::{Client, random_key};

const API_VERSION: &str = "2022-06-30";

#[derive(Clone, Debug, PartialEq)]
pub enum SocketEvent {
    /// The socket is open and authorized, and the subscription is requested.
    Connected,
    /// A message of the subscription: `{"type": "state" | "disconnect" | "rollCall", …}`.
    Message(Value),
    Disconnected,
}

struct Inner {
    url: String,
    token: Option<String>,
    /// The method subscribed to, `presence` for `presence_subscribe`.
    method: &'static str,
    ws: Option<WebSocket>,
    ready: bool,
    auth_request: Option<String>,
    subscribe_request: Option<String>,
    subscription: Option<Value>,
    retries: u32,
    closed: bool,
    on_event: Rc<dyn Fn(SocketEvent)>,
    handlers: Vec<Box<dyn std::any::Any>>,
}

/// Closes the socket when dropped.
pub struct Socket {
    inner: Rc<RefCell<Inner>>,
}

fn request(method: &str, params: Value, id: &str) -> String {
    let mut params = params;
    if let Value::Object(map) = &mut params {
        map.insert("apiVersion".into(), "v1".into());
    }
    json!({"jsonrpc": "2.0", "method": method, "params": params, "id": id}).to_string()
}

impl Socket {
    /// Opens the socket and subscribes to `method`, calling `on_event` for what arrives.
    pub fn subscribe(client: &Client, method: &'static str, on_event: impl Fn(SocketEvent) + 'static) -> Socket {
        let config = client.config();
        let url = format!(
            "wss://{}.{}/v{API_VERSION}/socket/{}?tag={}",
            config.project_id, config.api_host, config.dataset, config.request_tag_prefix
        );
        let inner = Rc::new(RefCell::new(Inner {
            url,
            token: config.token.clone(),
            method,
            ws: None,
            ready: false,
            auth_request: None,
            subscribe_request: None,
            subscription: None,
            retries: 0,
            closed: false,
            on_event: Rc::new(on_event),
            handlers: Vec::new(),
        }));
        connect(&inner);
        Socket { inner }
    }

    /// Sends a request once the socket is ready, and drops it otherwise.
    pub fn send(&self, method: &str, params: Value) {
        let inner = self.inner.borrow();
        if let (true, Some(ws)) = (inner.ready, &inner.ws) {
            let _ = ws.send_with_str(&request(method, params, &random_key(20)));
        }
    }

    pub fn is_ready(&self) -> bool {
        self.inner.borrow().ready
    }
}

impl Drop for Socket {
    fn drop(&mut self) {
        let mut inner = self.inner.borrow_mut();
        inner.closed = true;
        if let Some(ws) = inner.ws.take() {
            if let (true, Some(subscription)) = (inner.ready, inner.subscription.take()) {
                let method = format!("{}_unsubscribe", inner.method);
                let _ = ws.send_with_str(&request(&method, json!({"subscriptionId": subscription}), &random_key(20)));
            }
            ws.set_onopen(None);
            ws.set_onmessage(None);
            ws.set_onclose(None);
            let _ = ws.close_with_code_and_reason(1000, "WebSockets connection closed by client");
        }
        inner.handlers.clear();
    }
}

fn connect(inner: &Rc<RefCell<Inner>>) {
    let url = inner.borrow().url.clone();
    let Ok(ws) = WebSocket::new(&url) else {
        return reconnect(inner);
    };
    let weak = Rc::downgrade(inner);
    let on_open = Closure::<dyn FnMut()>::new({
        let weak = weak.clone();
        move || {
            let Some(inner) = weak.upgrade() else { return };
            let token = inner.borrow().token.clone();
            match token {
                Some(token) => {
                    let id = random_key(20);
                    let message = request("authorization", json!({"authorization": format!("Bearer {token}")}), &id);
                    let mut state = inner.borrow_mut();
                    state.auth_request = Some(id);
                    if let Some(ws) = &state.ws {
                        let _ = ws.send_with_str(&message);
                    }
                }
                None => ready(&inner),
            }
        }
    });
    let on_message = Closure::<dyn FnMut(MessageEvent)>::new({
        let weak = weak.clone();
        move |event: MessageEvent| {
            let Some(inner) = weak.upgrade() else { return };
            let Some(text) = event.data().as_string() else { return };
            if text == "♥" {
                return;
            }
            let Ok(message) = serde_json::from_str::<Value>(&text) else { return };
            on_message(&inner, message);
        }
    });
    let on_close = Closure::<dyn FnMut(CloseEvent)>::new(move |_event: CloseEvent| {
        let Some(inner) = weak.upgrade() else { return };
        let on_event = {
            let mut state = inner.borrow_mut();
            let was_ready = state.ready;
            state.ready = false;
            state.ws = None;
            state.subscription = None;
            was_ready.then(|| state.on_event.clone())
        };
        if let Some(on_event) = on_event {
            on_event(SocketEvent::Disconnected);
        }
        reconnect(&inner);
    });
    ws.set_onopen(Some(on_open.as_ref().unchecked_ref()));
    ws.set_onmessage(Some(on_message.as_ref().unchecked_ref()));
    ws.set_onclose(Some(on_close.as_ref().unchecked_ref()));
    let mut state = inner.borrow_mut();
    state.ws = Some(ws);
    state.handlers = vec![Box::new(on_open), Box::new(on_message), Box::new(on_close)];
}

fn ready(inner: &Rc<RefCell<Inner>>) {
    let on_event = {
        let mut state = inner.borrow_mut();
        state.ready = true;
        state.retries = 0;
        let id = random_key(20);
        let message = request(&format!("{}_subscribe", state.method), json!({}), &id);
        state.subscribe_request = Some(id);
        if let Some(ws) = &state.ws {
            let _ = ws.send_with_str(&message);
        }
        state.on_event.clone()
    };
    on_event(SocketEvent::Connected);
}

fn on_message(inner: &Rc<RefCell<Inner>>, message: Value) {
    let id = message.get("id").and_then(Value::as_str).map(str::to_owned);
    let (auth, subscribe, method) = {
        let state = inner.borrow();
        (state.auth_request.clone(), state.subscribe_request.clone(), state.method)
    };
    if id.is_some() && id == auth {
        inner.borrow_mut().auth_request = None;
        if message.get("error").is_some() {
            // An unauthorized socket stays closed: retrying with the same token can't help.
            inner.borrow_mut().closed = true;
            if let Some(ws) = inner.borrow_mut().ws.take() {
                let _ = ws.close();
            }
            return;
        }
        return ready(inner);
    }
    if id.is_some() && id == subscribe {
        let mut state = inner.borrow_mut();
        state.subscribe_request = None;
        state.subscription = message.get("result").cloned();
        return;
    }
    let subscription_method = format!("{method}_subscription");
    if message.get("method").and_then(Value::as_str) == Some(subscription_method.as_str()) {
        let params = message.get("params");
        let subscription = inner.borrow().subscription.clone();
        if subscription.is_some() && params.and_then(|params| params.get("subscription")) == subscription.as_ref() {
            let result = params.and_then(|params| params.get("result")).cloned().unwrap_or(Value::Null);
            let on_event = inner.borrow().on_event.clone();
            on_event(SocketEvent::Message(result));
        }
    }
}

fn reconnect(inner: &Rc<RefCell<Inner>>) {
    let delay = {
        let mut state = inner.borrow_mut();
        if state.closed {
            return;
        }
        state.retries += 1;
        (1000u32 << (state.retries - 1).min(6)).min(60_000)
    };
    let weak: Weak<RefCell<Inner>> = Rc::downgrade(inner);
    wasm_bindgen_futures::spawn_local(async move {
        crate::sleep(delay).await;
        if let Some(inner) = weak.upgrade()
            && !inner.borrow().closed
        {
            connect(&inner);
        }
    });
}
