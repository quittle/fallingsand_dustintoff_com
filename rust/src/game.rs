use std::cell::RefCell;

use crate::{
    color::Color,
    grain::Grain,
    grid::{CanvasSize, Grid, GridPos},
    js::{fill_rect, stroke_rect},
};

thread_local! {
    pub static GAME: RefCell<Game> = RefCell::new(Default::default());
}

pub fn with_game<T, F: FnOnce(&mut Game) -> T>(func: F) -> T {
    GAME.with(|game| func(&mut game.borrow_mut()))
}

#[derive(Default)]
pub struct Game {
    grid: Grid,
}

impl Game {
    pub fn init(
        &mut self,
        rows: GridPos,
        cols: GridPos,
        canvas_width: CanvasSize,
        canvas_height: CanvasSize,
    ) {
        self.grid.resize(rows, cols, canvas_width, canvas_height);
    }

    pub fn resize(&mut self, canvas_width: CanvasSize, canvas_height: CanvasSize) {
        self.grid
            .resize(self.grid.rows, self.grid.cols, canvas_width, canvas_height);
    }

    pub fn on_click(&mut self, canvas_x: CanvasSize, canvas_y: CanvasSize) {
        let cell_size = self.grid.cell_size();
        let x = canvas_x / cell_size;
        let y = canvas_y / cell_size;
        self.grid.add(x, y, Grain::Sand);
    }

    pub fn tick(&self) {}

    pub fn draw(&self) {
        self.draw_border();

        let cell_size = self.grid.cell_size();
        for ((x, y), grain) in self.grid.cells() {
            fill_rect(
                x * cell_size,
                y * cell_size,
                cell_size,
                cell_size,
                Into::<Color>::into(grain.texture()).into(),
            );
        }
    }

    fn draw_border(&self) {
        stroke_rect(
            1,
            1,
            self.grid.cols * self.grid.cell_size() - 1,
            self.grid.rows * self.grid.cell_size() - 1,
            Color::BLACK.into(),
        );
    }
}
