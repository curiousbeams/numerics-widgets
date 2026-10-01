import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {integrate, STEPPERS} from "../kit/ode.js";

const {ode: fixtures} = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/numerics.json", import.meta.url)), "utf8")
);
const ho = (y) => [y[1], -y[0]];

test("Euler, RK2 and RK4 reproduce an independent numpy implementation", () => {
  for (const [name, step] of Object.entries(STEPPERS)) {
    const {y} = integrate(ho, [0, 1], 0, 0.1, 200, step);
    const ref = fixtures.ho[name];
    let worst = 0;
    for (let i = 0; i < ref.length; i++) {
      for (let j = 0; j < 2; j++) worst = Math.max(worst, Math.abs(y[i][j] - ref[i][j]) / (1 + Math.abs(ref[i][j])));
    }
    assert.ok(worst < 1e-12, `${name}: worst relative difference ${worst}`);
  }
});

test("global error orders are 1, 2 and 4 on the oscillator", () => {
  const err = (step, h) => {
    const n = Math.round(2 * Math.PI / h);
    const {y} = integrate(ho, [0, 1], 0, (2 * Math.PI) / n, n, step);
    return Math.hypot(y[n][0] - 0, y[n][1] - 1);
  };
  for (const [name, p] of [["Euler", 1], ["RK2", 2], ["RK4", 4]]) {
    const order = Math.log2(err(STEPPERS[name], 0.02) / err(STEPPERS[name], 0.01));
    assert.ok(Math.abs(order - p) < 0.1, `${name}: measured order ${order}`);
  }
});

test("RK4 matches scipy solve_ivp on a nonlinear pendulum", () => {
  const pend = (y) => [y[1], -Math.sin(y[0])];
  const {y} = integrate(pend, [2, 0], 0, 0.001, 10000, STEPPERS.RK4);
  const [a, b] = fixtures.pendulum_y10;
  assert.ok(Math.abs(y[10000][0] - a) < 1e-9 && Math.abs(y[10000][1] - b) < 1e-9);
});
