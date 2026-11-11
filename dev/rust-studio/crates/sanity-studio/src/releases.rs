//! Content releases and the perspective the studio shows, like the JS studio's releases plugin:
//! the drafts, the published documents, or a release stacked on the drafts. The perspective is
//! in the URL (`?perspective=published`, `?perspective=<release name>`), as in the JS studio,
//! so links open in the same perspective in both.

use std::cell::RefCell;
use std::rc::Rc;

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::{Client, ListenEvent, ListenOptions, Listener};
use sanity_ui::prelude::*;
use serde_json::{Map, Value, json};

use crate::store::store;

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub enum Perspective {
    #[default]
    Drafts,
    Published,
    Release(String),
}

impl Perspective {
    pub fn parse(param: Option<&str>) -> Perspective {
        match param {
            None | Some("" | "drafts") => Perspective::Drafts,
            Some("published") => Perspective::Published,
            Some(name) => Perspective::Release(name.to_owned()),
        }
    }

    /// The `perspective` URL parameter, none for the drafts.
    pub fn param(&self) -> Option<&str> {
        match self {
            Perspective::Drafts => None,
            Perspective::Published => Some("published"),
            Perspective::Release(name) => Some(name),
        }
    }

    pub fn release(&self) -> Option<&str> {
        match self {
            Perspective::Release(name) => Some(name),
            _ => None,
        }
    }

    /// The perspective queries run in: a release is stacked on the drafts, so documents it
    /// doesn't change show as they are in the drafts.
    pub fn query(&self) -> String {
        match self {
            Perspective::Drafts => "drafts".into(),
            Perspective::Published => "published".into(),
            Perspective::Release(name) => format!("{name},drafts"),
        }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct Release {
    /// The name versions use: `versions.<name>.<id>`.
    pub name: String,
    pub title: String,
    pub release_type: String,
    pub intended_publish_at: Option<String>,
    pub state: String,
}

impl Release {
    fn from_json(value: &Value) -> Option<Release> {
        let text = |pointer: &str| value.pointer(pointer).and_then(Value::as_str).map(str::to_owned);
        Some(Release {
            name: text("/name")?,
            title: text("/metadata/title")
                .filter(|title| !title.is_empty())
                .unwrap_or_else(|| "Untitled release".into()),
            release_type: text("/metadata/releaseType").unwrap_or_else(|| "undecided".into()),
            intended_publish_at: text("/metadata/intendedPublishAt"),
            state: text("/state").unwrap_or_default(),
        })
    }

    /// The tone the JS studio gives a release (`getReleaseTone`).
    pub fn tone(&self) -> StateTone {
        match self.release_type.as_str() {
            "asap" => StateTone::Caution,
            "scheduled" => StateTone::Suggest,
            _ => StateTone::Neutral,
        }
    }

    pub fn type_label(&self) -> String {
        match self.release_type.as_str() {
            "asap" => "ASAP".into(),
            "scheduled" => self
                .intended_publish_at
                .as_deref()
                .map(|at| {
                    let date = js_sys::Date::new(&at.into());
                    String::from(date.to_locale_string("en-US", &js_sys::Object::new()))
                })
                .unwrap_or_else(|| "Scheduled".into()),
            _ => "Undecided".into(),
        }
    }
}

pub struct Releases {
    pub list: ArcRwSignal<Vec<Release>>,
    pub loaded: ArcRwSignal<bool>,
    pub perspective: ArcRwSignal<Perspective>,
    listener: RefCell<Option<Listener>>,
}

thread_local! {
    static RELEASES: Rc<Releases> = Rc::new(Releases {
        list: ArcRwSignal::new(Vec::new()),
        loaded: ArcRwSignal::new(false),
        perspective: ArcRwSignal::new(Perspective::parse(search_param().as_deref())),
        listener: RefCell::new(None),
    });
}

pub fn releases() -> Rc<Releases> {
    RELEASES.with(Rc::clone)
}

/// The current perspective, tracked.
pub fn perspective() -> Perspective {
    releases().perspective.get()
}

fn search_param() -> Option<String> {
    let search = web_sys::window()?.location().search().ok()?;
    web_sys::UrlSearchParams::new_with_str(&search).ok()?.get("perspective")
}

/// Follows the perspective in the URL after a back or forward navigation.
pub fn sync_from_url() {
    let perspective = Perspective::parse(search_param().as_deref());
    let releases = releases();
    if releases.perspective.get_untracked() != perspective {
        releases.perspective.set(perspective);
    }
}

/// `href` with the perspective parameter, which navigation keeps like the JS studio does.
pub fn with_perspective(href: &str) -> String {
    match releases().perspective.get_untracked().param() {
        Some(param) => format!("{href}?perspective={}", js_sys::encode_uri_component(param)),
        None => href.to_owned(),
    }
}

const QUERY: &str =
    r#"*[_type == "system.release" && state in ["active", "scheduled", "scheduling"]] | order(_createdAt asc)"#;

impl Releases {
    pub fn start(&self, client: Client) {
        if self.listener.borrow().is_some() {
            return;
        }
        let options =
            ListenOptions { include_result: false, include_all_versions: false, tag: "releases.listen".into() };
        let listener = client.listen(r#"*[_type == "system.release"]"#, Map::new(), options, |event| {
            if matches!(event, ListenEvent::Welcome { .. } | ListenEvent::Mutation(_)) {
                releases().load();
            }
        });
        *self.listener.borrow_mut() = Some(listener);
    }

    fn load(&self) {
        spawn_local(async {
            let Ok(Value::Array(items)) = store().client().query(QUERY, &Map::new(), "releases.list").await else {
                return;
            };
            let releases = releases();
            releases.list.set(items.iter().filter_map(Release::from_json).collect());
            releases.loaded.set(true);
        });
    }

    pub fn get(&self, name: &str) -> Option<Release> {
        self.list.with(|list| list.iter().find(|release| release.name == name).cloned())
    }

    pub fn set_perspective(&self, perspective: Perspective) {
        if self.perspective.get_untracked() == perspective {
            return;
        }
        self.perspective.set(perspective);
        let location = window().location();
        let href = with_perspective(&location.pathname().unwrap_or_default());
        let _ = window()
            .history()
            .and_then(|history| history.replace_state_with_url(&wasm_bindgen::JsValue::NULL, "", Some(&href)));
    }

    /// Creates a release and switches to it, like the JS studio's "Create release" dialog.
    pub async fn create(&self, title: &str, release_type: &str) -> Option<String> {
        let name = format!("r{}", sanity_client::random_key(8));
        let action = json!({
            "actionType": "sanity.action.release.create",
            "releaseId": name,
            "metadata": {"title": title, "releaseType": release_type},
        });
        let transaction = crate::util::uuid();
        match store().client().actions(vec![action], &transaction, "releases.create").await {
            Ok(_) => Some(name),
            Err(err) => {
                store().error("Could not create the release", err.to_string());
                None
            }
        }
    }
}

/// The dot a release is marked with, in its tone.
#[component]
pub fn ReleaseDot(#[prop(into)] tone: Signal<StateTone>) -> impl IntoView {
    view! {
        <span
            data-ui="ReleaseAvatar"
            style=move || format!(
                "display: inline-block; width: 9px; height: 9px; border-radius: 50%; flex: none; background-color: var(--card-badge-{}-dot-color);",
                tone.get().name()
            )
        ></span>
    }
}

/// The tone of a perspective: positive for the published documents, the drafts' default.
pub fn perspective_tone(perspective: &Perspective) -> StateTone {
    match perspective {
        Perspective::Drafts => StateTone::Default,
        Perspective::Published => StateTone::Positive,
        Perspective::Release(name) => releases().get(name).map_or(StateTone::Neutral, |release| release.tone()),
    }
}

pub fn perspective_title(perspective: &Perspective) -> String {
    match perspective {
        Perspective::Drafts => "Drafts".into(),
        Perspective::Published => "Published".into(),
        Perspective::Release(name) => releases().get(name).map_or_else(|| name.clone(), |release| release.title),
    }
}

/// The navbar's perspective menu: the published documents, the drafts and every open release,
/// plus a button that creates one.
#[component]
pub fn PerspectivePicker() -> impl IntoView {
    let open = RwSignal::new(false);
    let creating = RwSignal::new(false);
    let current = Signal::derive(perspective);
    let menu = move || {
        let item = move |perspective: Perspective, subtitle: Option<String>| {
            let selected = {
                let perspective = perspective.clone();
                Signal::derive(move || current.get() == perspective)
            };
            let tone = perspective_tone(&perspective);
            let title = perspective_title(&perspective);
            let test_id = format!("perspective-{}", perspective.param().unwrap_or("drafts"));
            view! {
                <Card
                    as_="button"
                    radius=2
                    padding=Pad::xy(3, 2)
                    selected=selected
                    attr:data-testid=test_id
                    on_click=Callback::new(move |_| {
                        open.set(false);
                        releases().set_perspective(perspective.clone());
                    })
                >
                    <Flex align="center" gap=3>
                        <ReleaseDot tone=tone />
                        <Stack space=2 flex=1>
                            <Text size=1 weight=FontWeight::Medium>{title}</Text>
                            {subtitle.map(|subtitle| view! { <Text size=1 muted=true>{subtitle}</Text> })}
                        </Stack>
                    </Flex>
                </Card>
            }
        };
        view! {
            <Stack space=1 padding=Pad::all(1) style="width: 18rem;">
                {item(Perspective::Published, None)}
                {item(Perspective::Drafts, None)}
                <MenuDivider />
                {move || {
                    let list = releases().list.get();
                    if list.is_empty() {
                        return view! { <Box padding=Pad::all(3)><Text size=1 muted=true>"No open releases"</Text></Box> }.into_any();
                    }
                    list.into_iter()
                        .map(|release| {
                            let subtitle = Some(release.type_label());
                            item(Perspective::Release(release.name), subtitle)
                        })
                        .collect_view()
                        .into_any()
                }}
                <MenuDivider />
                <MenuItem
                    text="New release"
                    icon=IconName::Add
                    on_click=Callback::new(move |_| {
                        open.set(false);
                        creating.set(true);
                    })
                />
            </Stack>
        }
    };
    view! {
        <Popover open=open placement=Placement::BottomEnd content=menu>
            <Card
                as_="button"
                radius=2
                padding=Pad::xy(3, 2)
                border=true
                title="Perspective"
                selected=Signal::derive(move || open.get())
                on_click=Callback::new(move |_| open.update(|open| *open = !*open))
            >
                <Flex align="center" gap=2 attr:data-testid="perspective-menu">
                    <ReleaseDot tone=Signal::derive(move || perspective_tone(&current.get())) />
                    <Text size=1 weight=FontWeight::Medium>{move || perspective_title(&current.get())}</Text>
                    <Text size=1 muted=true><Icon icon=IconName::ChevronDown /></Text>
                </Flex>
            </Card>
        </Popover>
        <Show when=move || creating.get()>
            <CreateReleaseDialog on_close=Callback::new(move |_| creating.set(false)) />
        </Show>
    }
}

#[component]
fn CreateReleaseDialog(on_close: Callback<()>) -> impl IntoView {
    let title = RwSignal::new(String::new());
    let release_type = RwSignal::new("asap".to_owned());
    let busy = RwSignal::new(false);
    let create = move || {
        if busy.get_untracked() {
            return;
        }
        busy.set(true);
        spawn_local(async move {
            let name = releases().create(title.get_untracked().trim(), &release_type.get_untracked()).await;
            busy.set(false);
            if let Some(name) = name {
                releases().set_perspective(Perspective::Release(name));
                on_close.run(());
            }
        });
    };
    let footer = move || {
        view! {
            <Flex justify="flex-end" gap=2>
                <Button mode=ButtonMode::Bleed text="Cancel" on_click=Callback::new(move |_| on_close.run(())) />
                <Button
                    tone=StateTone::Primary
                    text="Create release"
                    attr:data-testid="create-release"
                    loading=Signal::derive(move || busy.get())
                    on_click=Callback::new(move |_| create())
                />
            </Flex>
        }
    };
    let type_button = move |value: &'static str, label: &'static str| {
        view! {
            <Button
                mode=ButtonMode::Bleed
                text=label
                selected=Signal::derive(move || release_type.get() == value)
                on_click=Callback::new(move |_| release_type.set(value.to_owned()))
            />
        }
    };
    view! {
        <Dialog header="New release" on_close=on_close width=1 footer=footer>
            <Stack space=4>
                <Stack space=3>
                    <Text size=1 weight=FontWeight::Medium>"Title"</Text>
                    <TextInput
                        value=title
                        placeholder="Untitled release"
                        on_input=Callback::new(move |text: String| title.set(text))
                        attr:data-testid="release-title"
                    />
                </Stack>
                <Stack space=3>
                    <Text size=1 weight=FontWeight::Medium>"Release type"</Text>
                    <Flex gap=1>
                        {type_button("asap", "ASAP")}
                        {type_button("undecided", "Undecided")}
                    </Flex>
                </Stack>
            </Stack>
        </Dialog>
    }
}
