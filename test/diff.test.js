import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {differences, geomspace, machineEpsilon} from "../kit/diff.js";

const {diff: fixtures} = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/numerics.json", import.meta.url)), "utf8")
);
const f = (x) => 1 + 0.5 * Math.tanh(2 * x);

test("double-precision differences match numpy float64 to round-off", (t) => {
  let worst = 0;
  for (const row of fixtures.float64) {
    const d = differences(f, row.x, row.h);
    for (const k of ["forward", "backward", "centre"]) {
      // Math.tanh and numpy's tanh may differ by an ulp, which the division by
      // h amplifies: compare in units of the round-off scale eps/h.
      const scale = Math.max(Math.abs(row[k]), 1) * 2 ** -50 + (4 * Number.EPSILON) / row.h;
      const err = Math.abs(d[k] - row[k]) / scale;
      worst = Math.max(worst, err);
      assert.ok(err <= 1, `${k} at x=${row.x}, h=${row.h}: ${d[k]} vs ${row[k]}`);
    }
  }
  t.diagnostic(`worst error in round-off units: ${worst.toFixed(2)}`);
});

test("single-precision emulation tracks numpy float32 to float32 resolution", (t) => {
  let worst = 0;
  for (const row of fixtures.float32) {
    const d = differences(f, row.x, row.h, {single: true});
    for (const k of ["forward", "backward", "centre"]) {
      // tanh in float32 can differ by an ulp between libraries; that ulp is
      // then divided by h, so compare relative to the round-off scale eps/h.
      const scale = Math.max(Math.abs(row[k]), 1) * 2 ** -22 + (4 * 2 ** -23) / row.h;
      const err = Math.abs(d[k] - row[k]) / scale;
      worst = Math.max(worst, err);
      assert.ok(err <= 1, `${k} at x=${row.x}, h=${row.h}: ${d[k]} vs ${row[k]}`);
    }
  }
  t.diagnostic(`worst error in round-off units: ${worst.toFixed(2)}`);
});

test("error scaling: forward is first order, centre second order", () => {
  const exact = 1 / Math.cosh(2) ** 2;   // f'(1) = sech^2(2)
  const e = (h, k) => Math.abs(differences(f, 1, h)[k] - exact);
  const order = (k) => Math.log(e(1e-2, k) / e(5e-3, k)) / Math.log(2);
  assert.ok(Math.abs(order("forward") - 1) < 0.05);
  assert.ok(Math.abs(order("centre") - 2) < 0.05);
});

test("geomspace and machineEpsilon", () => {
  const g = geomspace(1e-6, 1, 7);
  assert.equal(g.length, 7);
  assert.ok(Math.abs(g[0] - 1e-6) < 1e-21 && Math.abs(g[6] - 1) < 1e-15 && Math.abs(g[3] - 1e-3) < 1e-18);
  assert.equal(machineEpsilon(), 2 ** -52);
  assert.equal(machineEpsilon({single: true}), 2 ** -23);
});
