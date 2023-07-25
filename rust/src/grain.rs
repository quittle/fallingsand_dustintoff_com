use crate::{color::Color, texture::Texture};

pub enum Grain {
    Sand,
}

impl Grain {
    pub fn texture(&self) -> Texture {
        match self {
            Self::Sand => Texture::Color(Color::HexRgba(0xefe4b0ff)),
        }
    }
}
