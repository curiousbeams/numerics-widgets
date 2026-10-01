import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

import {simpleSum, trapezoid, simpson} from "../kit/quad.js";

const {quad: fixtures} = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/numerics.json", import.meta.url)), "utf8")
);
const f = (x) => x ** 4 - 2 * x + 1;

test("the three rules match the book's formulas written in numpy (and scipy for Simpson)", () => {
  for (const [n, ref] of Object.entries(fixtures)) {
    const N = Number(n);
    assert.ok(Math.abs(simpleSum(f, 0, 2, N) - ref.sum) < 1e-12, `sum n=${n}`);
    assert.ok(Math.abs(trapezoid(f, 0, 2, N) - ref.trap) < 1e-12, `trap n=${n}`);
    assert.ok(Math.abs(simpson(f, 0, 2, N) - ref.simp) < 1e-12, `simpson n=${n}`);
    assert.ok(Math.abs(simpson(f, 0, 2, N) - ref.scipy_simp) < 1e-12, `scipy simpson n=${n}`);
  }
});

test("orders 1, 2 and 4 on a smooth integrand, and Simpson's order drop for sqrt(x)", () => {
  const order = (rule, g, a, b, exact) =>
    Math.log2(Math.abs(rule(g, a, b, 32) - exact) / Math.abs(rule(g, a, b, 64) - exact));
  assert.ok(Math.abs(order(simpleSum, Math.sin, 0, 1, 1 - Math.cos(1)) - 1) < 0.05);
  assert.ok(Math.abs(order(trapezoid, Math.sin, 0, 1, 1 - Math.cos(1)) - 2) < 0.05);
  assert.ok(Math.abs(order(simpson, Math.sin, 0, 1, 1 - Math.cos(1)) - 4) < 0.05);
  assert.ok(Math.abs(order(simpson, Math.sqrt, 0, 1, 2 / 3) - 1.5) < 0.05);
});

test("Simpson refuses an odd number of slices", () => {
  assert.throws(() => simpson(f, 0, 2, 3));
});
