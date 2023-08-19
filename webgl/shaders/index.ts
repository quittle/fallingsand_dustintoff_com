// @ts-expect-error
import rvs from "./render.vs?raw";
// @ts-expect-error
import rfs from "./render.fs?raw";
// @ts-expect-error
import uvs from "./update.vs?raw";
// @ts-expect-error
import ufs from "./update.fs?raw";

export const renderVs = rvs as string;
export const renderFs = rfs as string;
export const updateVs = uvs as string;
export const updateFs = ufs as string;
