//! Image and file inputs, like the JS studio's `ImageInput` and `FileInput`: upload a file by
//! picking, dropping or pasting it, or select an asset that is already in the dataset.

use leptos::html;
use leptos::prelude::*;
use leptos::task::spawn_local;
use sanity_client::{AssetKind, sleep};
use sanity_mutator::{PatchOp, Segment};
use sanity_ui::prelude::*;
use serde_json::{Map, Value, json};
use web_sys::{ClipboardEvent, DragEvent, File, HtmlInputElement};

use super::Target;
use crate::previews::{image_url, image_url_with};
use crate::store::store;

/// What the input shows about an asset document.
#[derive(Clone, Debug, PartialEq)]
struct AssetInfo {
    id: String,
    filename: Option<String>,
    size: Option<f64>,
    mime_type: Option<String>,
    url: Option<String>,
    dimensions: Option<(u64, u64)>,
}

impl AssetInfo {
    fn parse(value: &Value) -> Option<AssetInfo> {
        let text = |key: &str| value.get(key).and_then(Value::as_str).map(str::to_owned);
        let dimensions = value.get("dimensions").or_else(|| value.pointer("/metadata/dimensions"));
        Some(AssetInfo {
            id: text("_id")?,
            filename: text("originalFilename"),
            size: value.get("size").and_then(Value::as_f64),
            mime_type: text("mimeType"),
            url: text("url"),
            dimensions: dimensions
                .and_then(|dimensions| Some((dimensions.get("width")?.as_u64()?, dimensions.get("height")?.as_u64()?))),
        })
    }

    fn name(&self) -> String {
        self.filename.clone().unwrap_or_else(|| self.id.clone())
    }

    fn summary(&self) -> String {
        let mut parts = Vec::new();
        if let Some((width, height)) = self.dimensions {
            parts.push(format!("{width}×{height}"));
        }
        if let Some(size) = self.size {
            parts.push(format_bytes(size));
        }
        if self.dimensions.is_none()
            && let Some(mime_type) = &self.mime_type
        {
            parts.push(mime_type.clone());
        }
        parts.join(" · ")
    }
}

const ASSET_PROJECTION: &str =
    r#"{_id, originalFilename, size, mimeType, url, "dimensions": metadata.dimensions{width, height}}"#;

fn format_bytes(bytes: f64) -> String {
    const UNITS: [&str; 4] = ["B", "kB", "MB", "GB"];
    let mut value = bytes;
    let mut unit = 0;
    while value >= 1000.0 && unit < UNITS.len() - 1 {
        value /= 1000.0;
        unit += 1;
    }
    if unit == 0 { format!("{value:.0} {}", UNITS[unit]) } else { format!("{value:.1} {}", UNITS[unit]) }
}

fn asset_ref(value: Option<&Value>) -> Option<String> {
    value.and_then(|value| value.pointer("/asset/_ref")).and_then(Value::as_str).map(str::to_owned)
}

/// The fields an image or file value holds next to its asset; removing the asset keeps the
/// value only when other fields are filled in.
const ASSET_FIELDS: [&str; 6] = ["_type", "_key", "asset", "crop", "hotspot", "media"];

fn set_asset(target: &Target, type_name: &str, id: &str) {
    let value = target.value_untracked();
    let mut ops = vec![PatchOp::set_if_missing(target.path.clone(), json!({"_type": type_name}))];
    for field in ["crop", "hotspot"] {
        if value.as_ref().is_some_and(|value| value.get(field).is_some()) {
            ops.push(PatchOp::unset(target.child(Segment::attr(field)).path));
        }
    }
    ops.push(PatchOp::set(target.child(Segment::attr("asset")).path, json!({"_type": "reference", "_ref": id})));
    target.patch(ops);
}

fn remove_asset(target: &Target) {
    let value = target.value_untracked();
    let has_fields = value
        .as_ref()
        .and_then(Value::as_object)
        .is_some_and(|object| object.keys().any(|key| !ASSET_FIELDS.contains(&key.as_str())));
    let in_array = matches!(target.path.last(), Some(Segment::Key(_) | Segment::Index(_)));
    if !has_fields && !in_array {
        target.unset();
        return;
    }
    let ops = ["asset", "crop", "hotspot"]
        .into_iter()
        .filter(|field| value.as_ref().is_some_and(|value| value.get(*field).is_some()))
        .map(|field| PatchOp::unset(target.child(Segment::attr(field)).path))
        .collect();
    target.patch(ops);
}

fn accept_of(kind: AssetKind, options: Option<&Value>) -> String {
    options.and_then(|options| options.get("accept")).and_then(Value::as_str).map(str::to_owned).unwrap_or_else(|| {
        match kind {
            AssetKind::Image => "image/*".to_owned(),
            AssetKind::File => String::new(),
        }
    })
}

fn accepts(kind: AssetKind, file: &File) -> bool {
    kind == AssetKind::File || file.type_().starts_with("image/")
}

fn first_file(files: Option<web_sys::FileList>) -> Option<File> {
    files.and_then(|files| files.get(0))
}

#[component]
pub fn AssetInput(target: Target, kind: AssetKind, type_name: String, options: Option<Value>) -> impl IntoView {
    let read_only = target.read_only;
    let accept = accept_of(kind, options.as_ref());
    let target = StoredValue::new(target);
    let type_name = StoredValue::new(type_name);
    let current = Memo::new(move |_| target.with_value(|target| asset_ref(target.value().as_ref())));
    let info = RwSignal::new(None::<AssetInfo>);
    let uploading = RwSignal::new(None::<String>);
    let dragging = RwSignal::new(false);
    let browsing = RwSignal::new(false);
    let menu_open = RwSignal::new(false);
    let file_input = NodeRef::<html::Input>::new();

    Effect::new(move |_| {
        let Some(id) = current.get() else {
            info.set(None);
            return;
        };
        if info.with_untracked(|info| info.as_ref().is_some_and(|info| info.id == id)) {
            return;
        }
        spawn_local(async move {
            let groq = format!("*[_id == $id][0]{ASSET_PROJECTION}");
            let mut params = Map::new();
            params.insert("id".into(), json!(id));
            let result = store().client().query(&groq, &params, "asset.get").await;
            if current.get_untracked().as_deref() == Some(id.as_str()) {
                info.set(result.ok().as_ref().and_then(AssetInfo::parse));
            }
        });
    });

    let upload = move |file: File| {
        if !accepts(kind, &file) {
            store().error("Can't upload this file here", format!("{} isn't an image", file.name()));
            return;
        }
        uploading.set(Some(file.name()));
        spawn_local(async move {
            match store().client().upload_asset(kind, &file, "asset.upload").await {
                Ok(document) => {
                    if let Some(asset) = AssetInfo::parse(&document) {
                        target.with_value(|target| {
                            type_name.with_value(|type_name| set_asset(target, type_name, &asset.id))
                        });
                        info.set(Some(asset));
                    }
                }
                Err(err) => store().error("Upload failed", err.to_string()),
            }
            uploading.set(None);
        });
    };
    let pick = move |_| {
        menu_open.set(false);
        if let Some(input) = file_input.get_untracked() {
            input.click();
        }
    };
    let on_drop = move |event: DragEvent| {
        event.prevent_default();
        dragging.set(false);
        if read_only.get_untracked() {
            return;
        }
        if let Some(file) = first_file(event.data_transfer().and_then(|transfer| transfer.files())) {
            upload(file);
        }
    };
    let on_paste = move |event: ClipboardEvent| {
        if read_only.get_untracked() {
            return;
        }
        if let Some(file) = first_file(event.clipboard_data().and_then(|data| data.files())) {
            event.prevent_default();
            upload(file);
        }
    };
    let select = Callback::new(move |id: String| {
        browsing.set(false);
        target.with_value(|target| type_name.with_value(|type_name| set_asset(target, type_name, &id)));
    });
    let remove = move |_| {
        menu_open.set(false);
        target.with_value(remove_asset);
    };

    let frame_style = move || {
        let border = if dragging.get() { "var(--card-focus-ring-color)" } else { "var(--card-border-color)" };
        format!("border: 1px dashed {border}; border-radius: 3px; outline: none;")
    };
    let empty = move || {
        let noun = if kind == AssetKind::Image { "image" } else { "file" };
        view! {
            <Flex align="center" gap=3 wrap=true style="padding: 0.75rem;">
                <Text size=1 muted=true>
                    <Icon icon=if kind == AssetKind::Image { IconName::Image } else { IconName::Document } />
                </Text>
                <Box flex=1>
                    <Text size=1 muted=true>
                        {move || {
                            if read_only.get() {
                                format!("No {noun}")
                            } else if dragging.get() {
                                format!("Drop {noun} to upload")
                            } else {
                                format!("Drag or paste {noun} here")
                            }
                        }}
                    </Text>
                </Box>
                {move || (!read_only.get()).then(|| view! {
                    <Flex gap=2>
                        <Button mode=ButtonMode::Ghost icon=IconName::Upload text="Upload" font_size=1 padding=Pad::all(2) on_click=Callback::new(pick) />
                        <Button mode=ButtonMode::Ghost icon=IconName::Search text="Select" font_size=1 padding=Pad::all(2) on_click=Callback::new(move |_| browsing.set(true)) />
                    </Flex>
                })}
            </Flex>
        }
    };
    let menu = move || {
        view! {
            <Popover
                open=menu_open
                placement=Placement::BottomEnd
                content=move || {
                    let url = info.get().and_then(|info| info.url);
                    view! {
                        <Menu>
                            <MenuItem text="Upload" icon=IconName::Upload disabled=read_only on_click=Callback::new(pick) />
                            <MenuItem text="Select" icon=IconName::Search disabled=read_only on_click=Callback::new(move |_| { menu_open.set(false); browsing.set(true); }) />
                            {url.map(|url| view! {
                                <MenuItem text="Open in new tab" icon=IconName::Launch on_click=Callback::new(move |_| {
                                    menu_open.set(false);
                                    let _ = window().open_with_url_and_target(&url, "_blank");
                                }) />
                            })}
                            <MenuDivider />
                            <MenuItem text="Remove" icon=IconName::Trash tone=StateTone::Critical disabled=read_only on_click=Callback::new(remove) />
                        </Menu>
                    }
                }
            >
                <Button mode=ButtonMode::Ghost icon=IconName::EllipsisHorizontal padding=Pad::all(2) title="Options" on_click=Callback::new(move |_| menu_open.update(|open| *open = !*open)) />
            </Popover>
        }
    };
    let filled = move |asset: String| {
        let caption = move || {
            info.get()
                .map(|info| {
                    let summary = info.summary();
                    if summary.is_empty() { info.name() } else { format!("{} · {summary}", info.name()) }
                })
                .unwrap_or_default()
        };
        match kind {
            AssetKind::Image => {
                let src = image_url_with(&asset, "h=400&fit=max");
                view! {
                    <Stack space=2>
                        <div style="position: relative; overflow: hidden; border-radius: 3px; box-shadow: inset 0 0 0 1px var(--card-border-color);">
                            <Flex justify="center" style="max-height: 200px; background-color: var(--card-muted-bg-color); background-image: linear-gradient(45deg, var(--card-bg-color) 25%, transparent 25%), linear-gradient(-45deg, var(--card-bg-color) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--card-bg-color) 75%), linear-gradient(-45deg, transparent 75%, var(--card-bg-color) 75%); background-size: 16px 16px; background-position: 0 0, 0 8px, 8px -8px, -8px 0;">
                                <img data-testid="asset-image" src=src alt="" style="display: block; max-width: 100%; max-height: 200px; object-fit: contain;" />
                            </Flex>
                            <Card radius=2 shadow=1 style="position: absolute; top: 0.5rem; right: 0.5rem;">{menu()}</Card>
                        </div>
                        <Text size=1 muted=true ellipsis=true>{caption}</Text>
                    </Stack>
                }
                .into_any()
            }
            AssetKind::File => view! {
                <Flex align="center" gap=3 style="padding: 0.5rem 0.5rem 0.5rem 0.75rem;">
                    <Text size=2 muted=true><Icon icon=IconName::Document /></Text>
                    <Stack space=2 style="flex: 1; min-width: 0;">
                        <Text size=1 weight=FontWeight::Medium ellipsis=true>
                            {move || info.get().map(|info| info.name()).unwrap_or_else(|| asset.clone())}
                        </Text>
                        <Text size=1 muted=true ellipsis=true>{move || info.get().map(|info| info.summary()).unwrap_or_default()}</Text>
                    </Stack>
                    {menu()}
                </Flex>
            }
            .into_any(),
        }
    };

    view! {
        <div
            data-ui="AssetInput"
            data-testid=if kind == AssetKind::Image { "image-input" } else { "file-input" }
            tabindex="0"
            style=move || if current.get().is_some() && kind == AssetKind::Image { "outline: none;".to_owned() } else { frame_style() }
            on:dragover=move |event: DragEvent| {
                event.prevent_default();
                if !read_only.get_untracked() {
                    dragging.set(true);
                }
            }
            on:dragleave=move |_| dragging.set(false)
            on:drop=on_drop
            on:paste=on_paste
        >
            <input
                type="file"
                accept=accept
                node_ref=file_input
                style="display: none;"
                on:change=move |event| {
                    let input: HtmlInputElement = event_target(&event);
                    if let Some(file) = first_file(input.files()) {
                        upload(file);
                    }
                    input.set_value("");
                }
            />
            {move || match uploading.get() {
                Some(name) => view! {
                    <Flex align="center" gap=3 style="padding: 0.75rem;">
                        <Spinner size=1 />
                        <Text size=1 muted=true ellipsis=true>{format!("Uploading {name}…")}</Text>
                    </Flex>
                }
                .into_any(),
                None => match current.get() {
                    Some(asset) => filled(asset).into_any(),
                    None => empty().into_any(),
                },
            }}
            {move || browsing.get().then(|| view! {
                <AssetBrowser kind=kind on_select=select on_close=Callback::new(move |_| browsing.set(false)) />
            })}
        </div>
    }
}

/// The asset source dialog: the newest assets of a kind in the dataset, searchable by file name.
#[component]
fn AssetBrowser(kind: AssetKind, on_select: Callback<String>, on_close: Callback<()>) -> impl IntoView {
    let search = RwSignal::new(String::new());
    let assets = RwSignal::new(None::<Vec<AssetInfo>>);
    let generation = StoredValue::new(0u64);
    Effect::new(move |_| {
        let query = search.get();
        generation.update_value(|generation| *generation += 1);
        let current = generation.get_value();
        spawn_local(async move {
            if !query.is_empty() {
                sleep(250).await;
            }
            if generation.get_value() != current {
                return;
            }
            let groq = format!(
                "*[_type == $type && ($q == \"\" || originalFilename match $q)] | order(_createdAt desc)[0...60]{ASSET_PROJECTION}"
            );
            let mut params = Map::new();
            params.insert("type".into(), json!(kind.document_type()));
            params.insert("q".into(), json!(if query.is_empty() { String::new() } else { format!("{query}*") }));
            let result = store().client().query(&groq, &params, "asset.list").await;
            if generation.get_value() != current {
                return;
            }
            match result {
                Ok(Value::Array(items)) => assets.set(Some(items.iter().filter_map(AssetInfo::parse).collect())),
                Ok(_) => assets.set(Some(Vec::new())),
                Err(err) => {
                    store().error("Could not load assets", err.to_string());
                    assets.set(Some(Vec::new()));
                }
            }
        });
    });

    let title = if kind == AssetKind::Image { "Select image" } else { "Select file" };
    let grid = move || {
        match assets.get() {
        None => view! { <Flex justify="center" style="padding: 2rem;"><Spinner /></Flex> }.into_any(),
        Some(items) if items.is_empty() => view! {
            <Box padding=Pad::all(4)><Text size=1 muted=true align="center">"No assets found"</Text></Box>
        }
        .into_any(),
        Some(items) => match kind {
            AssetKind::Image => view! {
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr)); gap: 0.5rem;">
                    {items.into_iter().map(|asset| {
                        let id = asset.id.clone();
                        let src = image_url(&asset.id, 240);
                        let label = asset.name();
                        view! {
                            <Card as_="button" radius=2 border=true padding=Pad::all(1) title=label.clone() style="display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 0.25rem; min-width: 0; text-align: left; cursor: pointer;" on_click=Callback::new(move |_| on_select.run(id.clone()))>
                                <div style="aspect-ratio: 1; overflow: hidden; border-radius: 2px; background-color: var(--card-muted-bg-color);">
                                    <img data-testid="asset-option" src=src alt="" loading="lazy" style="display: block; width: 100%; height: 100%; object-fit: cover;" />
                                </div>
                                <Text size=0 muted=true ellipsis=true>{label}</Text>
                            </Card>
                        }
                    }).collect_view()}
                </div>
            }
            .into_any(),
            AssetKind::File => view! {
                <Stack space=1>
                    {items.into_iter().map(|asset| {
                        let id = asset.id.clone();
                        let label = asset.name();
                        let summary = asset.summary();
                        view! {
                            <Card as_="button" radius=2 padding=Pad::all(2) style="display: block; width: 100%; text-align: left; cursor: pointer;" on_click=Callback::new(move |_| on_select.run(id.clone()))>
                                <Flex align="center" gap=3>
                                    <Text size=1 muted=true><Icon icon=IconName::Document /></Text>
                                    <Box flex=1><Text size=1 ellipsis=true>{label}</Text></Box>
                                    <Text size=1 muted=true>{summary}</Text>
                                </Flex>
                            </Card>
                        }
                    }).collect_view()}
                </Stack>
            }
            .into_any(),
        },
    }
    };
    view! {
        <Dialog header=title on_close=on_close width=2 id="asset-browser".to_owned()>
            <Stack space=3>
                <TextInput
                    value=search
                    on_input=Callback::new(move |value: String| search.set(value))
                    placeholder="Search by file name"
                    icon=IconName::Search
                    autofocus=true
                />
                {grid}
            </Stack>
        </Dialog>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn summarizes_assets_like_the_js_studio() {
        let image = AssetInfo::parse(&json!({
            "_id": "image-abc-1200x800-png",
            "originalFilename": "photo.png",
            "size": 234_567,
            "mimeType": "image/png",
            "dimensions": {"width": 1200, "height": 800}
        }))
        .unwrap();
        assert_eq!(image.summary(), "1200×800 · 234.6 kB");
        let file =
            AssetInfo::parse(&json!({"_id": "file-abc-pdf", "size": 512, "mimeType": "application/pdf"})).unwrap();
        assert_eq!((file.name(), file.summary()), ("file-abc-pdf".to_owned(), "512 B · application/pdf".to_owned()));
        assert_eq!(format_bytes(3_400_000.0), "3.4 MB");
    }
}
