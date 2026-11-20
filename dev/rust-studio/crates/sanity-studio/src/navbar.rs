//! The studio navbar, laid out like `StudioNavbar`.

use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_ui::prelude::*;

use crate::config::WORKSPACE_TITLE;
use crate::presence::user_hue;
use crate::releases::{PerspectivePicker, releases, with_perspective};
use crate::replica::replica;
use crate::router::Route;
use crate::store::{SyncState, store};
use crate::use_app;
use crate::util::{group_digits, wasm_memory};

fn format_ms(value: Option<f64>) -> String {
    value.map_or_else(|| "–".to_owned(), |ms| format!("{} ms", ms.round()))
}

fn megabytes(bytes: usize) -> String {
    format!("{:.1} MB", bytes as f64 / 1_000_000.0)
}

/// The size of the module's linear memory, which only ever grows.
fn wasm_size() -> Option<(f64, f64)> {
    let entries = window().performance()?.get_entries_by_type("resource");
    entries.iter().find_map(|entry| {
        let name = js_sys::Reflect::get(&entry, &"name".into()).ok()?.as_string()?;
        if !name.ends_with(".wasm") {
            return None;
        }
        let get = |key: &str| js_sys::Reflect::get(&entry, &key.into()).ok()?.as_f64();
        Some((get("transferSize").unwrap_or(0.0), get("decodedBodySize").unwrap_or(0.0)))
    })
}

#[component]
fn PerfRow(#[prop(into)] label: String, #[prop(into)] value: Signal<String>) -> impl IntoView {
    view! {
        <Flex gap=3>
            <Box flex=1>
                <Text size=1 muted=true>
                    {label}
                </Text>
            </Box>
            <Text size=1 weight=FontWeight::Medium>
                {move || value.get()}
            </Text>
        </Flex>
    }
}

#[component]
fn PerfPanel() -> impl IntoView {
    let perf = use_app().perf;
    let store = store();
    let commit = store.last_commit_ms.clone();
    let load = store.last_load_ms.clone();
    let wasm = wasm_size();
    let cache: Signal<crate::replica::Status> = replica().status.clone().into();
    view! {
        <Stack space=3 padding=Pad::all(4) style="width: 280px;">
            <Text size=1 weight=FontWeight::Semibold>
                "Performance"
            </Text>
            <Text size=1 muted=true>
                "Milliseconds since navigation start, unless noted."
            </Text>
            <PerfRow label="Wasm module ready" value=Signal::derive(move || format_ms(Some(perf.wasm_ready))) />
            <PerfRow label="Session checked" value=Signal::derive(move || format_ms(perf.auth.get())) />
            <PerfRow
                label="Schema ready"
                value=Signal::derive(move || {
                    let cached = if perf.schema_cached.get() { " (cached)" } else { "" };
                    format!("{}{cached}", format_ms(perf.schema.get()))
                })
            />
            <PerfRow label="Studio interactive" value=Signal::derive(move || format_ms(perf.interactive.get())) />
            <MenuDivider />
            <PerfRow
                label="Document list"
                value=Signal::derive(move || {
                    let local = if perf.list_cached.get() { " (in memory)" } else { "" };
                    format!("{}{local}", format_ms(perf.list.get()))
                })
            />
            <PerfRow label="Document load (listener + snapshot)" value=Signal::derive(move || format_ms(load.get())) />
            <PerfRow label="Last commit round trip" value=Signal::derive(move || format_ms(commit.get())) />
            <MenuDivider />
            <Text size=1 weight=FontWeight::Semibold>
                "Document cache"
            </Text>
            <PerfRow
                label="Documents"
                value=Signal::derive(move || {
                    let status = cache.get();
                    format!("{} · {}/{} types", group_digits(status.docs), status.types_done, status.types)
                })
            />
            <PerfRow
                label="Held / budget"
                value=Signal::derive(move || {
                    let status = cache.get();
                    format!("{} / {}", megabytes(status.bytes), megabytes(status.budget))
                })
            />
            <PerfRow label="As JSON" value=Signal::derive(move || megabytes(cache.get().json_bytes)) />
            <PerfRow
                label="Warm-up"
                value=Signal::derive(move || {
                    let status = cache.get();
                    match (status.warmed, status.full) {
                        (_, true) if !status.warming => "stopped at the budget".to_owned(),
                        (Some((_, took)), _) => format!("{:.1} s", took / 1000.0),
                        (None, _) if status.warming => "warming…".to_owned(),
                        (None, _) => "–".to_owned(),
                    }
                })
            />
            <PerfRow
                label="Restored from the last visit"
                value=Signal::derive(move || {
                    let status = cache.get();
                    match status.restored {
                        Some((_, took)) if status.stale_groups > 0 => {
                            format!(
                                "{} in {took:.0} ms, {} stale",
                                group_digits(status.restored_docs),
                                group_digits(status.stale_groups)
                            )
                        }
                        Some((_, took)) => format!("{} in {took:.0} ms", group_digits(status.restored_docs)),
                        None => "–".to_owned(),
                    }
                })
            />
            <PerfRow
                label="Last saved to IndexedDB"
                value=Signal::derive(move || {
                    let status = cache.get();
                    match status.persisted {
                        _ if status.saving => "saving…".to_owned(),
                        Some((_, bytes, took)) => format!("{} in {took:.0} ms", megabytes(bytes)),
                        None => "–".to_owned(),
                    }
                })
            />
            <PerfRow
                label="Evicted / fetched on demand"
                value=Signal::derive(move || {
                    let status = cache.get();
                    format!("{} / {}", group_digits(status.evictions), group_digits(status.fetched))
                })
            />
            <PerfRow
                label="Wasm memory"
                value=Signal::derive(move || {
                    cache.track();
                    megabytes(wasm_memory() as usize)
                })
            />
            {wasm.map(|(transfer, decoded)| {
                view! {
                    <PerfRow
                        label="Wasm size (transfer / decoded)"
                        value=Signal::derive(move || {
                            format!("{:.0} / {:.0} kB", transfer / 1024.0, decoded / 1024.0)
                        })
                    />
                }
            })}
        </Stack>
    }
}

#[component]
pub fn Navbar() -> impl IntoView {
    let app = use_app();
    let perf_open = RwSignal::new(false);
    let user_open = RwSignal::new(false);
    let connected = store().connected.clone();
    let sync = store().sync.clone();
    let js_href = move || {
        releases().perspective.track();
        with_perspective(&app.router.route.with(Route::js_studio_href))
    };
    let is_dark = move || app.scheme.get() == Scheme::Dark;

    view! {
        <Card border_bottom=true padding=Pad::all(2) style="flex: none;">
            <Flex align="center" gap=2>
                <Button
                    mode=ButtonMode::Bleed
                    text=WORKSPACE_TITLE
                    icon=IconName::Dashboard
                    href=Route::default().href()
                    on_click=Callback::new(crate::router::link_click(app.router, Route::default()))
                />
                <Badge tone=StateTone::Primary title="Rendered by the Rust (WebAssembly) studio">
                    "Rust"
                </Badge>
                <Box padding=Pad::xy(1, 0)>
                    <Button mode=ButtonMode::Bleed text="Structure" icon=IconName::MasterDetail selected=true />
                </Box>
                <Flex flex=1 justify="center">
                    <Button
                        mode=ButtonMode::Ghost
                        icon=IconName::Search
                        text="Search"
                        title="Search (Ctrl+K)"
                        on_click=Callback::new(move |_| app.command_open.set(true))
                    />
                </Flex>
                <PerspectivePicker />
                <Show when=move || !connected.get()>
                    <Badge tone=StateTone::Caution title="The listener lost its connection and is reconnecting">
                        "Reconnecting"
                    </Badge>
                </Show>
                {move || {
                    (sync.get() == SyncState::Error)
                        .then(|| view! { <Badge tone=StateTone::Critical>"Unsaved changes"</Badge> })
                }}
                <Popover
                    open=perf_open
                    placement=Placement::BottomEnd
                    content=move || view! { <PerfPanel /> }
                >
                    <Button
                        mode=ButtonMode::Bleed
                        icon=IconName::Bolt
                        title="Performance"
                        selected=Signal::derive(move || perf_open.get())
                        on_click=Callback::new(move |_| perf_open.update(|open| *open = !*open))
                    />
                </Popover>
                <Button
                    mode=ButtonMode::Bleed
                    icon=IconName::Launch
                    text="JS studio"
                    title="Open this view in the JavaScript studio"
                    href=Signal::derive(js_href)
                />
                {move || {
                    let dark = is_dark();
                    view! {
                        <Button
                            mode=ButtonMode::Bleed
                            icon=if dark { IconName::Sun } else { IconName::Moon }
                            title=if dark { "Use light mode" } else { "Use dark mode" }
                            on_click=Callback::new(move |_| {
                                app.set_scheme(Some(if dark { Scheme::Light } else { Scheme::Dark }))
                            })
                        />
                    }
                }}
                <Popover
                    open=user_open
                    placement=Placement::BottomEnd
                    min_width=220
                    content=move || view! { <UserMenu /> }
                >
                    <Card
                        as_="button"
                        radius=6
                        padding=Pad::all(1)
                        title="User menu"
                        selected=Signal::derive(move || user_open.get())
                        on_click=Callback::new(move |_| user_open.update(|open| *open = !*open))
                    >
                        {move || {
                            app.user
                                .get()
                                .map(|user| {
                                    view! {
                                        <Avatar src=user.image.clone() initials=user.initials() hue=user_hue(&user.id, Some(&user.id)) />
                                    }
                                })
                        }}
                    </Card>
                </Popover>
            </Flex>
        </Card>
    }
}

#[component]
fn UserMenu() -> impl IntoView {
    let app = use_app();
    let user = app.user.get_untracked();
    let scheme_item = move |label: &'static str, icon: IconName, scheme: Option<Scheme>| {
        let selected = Signal::derive(move || match scheme {
            Some(scheme) => !app.system_scheme.get() && app.scheme.get() == scheme,
            None => app.system_scheme.get(),
        });
        view! {
            <MenuItem text=label icon=icon selected=selected on_click=Callback::new(move |_| app.set_scheme(scheme)) />
        }
    };
    view! {
        <Menu>
            {user.map(|user| {
                view! {
                    <Flex align="center" gap=2 padding=Pad::all(3)>
                        <Avatar src=user.image.clone() initials=user.initials() hue=user_hue(&user.id, Some(&user.id)) size=1 />
                        <Stack space=2 flex=1>
                            <Text size=1 weight=FontWeight::Medium ellipsis=true>
                                {user.name.clone()}
                            </Text>
                            {user.email.clone().map(|email| view! { <Text size=1 muted=true ellipsis=true>{email}</Text> })}
                        </Stack>
                    </Flex>
                }
            })}
            <MenuDivider />
            {scheme_item("System", IconName::Desktop, None)}
            {scheme_item("Dark", IconName::Moon, Some(Scheme::Dark))}
            {scheme_item("Light", IconName::Sun, Some(Scheme::Light))}
            <MenuDivider />
            <MenuItem
                text="Sign out"
                icon=IconName::Leave
                on_click=Callback::new(move |_| spawn_local(async { crate::auth::logout(&store().client()).await }))
            />
        </Menu>
    }
}
