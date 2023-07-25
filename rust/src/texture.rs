use crate::color::Color;

pub enum Texture {
    Color(Color),
}

impl Into<Color> for Texture {
    fn into(self) -> Color {
        match self {
            Self::Color(color) => color,
        }
    }
}
