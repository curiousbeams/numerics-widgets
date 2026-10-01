import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {ftcsDiffusionStep, ftcsWaveStep, amplification} from "../kit/pde.js";

const {pde: fixtures} = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/numerics.json", import.meta.url)), "utf8")
);
const close = (a, b, tol, what) => {
  for (let i = 0; i < b.length; i++) assert.ok(Math.abs(a[i] - b[i]) <= tol, `${what}[${i}]: ${a[i]} vs ${b[i]}`);
};

test("FTCS steps match the book's update written in numpy", () => {
  let u = Float64Array.from(fixtures.u0);
  for (let k = 0; k < 5; k++) u = ftcsDiffusionStep(u, 0.3);
  close(u, fixtures["diffusion_r0.3_5steps"], 1e-12, "diffusion");
  let w = {u: Float64Array.from(fixtures.u0), v: Float64Array.from(fixtures.v0)};
  for (let k = 0; k < 5; k++) w = ftcsWaveStep(w.u, w.v, 0.4);
  close(w.u, fixtures["wave_C0.4_5steps"].u, 1e-12, "wave u");
  close(w.v, fixtures["wave_C0.4_5steps"].v, 1e-12, "wave v");
});

test("amplification factor predicts the growth of a single Fourier mode", () => {
  const n = 65, m = 20;                         // sine mode sin(m pi j/(n-1)) fits the fixed ends exactly
  const theta = (m * Math.PI) / (n - 1);
  for (const r of [0.2, 0.45, 0.6]) {
    let u = Float64Array.from({length: n}, (_, j) => Math.sin(theta * j));
    const u1 = ftcsDiffusionStep(u, r);
    const ratio = Math.abs(u1[10] / u[10]);
    assert.ok(Math.abs(ratio - amplification(theta, r)) < 1e-12, `r=${r}`);
  }
  // diffusion: stable iff r <= 1/2 for the worst (zig-zag) mode
  assert.ok(amplification(Math.PI, 0.5) <= 1 + 1e-15);
  assert.ok(amplification(Math.PI, 0.51) > 1);
  // wave equation with Euler in time: unstable for any C > 0
  for (const C of [0.05, 0.5, 1]) assert.ok(amplification(0.3, C, "wave") > 1);
});
