//! Arrays: checkboxes for primitive `options.list` arrays, rows of inputs for other primitive
//! arrays, and item cards that expand to edit for arrays of objects and references, reordered
//! by drag and drop or the item menu.

use std::sync::Arc;

use leptos::prelude::*;
use sanity_client::random_key;
use sanity_mutator::{InsertPosition, PatchOp, Segment};
use sanity_ui::prelude::*;
use serde_json::{Value, json};
use wasm_bindgen::JsCast;

use super::inputs::{Parsed, SyncedInput, number_from};
use super::portable_text::PortableTextPreview;
use super::{Target, render_input};
use crate::list::{media_box, preview_content};
use crate::previews::{PreviewState, preview};
use crate::schema::{self, Kind, Resolved, member_type_name, title_of};
use crate::util::preview_text;

struct Member {
    type_name: String,
    title: String,
    resolved: Arc<Resolved>,
}

fn members(resolved: &Resolved) -> Arc<Vec<Member>> {
    let schema = schema::current();
    Arc::new(
        resolved
            .of
            .iter()
            .map(|member| {
                let member_resolved = schema.resolve(member);
                let type_name = member_type_name(member);
                let title = if member.title.is_some() || !member.name.is_empty() {
                    title_of(member)
                } else {
                    schema.type_title(&type_name)
                };
                Member { type_name, title, resolved: Arc::new(member_resolved) }
            })
            .collect(),
    )
}

fn member_for<'a>(members: &'a [Member], type_name: &str) -> Option<&'a Member> {
    members.iter().find(|member| member.type_name == type_name).or_else(|| (members.len() == 1).then(|| &members[0]))
}

pub fn array_input(target: Target, resolved: Arc<Resolved>, level: usize) -> AnyView {
    let members = members(&resolved);
    if members.iter().any(|member| member.resolved.kind == Kind::Block) {
        return view! { <PortableTextPreview target=target /> }.into_any();
    }
    let primitive = !members.is_empty()
        && members.iter().all(|member| {
            matches!(
                member.resolved.kind,
                Kind::String
                    | Kind::Text
                    | Kind::Number
                    | Kind::Boolean
                    | Kind::Url
                    | Kind::Email
                    | Kind::Date
                    | Kind::Datetime
            )
        });
    if primitive {
        if let Some(list) = resolved.list_options() {
            return tags_input(target, list);
        }
        return view! { <PrimitiveArray target=target members=members /> }.into_any();
    }
    view! { <ObjectArray target=target members=members level=level /> }.into_any()
}

/// A primitive array with `options.list`: one checkbox per option, in list order.
fn tags_input(target: Target, list: Vec<(Value, String)>) -> AnyView {
    let read_only = target.read_only;
    let list = Arc::new(list);
    let options = list.clone();
    view! {
        <Grid columns=2 gap=3>
            {options
                .iter()
                .cloned()
                .map(|(value, title)| {
                    let checked = {
                        let target = target.clone();
                        let value = value.clone();
                        Signal::derive(move || {
                            Some(target.value().and_then(|array| array.as_array().map(|items| items.contains(&value))).unwrap_or(false))
                        })
                    };
                    let on_change = {
                        let target = target.clone();
                        let list = list.clone();
                        Callback::new(move |on: bool| {
                            let current: Vec<Value> =
                                target.value_untracked().and_then(|array| array.as_array().cloned()).unwrap_or_default();
                            let next: Vec<Value> = list
                                .iter()
                                .map(|(candidate, _)| candidate.clone())
                                .filter(|candidate| if *candidate == value { on } else { current.contains(candidate) })
                                .collect();
                            if next.is_empty() { target.unset() } else { target.set(Value::Array(next)) }
                        })
                    };
                    view! {
                        <Flex gap=2 align="center">
                            <Checkbox checked=checked on_change=on_change read_only=read_only />
                            <Text size=1>{title}</Text>
                        </Flex>
                    }
                })
                .collect_view()}
        </Grid>
    }
    .into_any()
}

fn primitive_text(value: Option<&Value>) -> String {
    match value {
        Some(Value::String(text)) => text.clone(),
        Some(Value::Number(number)) => number.to_string(),
        Some(Value::Bool(flag)) => flag.to_string(),
        _ => String::new(),
    }
}

fn string_item(text: &str) -> Parsed {
    Parsed::Set(json!(text))
}

fn append(target: &Target, item: Value) {
    let mut last = target.path.clone();
    last.push(Segment::Index(-1));
    target.patch(vec![
        PatchOp::set_if_missing(target.path.clone(), json!([])),
        PatchOp::insert(InsertPosition::After, last, vec![item]),
    ]);
}

/// Strings and numbers by index, the way the JS studio edits arrays of primitives.
#[component]
fn PrimitiveArray(target: Target, members: Arc<Vec<Member>>) -> impl IntoView {
    let read_only = target.read_only;
    let number = members[0].resolved.kind == Kind::Number;
    let length = {
        let target = target.clone();
        Memo::new(move |_| target.value().and_then(|array| array.as_array().map(Vec::len)).unwrap_or(0))
    };
    let rows = {
        let target = target.clone();
        move || {
            (0..length.get())
                .map(|index| {
                    let item = target.child(Segment::Index(index as i64));
                    let remove = item.clone();
                    let input = if number {
                        view! { <SyncedInput target=item to_text=primitive_text from_text=number_from input_type="number" /> }.into_any()
                    } else {
                        view! { <SyncedInput target=item to_text=primitive_text from_text=string_item /> }.into_any()
                    };
                    view! {
                        <Flex gap=1 align="center">
                            <Box flex=1>{input}</Box>
                            <Button
                                mode=ButtonMode::Bleed
                                icon=IconName::Trash
                                tone=StateTone::Critical
                                title="Remove"
                                disabled=read_only
                                on_click=Callback::new(move |_| remove.unset())
                            />
                        </Flex>
                    }
                })
                .collect_view()
        }
    };
    let add = Callback::new(move |_| append(&target, if number { json!(0) } else { json!("") }));
    view! {
        <Stack space=2>
            {rows}
            <Button mode=ButtonMode::Ghost icon=IconName::Add text="Add item" disabled=read_only on_click=add />
        </Stack>
    }
}

/// The title, subtitle and media of an object item from its fields, like the JS studio's
/// guessed preview.
fn object_preview(item: &Value, member: Option<&Member>) -> (String, Option<String>, Option<String>) {
    let type_title = member.map(|member| member.title.clone()).unwrap_or_else(|| "Item".to_owned());
    let Some(member) = member else { return (type_title, None, None) };
    if matches!(member.resolved.kind, Kind::Image | Kind::File) {
        let asset = item.pointer("/asset/_ref").and_then(Value::as_str).map(str::to_owned);
        let title = ["caption", "alt", "title"].iter().find_map(|field| item.get(*field).and_then(preview_text));
        return (title.unwrap_or(type_title), None, asset.filter(|_| member.resolved.kind == Kind::Image));
    }
    let guess = schema::current().guess_fields_preview(&member.resolved.fields);
    let field = |name: &Option<String>| name.as_ref().and_then(|name| item.get(name));
    let title = field(&guess.title).and_then(preview_text).unwrap_or(type_title);
    let subtitle = field(&guess.subtitle).and_then(preview_text);
    let media =
        field(&guess.media).and_then(|image| image.pointer("/asset/_ref")).and_then(Value::as_str).map(str::to_owned);
    (title, subtitle, media)
}

fn item_summary(item: Value, member: Option<&Member>) -> AnyView {
    if member.is_some_and(|member| member.resolved.kind == Kind::Reference) {
        let Some(reference) = item.get("_ref").and_then(Value::as_str) else {
            return view! { <Box padding=Pad::all(2)><Text size=1 muted=true>"Empty reference"</Text></Box> }
                .into_any();
        };
        let state = preview(reference);
        return (move || match state.get() {
            PreviewState::Loading => view! {
                <Flex align="center" gap=2>
                    <Skeleton width="33px" height="33px" radius=1 />
                    <Skeleton width="40%" height="0.8125rem" />
                </Flex>
            }
            .into_any(),
            PreviewState::Missing => view! { <Text size=1 muted=true>"Document not found"</Text> }.into_any(),
            PreviewState::Ready(doc) => preview_content(doc).into_any(),
        })
        .into_any();
    }
    let (title, subtitle, media) = object_preview(&item, member);
    view! {
        <Flex align="center" gap=2>
            {media_box(media, 33)}
            <Stack space=2 flex=1>
                <Text size=1 weight=FontWeight::Medium ellipsis=true>{title}</Text>
                {subtitle.map(|subtitle| view! { <Text size=1 muted=true ellipsis=true>{subtitle}</Text> })}
            </Stack>
        </Flex>
    }
    .into_any()
}

#[derive(Clone, Copy)]
struct Dnd {
    dragging: RwSignal<Option<String>>,
    /// The item the dragged one would land next to, and whether before it.
    over: RwSignal<Option<(String, bool)>>,
}

/// Moves the item with `key` next to the item with `anchor`.
fn move_item(target: &Target, key: &str, anchor: &str, before: bool) {
    if key == anchor {
        return;
    }
    let Some(item) = target.child(Segment::key(key)).value_untracked() else { return };
    let position = if before { InsertPosition::Before } else { InsertPosition::After };
    target.patch(vec![
        PatchOp::unset(target.child(Segment::key(key)).path),
        PatchOp::insert(position, target.child(Segment::key(anchor)).path, vec![item]),
    ]);
}

fn keys(target: &Target) -> Vec<String> {
    target
        .value_untracked()
        .and_then(|array| {
            array.as_array().map(|items| {
                items.iter().filter_map(|item| item.get("_key").and_then(Value::as_str).map(str::to_owned)).collect()
            })
        })
        .unwrap_or_default()
}

#[component]
fn ArrayItem(
    target: Target,
    key: String,
    type_name: String,
    members: Arc<Vec<Member>>,
    level: usize,
    dnd: Dnd,
    auto_open: bool,
) -> impl IntoView {
    let item = target.child(Segment::key(key.as_str()));
    let member = member_for(&members, &type_name).map(|member| (member.resolved.clone(), member.title.clone()));
    let open = RwSignal::new(auto_open);
    let menu_open = RwSignal::new(false);
    let read_only = target.read_only;
    let summary = {
        let item = item.clone();
        let members = members.clone();
        let type_name = type_name.clone();
        move || item.value().map(|value| item_summary(value, member_for(&members, &type_name)))
    };
    let editor = StoredValue::new({
        let item = item.clone();
        let member = member.clone();
        move || match &member {
            Some((resolved, _)) => render_input(item.clone(), resolved.clone(), level + 1),
            None => view! {
                <Text size=1 muted=true>{format!("The schema has no array member of type {type_name:?}.")}</Text>
            }
            .into_any(),
        }
    });
    let indicator = {
        let key = key.clone();
        move || match dnd.over.get() {
            Some((over, before)) if over == key && dnd.dragging.get().is_some_and(|dragging| dragging != key) => {
                if before {
                    "box-shadow: inset 0 2px 0 var(--card-focus-ring-color);"
                } else {
                    "box-shadow: inset 0 -2px 0 var(--card-focus-ring-color);"
                }
            }
            _ => "",
        }
    };
    let on_dragstart = {
        let key = key.clone();
        move |event: web_sys::DragEvent| {
            if read_only.get_untracked() {
                event.prevent_default();
                return;
            }
            if let Some(transfer) = event.data_transfer() {
                let _ = transfer.set_data("text/plain", &key);
                transfer.set_effect_allowed("move");
                let row = event
                    .target()
                    .and_then(|target| target.dyn_into::<web_sys::Element>().ok())
                    .and_then(|element| element.closest("[data-array-item]").ok().flatten());
                if let Some(row) = row {
                    transfer.set_drag_image(&row, 16, 16);
                }
            }
            dnd.dragging.set(Some(key.clone()));
        }
    };
    let on_dragover = {
        let key = key.clone();
        move |event: web_sys::DragEvent| {
            if dnd.dragging.get_untracked().is_none() {
                return;
            }
            event.prevent_default();
            let Some(element) = event.current_target().and_then(|target| target.dyn_into::<web_sys::Element>().ok())
            else {
                return;
            };
            let rect = element.get_bounding_client_rect();
            let before = (event.client_y() as f64) < rect.top() + rect.height() / 2.0;
            if dnd.over.get_untracked() != Some((key.clone(), before)) {
                dnd.over.set(Some((key.clone(), before)));
            }
        }
    };
    let on_drop = {
        let target = target.clone();
        move |event: web_sys::DragEvent| {
            event.prevent_default();
            if let (Some(dragging), Some((anchor, before))) = (dnd.dragging.get_untracked(), dnd.over.get_untracked()) {
                move_item(&target, &dragging, &anchor, before);
            }
            dnd.dragging.set(None);
            dnd.over.set(None);
        }
    };
    let on_dragend = move |_: web_sys::DragEvent| {
        dnd.dragging.set(None);
        dnd.over.set(None);
    };
    let step = {
        let target = target.clone();
        let key = key.clone();
        move |delta: i64| {
            let keys = keys(&target);
            let Some(index) = keys.iter().position(|candidate| *candidate == key) else { return };
            let next = index as i64 + delta;
            if next < 0 || next >= keys.len() as i64 {
                return;
            }
            move_item(&target, &key, &keys[next as usize], delta < 0);
        }
    };
    let step = StoredValue::new(step);
    let actions = {
        let item = item.clone();
        let target = target.clone();
        let key = key.clone();
        StoredValue::new(move |action: &str| {
            menu_open.set(false);
            match action {
                "remove" => item.unset(),
                "duplicate" => {
                    if let Some(mut value) = item.value_untracked() {
                        value["_key"] = json!(random_key(12));
                        target.patch(vec![PatchOp::insert(
                            InsertPosition::After,
                            target.child(Segment::key(key.as_str())).path,
                            vec![value],
                        )]);
                    }
                }
                "up" => step.read_value()(-1),
                "down" => step.read_value()(1),
                _ => {}
            }
        })
    };
    let menu = move || {
        view! {
            <Menu>
                <MenuItem text="Move up" icon=IconName::ChevronUp disabled=read_only on_click=Callback::new(move |_| actions.read_value()("up")) />
                <MenuItem text="Move down" icon=IconName::ChevronDown disabled=read_only on_click=Callback::new(move |_| actions.read_value()("down")) />
                <MenuItem text="Duplicate" icon=IconName::Copy disabled=read_only on_click=Callback::new(move |_| actions.read_value()("duplicate")) />
                <MenuDivider />
                <MenuItem
                    text="Remove"
                    icon=IconName::Trash
                    tone=StateTone::Critical
                    disabled=read_only
                    on_click=Callback::new(move |_| actions.read_value()("remove"))
                />
            </Menu>
        }
    };
    view! {
        <div data-array-item="" style=indicator on:dragover=on_dragover on:drop=on_drop>
            <Card border=true radius=2 padding=Pad::all(1)>
                <Flex align="center" gap=1>
                    <span
                        draggable="true"
                        title="Drag to reorder"
                        style="cursor: grab; display: flex; padding: 0.5rem 0.25rem; color: var(--card-muted-fg-color);"
                        on:dragstart=on_dragstart
                        on:dragend=on_dragend
                    >
                        <Text size=1 muted=true><Icon icon=IconName::DragHandle /></Text>
                    </span>
                    <button
                        type="button"
                        style="all: unset; flex: 1; min-width: 0; cursor: pointer; padding: 0.25rem; border-radius: 0.1875rem;"
                        on:click=move |_| open.update(|open| *open = !*open)
                    >
                        {summary}
                    </button>
                    {move || {
                        let (icon, title) = if open.get() { (IconName::ChevronUp, "Collapse") } else { (IconName::ChevronDown, "Edit") };
                        view! {
                            <Button
                                mode=ButtonMode::Bleed
                                icon=icon
                                title=title
                                on_click=Callback::new(move |_| open.update(|open| *open = !*open))
                            />
                        }
                    }}
                    <Popover open=menu_open placement=Placement::BottomEnd content=menu>
                        <Button
                            mode=ButtonMode::Bleed
                            icon=IconName::EllipsisHorizontal
                            title="Show more"
                            on_click=Callback::new(move |_| menu_open.update(|open| *open = !*open))
                        />
                    </Popover>
                </Flex>
                <Show when=move || open.get()>
                    <Box padding=Pad { top: 3, right: 2, bottom: 2, left: 2 }>{editor.read_value()()}</Box>
                </Show>
            </Card>
        </div>
    }
}

#[component]
fn ObjectArray(target: Target, members: Arc<Vec<Member>>, level: usize) -> impl IntoView {
    let read_only = target.read_only;
    let items = {
        let target = target.clone();
        Memo::new(move |_| {
            let value = target.value();
            let items = value.as_ref().and_then(Value::as_array);
            let rows: Vec<(String, String)> = items
                .map(|items| {
                    items
                        .iter()
                        .filter_map(|item| {
                            let key = item.get("_key").and_then(Value::as_str)?.to_owned();
                            let type_name = item.get("_type").and_then(Value::as_str).unwrap_or_default().to_owned();
                            Some((key, type_name))
                        })
                        .collect()
                })
                .unwrap_or_default();
            let missing_keys = items.map_or(0, |items| items.len()) - rows.len();
            (rows, missing_keys)
        })
    };
    let dnd = Dnd { dragging: RwSignal::new(None), over: RwSignal::new(None) };
    let just_added = StoredValue::new(None::<String>);
    let add = {
        let target = target.clone();
        StoredValue::new(move |type_name: String| {
            let key = random_key(12);
            just_added.set_value(Some(key.clone()));
            append(&target, json!({"_key": key, "_type": type_name}));
        })
    };
    let add_missing_keys = {
        let target = target.clone();
        Callback::new(move |_: web_sys::MouseEvent| {
            let Some(Value::Array(items)) = target.value_untracked() else { return };
            let items: Vec<Value> = items
                .into_iter()
                .map(|mut item| {
                    if item.is_object() && item.get("_key").is_none() {
                        item["_key"] = json!(random_key(12));
                    }
                    item
                })
                .collect();
            target.set(Value::Array(items));
        })
    };
    let add_open = RwSignal::new(false);
    let add_button = if members.len() == 1 {
        let type_name = members[0].type_name.clone();
        view! {
            <Button
                mode=ButtonMode::Ghost
                icon=IconName::Add
                text="Add item"
                disabled=read_only
                fill=true
                on_click=Callback::new(move |_| add.read_value()(type_name.clone()))
            />
        }
        .into_any()
    } else {
        let options: Vec<(String, String)> =
            members.iter().map(|member| (member.type_name.clone(), member.title.clone())).collect();
        let options = StoredValue::new(options);
        view! {
            <Popover
                open=add_open
                block=true
                content=move || {
                    view! {
                        <Menu>
                            {options
                                .get_value()
                                .into_iter()
                                .map(|(type_name, title)| {
                                    view! {
                                        <MenuItem
                                            text=title
                                            on_click=Callback::new(move |_| {
                                                add_open.set(false);
                                                add.read_value()(type_name.clone());
                                            })
                                        />
                                    }
                                })
                                .collect_view()}
                        </Menu>
                    }
                }
            >
                <Button
                    mode=ButtonMode::Ghost
                    icon=IconName::Add
                    icon_right=IconName::ChevronDown
                    text="Add item…"
                    disabled=read_only
                    fill=true
                    on_click=Callback::new(move |_| add_open.update(|open| *open = !*open))
                />
            </Popover>
        }
        .into_any()
    };
    view! {
        <Stack space=2>
            <Show when=move || { items.with(|(_, missing)| *missing > 0) }>
                <Card tone=CardTone::Caution border=true radius=2 padding=Pad::all(3)>
                    <Flex align="center" gap=2>
                        <Box flex=1>
                            <Text size=1>"Some items are missing their _key, so they can't be edited one by one."</Text>
                        </Box>
                        <Button mode=ButtonMode::Ghost text="Add missing keys" disabled=read_only on_click=add_missing_keys />
                    </Flex>
                </Card>
            </Show>
            <For
                each=move || items.get().0
                key=|(key, type_name)| (key.clone(), type_name.clone())
                children=move |(key, type_name)| {
                    let auto_open = just_added.with_value(|added| added.as_deref() == Some(key.as_str()));
                    view! {
                        <ArrayItem
                            target=target.clone()
                            key=key
                            type_name=type_name
                            members=members.clone()
                            level=level
                            dnd=dnd
                            auto_open=auto_open
                        />
                    }
                }
            />
            {add_button}
        </Stack>
    }
}
