//! Port of `@sanity/icons`, built from the package's raw SVGs (see `build.rs`).

include!(concat!(env!("OUT_DIR"), "/icons.rs"));

impl Icon {
    pub fn parse(name: &str) -> Option<Icon> {
        ALL.iter().copied().find(|icon| icon.name() == name)
    }

    /// The markup inside the root `<svg>`, which is `width="1em" height="1em" viewBox="0 0 25 25"
    /// fill="none"` for every icon.
    pub fn inner(self) -> &'static str {
        let svg = self.svg();
        let start = svg.find('>').map_or(0, |index| index + 1);
        let end = svg.rfind("</svg>").unwrap_or(svg.len());
        &svg[start..end]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_icon_is_a_current_color_svg() {
        for icon in ALL {
            let svg = icon.svg();
            assert!(svg.starts_with(&format!("<svg data-sanity-icon=\"{}\" ", icon.name())));
            assert!(svg.contains("width=\"1em\" height=\"1em\""), "{}", icon.name());
            assert!(!svg.contains("\"#"), "{} keeps a hex color", icon.name());
            assert!(svg.contains("viewBox=\"0 0 25 25\" fill=\"none\""), "{}", icon.name());
            assert!(icon.inner().starts_with('<') && !icon.inner().contains("<svg"), "{}", icon.name());
        }
        assert_eq!(Icon::parse("chevron-down"), Some(Icon::ChevronDown));
        assert_eq!(Icon::ThList.name(), "th-list");
    }
}
