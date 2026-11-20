//! Port of `@sanity/ui` 4.4: the theme (color system and scales) and the primitives the studio is
//! built from, as Leptos components styled by a lazily filled stylesheet.

pub mod button;
pub mod card;
pub mod css;
pub mod inputs;
pub mod layout;
pub mod misc;
pub mod overlay;
pub mod styles;
pub mod text;
pub mod theme;
pub mod virtual_list;

pub mod prelude {
    pub use crate::button::Button;
    pub use crate::card::{Card, ThemeProvider, use_card_tone, use_scheme};
    pub use crate::inputs::{Checkbox, Select, Switch, TextArea, TextInput};
    pub use crate::layout::{Box, Flex, Grid, Inline, Pad, Stack, radius, space};
    pub use crate::misc::{Avatar, Badge, Skeleton, Spinner, avatar_hue};
    pub use crate::overlay::{
        Dialog, Menu, MenuDivider, MenuItem, Placement, Popover, ToastParams, ToastProvider, ToastStatus, Toasts,
        use_toast,
    };
    pub use crate::text::{Code, Heading, Icon, IconName, Kbd, Label, Text};
    pub use crate::theme::{ButtonMode, CardTone, FontWeight, Scheme, StateTone};
    pub use crate::virtual_list::VirtualList;
}
