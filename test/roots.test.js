import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {bisectionSteps, newtonSteps} from "../kit/roots.js";

const {roots: fixtures} = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/numerics.json", import.meta.url)), "utf8")
);
const f = (x) => 5 * Math.exp(-x) + x - 5;
const fp = (x) => -5 * Math.exp(-x) + 1;

test("bisection and Newton reproduce the reference iterates for the Wien equation", () => {
  const mids = bisectionSteps(f, 2, 8, 30).map((s) => s.mid);
  mids.forEach((m, i) => assert.ok(Math.abs(m - fixtures.bisection_mids[i]) < 1e-14, `mid ${i}`));
  const xs = newtonSteps(f, fp, 3, 8);
  xs.forEach((x, i) => assert.ok(Math.abs(x - fixtures.newton[i]) < 1e-12, `newton ${i}`));
  assert.ok(Math.abs(xs.at(-1) - fixtures.root) < 1e-12);
});

test("bisection halves the bracket; Newton converges quadratically", () => {
  const steps = bisectionSteps(f, 2, 8, 10);
  steps.forEach((s, i) => assert.ok(Math.abs((s.b - s.a) - 6 / 2 ** i) < 1e-12));
  const e = newtonSteps(f, fp, 3, 5).map((x) => Math.abs(x - fixtures.root));
  // e_{i+1} ~ C e_i^2 once close: the ratio of logs approaches 2
  assert.ok(Math.log(e[4]) / Math.log(e[3]) > 1.7);
});

test("Newton's classic failures: a 2-cycle and divergence", () => {
  const cyc = newtonSteps((x) => x ** 3 - 2 * x + 2, (x) => 3 * x ** 2 - 2, 0, 6);
  assert.deepEqual(cyc.map((x) => Math.round(x)), [0, 1, 0, 1, 0, 1, 0]);
  const div = newtonSteps(Math.atan, (x) => 1 / (1 + x * x), 1.5, 5);
  assert.ok(Math.abs(div.at(-1)) > 100);
  assert.throws(() => bisectionSteps(f, 6, 8, 3));
});
