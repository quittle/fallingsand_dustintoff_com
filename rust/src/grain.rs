use crate::{color::Color, grid::GridPos, texture::Texture};

#[derive(Copy, Clone)]
pub enum Grain {
    Empty,
    Sand,
}

impl Grain {
    pub fn texture(&self) -> Texture {
        match self {
            Self::Empty => Texture::Color(Color::TRANSPARENT),
            Self::Sand => Texture::Color(Color::HexRgba(0xef_e4_b0_ff)),
        }
    }

    pub fn tick_movement(&self) -> (GridPos, GridPos) {
        match self {
            Self::Empty => (0, 0),
            Self::Sand => (1, 0),
        }
    }
}
