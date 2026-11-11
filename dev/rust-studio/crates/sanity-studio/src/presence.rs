//! Presence, compatible with the JS studio's presence store (`createPresenceStore` over
//! `@sanity/bifur-client`), so Rust and JS sessions see each other: the same socket methods
//! (`presence_rollcall`, `presence_announce`), the same session id storage, the same location
//! format (`{type: "document", documentId, path, lastActiveAt, selection?}`, with a Portable Text
//! selection in `@portabletext/editor`'s point format) and the same user colors.

use std::cell::{Cell, RefCell};
use std::collections::{HashMap, HashSet};
use std::rc::Rc;

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::bifur::{Socket, SocketEvent};
use sanity_client::{Client, sleep};
use sanity_color::Hue;
use sanity_mutator::{Path, path};
use serde_json::{Value, json};

use crate::auth::User;
use crate::util::{now_ms, published_id, session_storage};

const SESSION_KEY: &str = "presence_session_id";
/// The JS store reports at least this often, so other sessions can tell it is still there.
const REPORT_INTERVAL_MS: u32 = 30_000;
/// Like the JS form, which throttles focus changes to one a second and reports 200 ms later.
const REPORT_MIN_GAP_MS: f64 = 1000.0;
const REPORT_DELAY_MS: u32 = 200;

#[derive(Clone, Debug, PartialEq)]
pub struct Location {
    pub document_id: String,
    pub path: Path,
    pub selection: Option<Value>,
}

impl Location {
    fn from_json(value: &Value) -> Option<Location> {
        if value.get("type").and_then(Value::as_str) != Some("document") {
            return None;
        }
        Some(Location {
            document_id: value.get("documentId")?.as_str()?.to_owned(),
            path: value.get("path").and_then(path::from_json).unwrap_or_default(),
            selection: value.get("selection").filter(|selection| selection.is_object()).cloned(),
        })
    }

    fn to_json(&self, last_active_at: &str) -> Value {
        let mut value = json!({
            "type": "document",
            "documentId": self.document_id,
            "path": path::to_json(&self.path),
            "lastActiveAt": last_active_at,
        });
        if let Some(selection) = &self.selection {
            value["selection"] = selection.clone();
        }
        value
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Session {
    pub session_id: String,
    pub user_id: String,
    pub locations: Vec<Location>,
}

/// Someone else at a location in a document.
#[derive(Clone, Debug, PartialEq)]
pub struct Present {
    pub session_id: String,
    pub user: User,
    pub hue: Hue,
    pub location: Location,
}

pub struct Presence {
    session_id: String,
    socket: RefCell<Option<Socket>>,
    client: RefCell<Option<Client>>,
    current_user: RefCell<Option<String>>,
    /// Other sessions, by session id. Sessions of this user in other tabs count as others.
    sessions: ArcRwSignal<HashMap<String, Session>>,
    users: ArcRwSignal<HashMap<String, User>>,
    requested: RefCell<HashSet<String>>,
    location: RefCell<Vec<Location>>,
    report_scheduled: Cell<bool>,
    last_report: Cell<f64>,
    /// Whether the socket is connected, for the navbar.
    pub connected: ArcRwSignal<bool>,
}

thread_local! {
    static PRESENCE: Rc<Presence> = Rc::new(Presence {
        session_id: session_id(),
        socket: RefCell::new(None),
        client: RefCell::new(None),
        current_user: RefCell::new(None),
        sessions: ArcRwSignal::new(HashMap::new()),
        users: ArcRwSignal::new(HashMap::new()),
        requested: RefCell::new(HashSet::new()),
        location: RefCell::new(Vec::new()),
        report_scheduled: Cell::new(false),
        last_report: Cell::new(f64::NEG_INFINITY),
        connected: ArcRwSignal::new(false),
    });
}

pub fn presence() -> Rc<Presence> {
    PRESENCE.with(Rc::clone)
}

/// The session id of this tab, shared with the JS studio when both run in it.
fn session_id() -> String {
    let storage = session_storage();
    if let Some(id) = storage.as_ref().and_then(|storage| storage.get_item(SESSION_KEY).ok().flatten()) {
        return id;
    }
    let id = sanity_client::random_key(16);
    if let Some(storage) = storage {
        let _ = storage.set_item(SESSION_KEY, &id);
    }
    id
}

/// The hues users get, `@sanity/color`'s `COLOR_HUES` without green and red (which read as
/// added and removed) and gray (which reads as no color).
const USER_HUES: [Hue; 6] = [Hue::Blue, Hue::Purple, Hue::Magenta, Hue::Orange, Hue::Yellow, Hue::Cyan];

/// The color the JS studio's user color manager prefers for a user: purple for the current user,
/// a hash of the id into [`USER_HUES`] for everyone else.
pub fn user_hue(user_id: &str, current_user: Option<&str>) -> Hue {
    if Some(user_id) == current_user {
        return Hue::Purple;
    }
    let hash = user_id.encode_utf16().fold(0i32, |hash, unit| (hash << 5).wrapping_sub(hash).wrapping_add(unit as i32));
    USER_HUES[(hash.unsigned_abs() as usize) % USER_HUES.len()]
}

fn user_from_profile(value: &Value) -> Option<User> {
    let text = |key: &str| value.get(key).and_then(Value::as_str).filter(|text| !text.is_empty()).map(str::to_owned);
    Some(User {
        id: text("id")?,
        name: text("displayName").or_else(|| text("name")).unwrap_or_else(|| "Unknown user".into()),
        email: text("email"),
        image: text("imageUrl").or_else(|| text("profileImage")),
    })
}

impl Presence {
    /// Connects once the user is signed in.
    pub fn start(&self, client: Client, user: &User) {
        if self.socket.borrow().is_some() {
            return;
        }
        *self.current_user.borrow_mut() = Some(user.id.clone());
        self.users.update(|users| {
            users.insert(user.id.clone(), user.clone());
        });
        let socket = Socket::subscribe(&client, "presence", |event| presence().on_event(event));
        *self.client.borrow_mut() = Some(client);
        *self.socket.borrow_mut() = Some(socket);
        spawn_local(async {
            loop {
                sleep(REPORT_INTERVAL_MS).await;
                presence().report();
            }
        });
    }

    fn on_event(&self, event: SocketEvent) {
        match event {
            SocketEvent::Connected => {
                self.connected.set(true);
                self.sessions.set(HashMap::new());
                self.send("presence_rollcall", json!({"session": self.session_id}));
                self.report();
            }
            SocketEvent::Disconnected => {
                self.connected.set(false);
                self.sessions.set(HashMap::new());
            }
            SocketEvent::Message(message) => self.on_message(&message),
        }
    }

    fn on_message(&self, message: &Value) {
        let user_id = message.get("i").and_then(Value::as_str).unwrap_or_default().to_owned();
        match message.get("type").and_then(Value::as_str) {
            Some("rollCall") => {
                if message.get("session").and_then(Value::as_str) != Some(self.session_id.as_str()) {
                    self.report();
                }
            }
            Some("state") => {
                let Some(state) = message.get("m") else { return };
                let Some(session_id) = state.get("sessionId").and_then(Value::as_str) else { return };
                if session_id == self.session_id {
                    return;
                }
                let locations = state
                    .get("locations")
                    .and_then(Value::as_array)
                    .map(|locations| locations.iter().filter_map(Location::from_json).collect())
                    .unwrap_or_default();
                let session = Session { session_id: session_id.to_owned(), user_id: user_id.clone(), locations };
                self.sessions.update(|sessions| {
                    sessions.insert(session.session_id.clone(), session);
                });
                self.load_user(user_id);
            }
            Some("disconnect") => {
                let Some(session_id) = message.pointer("/m/session").and_then(Value::as_str) else { return };
                if self.sessions.with_untracked(|sessions| sessions.contains_key(session_id)) {
                    self.sessions.update(|sessions| {
                        sessions.remove(session_id);
                    });
                }
            }
            _ => {}
        }
    }

    fn load_user(&self, user_id: String) {
        if !self.requested.borrow_mut().insert(user_id.clone()) {
            return;
        }
        let Some(client) = self.client.borrow().clone() else { return };
        spawn_local(async move {
            let Ok(profiles) = client.users(std::slice::from_ref(&user_id)).await else { return };
            let users: Vec<User> = profiles.iter().filter_map(user_from_profile).collect();
            presence().users.update(|known| {
                for user in users {
                    known.insert(user.id.clone(), user);
                }
            });
        });
    }

    /// The profile of `user_id`, tracked, fetched the first time it is asked for.
    pub fn user(&self, user_id: &str) -> Option<User> {
        let user = self.users.with(|users| users.get(user_id).cloned());
        if user.is_none() && !user_id.is_empty() {
            self.load_user(user_id.to_owned());
        }
        user
    }

    pub fn hue(&self, user_id: &str) -> Hue {
        user_hue(user_id, self.current_user.borrow().as_deref())
    }

    pub fn current_user_id(&self) -> Option<String> {
        self.current_user.borrow().clone()
    }

    fn send(&self, method: &str, params: Value) {
        if let Some(socket) = self.socket.borrow().as_ref() {
            socket.send(method, params);
        }
    }

    /// Announces this session's locations now.
    fn report(&self) {
        self.last_report.set(now_ms());
        let now = sanity_client::now_iso();
        let locations: Vec<Value> = self.location.borrow().iter().map(|location| location.to_json(&now)).collect();
        self.send("presence_announce", json!({"data": {"locations": locations, "sessionId": self.session_id}}));
    }

    fn schedule_report(&self) {
        if self.report_scheduled.replace(true) {
            return;
        }
        let wait = (self.last_report.get() + REPORT_MIN_GAP_MS - now_ms()).max(REPORT_DELAY_MS as f64);
        spawn_local(async move {
            sleep(wait as u32).await;
            let presence = presence();
            presence.report_scheduled.set(false);
            presence.report();
        });
    }

    /// Where this session is: a document, the path of the field in focus (empty for the document
    /// itself) and the Portable Text selection when the focus is in an editor.
    pub fn set_location(&self, document_id: &str, path: Path, selection: Option<Value>) {
        let location = Location { document_id: document_id.to_owned(), path, selection };
        if self.location.borrow().as_slice() == std::slice::from_ref(&location) {
            return;
        }
        *self.location.borrow_mut() = vec![location];
        self.schedule_report();
    }

    /// Leaves the document, when its pane closes.
    pub fn leave(&self, document_id: &str) {
        let here = self.location.borrow().iter().any(|location| published_id(&location.document_id) == document_id);
        if here {
            self.location.borrow_mut().clear();
            self.schedule_report();
        }
    }

    /// Everyone else in the document `published` (its draft, published version or a version in a
    /// release), tracked. Sessions whose user profile hasn't loaded wait for it, like the JS store
    /// leaves out sessions without a user.
    pub fn in_document(&self, published: &str) -> Vec<Present> {
        let current = self.current_user.borrow().clone();
        let users = self.users.get();
        self.sessions.with(|sessions| {
            let mut present: Vec<Present> = sessions
                .values()
                .flat_map(|session| {
                    let user = users.get(&session.user_id).cloned();
                    let current = current.clone();
                    session
                        .locations
                        .iter()
                        .filter(|location| published_id(&location.document_id) == published)
                        .filter_map(move |location| {
                            let user = user.clone()?;
                            Some(Present {
                                session_id: session.session_id.clone(),
                                hue: user_hue(&user.id, current.as_deref()),
                                user,
                                location: location.clone(),
                            })
                        })
                })
                .collect();
            present.sort_by(|a, b| a.session_id.cmp(&b.session_id));
            present
        })
    }
}

/// Where the focus is in a document pane: the path of the field and, in a Portable Text editor,
/// the selection. The pane reports it; the editor sets it on selection changes.
#[derive(Clone, Copy)]
pub struct PaneFocus(pub RwSignal<(Path, Option<Value>)>);

/// The other sessions in the field at `path` of the document `published`: anywhere inside it, or
/// only at the field itself for an object, whose fields show their own.
pub fn in_field(published: &str, path: &Path, exact: bool) -> Vec<Present> {
    presence()
        .in_document(published)
        .into_iter()
        .filter(|present| if exact { &present.location.path == path } else { present.location.path.starts_with(path) })
        .collect()
}

/// The id a form edits, which presence reports: the `_id` of the value it shows (the draft, the
/// published document or a version), or the draft of a new document.
pub fn edited_id(doc: &Option<Value>, published: &str) -> String {
    doc.as_ref()
        .and_then(|doc| doc.get("_id"))
        .and_then(Value::as_str)
        .map(str::to_owned)
        .unwrap_or_else(|| crate::util::draft_id(published))
}

/// Overlapping avatars of the users present, at most `max` and a count of the rest, like the JS
/// studio's `AvatarStack`.
#[component]
pub fn PresenceAvatars(
    #[prop(into)] present: Signal<Vec<Present>>,
    #[prop(optional)] size: Option<usize>,
) -> impl IntoView {
    const MAX: usize = 3;
    let users = Memo::new(move |_| {
        let mut seen = HashSet::new();
        present
            .get()
            .into_iter()
            .filter(|present| seen.insert(present.user.id.clone()))
            .map(|present| (present.user, present.hue))
            .collect::<Vec<_>>()
    });
    move || {
        let users = users.get();
        if users.is_empty() {
            return ().into_any();
        }
        let rest = users.len().saturating_sub(MAX);
        let size = size.unwrap_or(0);
        view! {
            <div data-testid="presence-avatars" style="display: flex; align-items: center; flex: none;">
                {users
                    .into_iter()
                    .take(MAX)
                    .enumerate()
                    .map(|(index, (user, hue))| {
                        let margin = if index == 0 { "" } else { "margin-left: -4px;" };
                        view! {
                            <div style=margin data-presence-user=user.id.clone()>
                                <sanity_ui::prelude::Avatar
                                    src=user.image.clone()
                                    initials=user.initials()
                                    hue=hue
                                    size=size
                                    title=user.name.clone()
                                />
                            </div>
                        }
                    })
                    .collect_view()}
                {(rest > 0).then(|| view! {
                    <span style="margin-left: 4px; font-size: 0.6875rem; color: var(--card-muted-fg-color);">{format!("+{rest}")}</span>
                })}
            </div>
        }
        .into_any()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn picks_the_colors_the_js_studio_prefers() {
        // getPreferredHue in the JS user color manager: `((hash << 5) - hash + code) | 0` over the
        // UTF-16 code units, then `Math.abs(hash) % 6`.
        let js = |id: &str| {
            let mut hash: i32 = 0;
            for unit in id.encode_utf16() {
                hash = (hash << 5).wrapping_sub(hash).wrapping_add(unit as i32);
            }
            USER_HUES[(hash.unsigned_abs() as usize) % 6]
        };
        for id in ["pZyoPHKUs", "p8xDvUMxC", "g2e5yZp0Q", "x"] {
            assert_eq!(user_hue(id, None), js(id));
        }
        assert_eq!(user_hue("me", Some("me")), Hue::Purple);
        // "a" hashes to 97, 97 % 6 = 1
        assert_eq!(user_hue("a", None), Hue::Purple);
        assert_eq!(user_hue("b", None), Hue::Magenta);
    }

    #[test]
    fn takes_initials_like_the_js_avatar() {
        let user = |name: &str| User { id: "x".into(), name: name.into(), email: None, image: None };
        assert_eq!(user("cursor-cloud-agent-for-test-studio (Robot)").initials(), "CR");
        assert_eq!(user("Ada Byron Lovelace").initials(), "AL");
        assert_eq!(user("Cher").initials(), "C");
    }

    #[test]
    fn reads_and_writes_js_locations() {
        let wire = json!({
            "type": "document",
            "documentId": "drafts.a",
            "path": ["body", {"_key": "b1"}, "children", {"_key": "s1"}, "text"],
            "lastActiveAt": "2026-01-01T00:00:00.000Z",
            "selection": {"anchor": {"path": [{"_key": "b1"}, "children", {"_key": "s1"}], "offset": 3}, "focus": {"path": [{"_key": "b1"}, "children", {"_key": "s1"}], "offset": 3}, "backward": false}
        });
        let location = Location::from_json(&wire).unwrap();
        assert_eq!(location.document_id, "drafts.a");
        assert_eq!(path::to_string(&location.path), "body[_key==\"b1\"].children[_key==\"s1\"].text");
        assert_eq!(location.to_json("2026-01-01T00:00:00.000Z"), wire);
        assert_eq!(Location::from_json(&json!({"type": "other"})), None);
    }
}
