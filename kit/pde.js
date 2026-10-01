// pde.js — the FTCS updates of the book's PDE chapter, and their amplification factors.
//
// Grid units throughout: the end points are fixed (Dirichlet) and only the
// interior is updated. For diffusion the single parameter is r = D dt / dx^2;
// for the wave equation it is the Courant number C = c dt / dx, with the
// velocity v stored already multiplied by dt.

/** One FTCS step of the diffusion equation (returns a new array). */
export function ftcsDiffusionStep(u, r) {
  const n = u.length;
  const out = Float64Array.from(u);
  for (let j = 1; j < n - 1; j++) out[j] = u[j] + r * (u[j + 1] - 2 * u[j] + u[j - 1]);
  return out;
}

/**
 * One forward-Euler / centred-space step of the wave equation, as in the book:
 *   u <- u + v,   v <- v + C^2 (u[j+1] - 2u[j] + u[j-1]),  both from the old state.
 */
export function ftcsWaveStep(u, v, C) {
  const n = u.length;
  const un = Float64Array.from(u), vn = Float64Array.from(v);
  for (let j = 1; j < n - 1; j++) {
    un[j] = u[j] + v[j];
    vn[j] = v[j] + C * C * (u[j + 1] - 2 * u[j] + u[j - 1]);
  }
  return {u: un, v: vn};
}

/**
 * |G| per step for a Fourier mode with phase advance theta = k dx per grid point
 * (von Neumann analysis). Diffusion: G = 1 - 4 r sin^2(theta/2).
 * Wave (Euler in time): |G| = sqrt(1 + 4 C^2 sin^2(theta/2)), above 1 for every theta > 0.
 */
export function amplification(theta, param, equation = "diffusion") {
  const s2 = Math.sin(theta / 2) ** 2;
  return equation === "diffusion" ? Math.abs(1 - 4 * param * s2) : Math.sqrt(1 + 4 * param * param * s2);
}
