import assert from "node:assert/strict";
import test from "node:test";
import { calculateComparison, calculateCostPerMile } from "../calculations.js";

test("calculates UK fuel cost per mile", () => {
  const result = calculateCostPerMile(139.9, 47);
  assert.ok(Math.abs(result - 0.1353) < 0.0001);
});

test("identifies a worthwhile trip", () => {
  const result = calculateComparison({
    nearbyPricePence: 150,
    awayPricePence: 140,
    distanceMiles: 5,
    litres: 50,
    mpgUk: 47,
  });
  assert.equal(result.decision, "good");
  assert.ok(result.netSaving > 3.5 && result.netSaving < 3.6);
});

test("identifies a trip that is not worthwhile", () => {
  const result = calculateComparison({
    nearbyPricePence: 150,
    awayPricePence: 145,
    distanceMiles: 10,
    litres: 40,
    mpgUk: 47,
  });
  assert.equal(result.decision, "bad");
  assert.ok(result.netSaving < 0);
});

test("identifies break-even", () => {
  const result = calculateComparison({
    nearbyPricePence: 150,
    awayPricePence: 150,
    distanceMiles: 0,
    litres: 40,
    mpgUk: 47,
  });
  assert.equal(result.decision, "even");
  assert.equal(result.netSaving, 0);
});

test("rejects invalid values", () => {
  assert.throws(() => calculateComparison({
    nearbyPricePence: 150,
    awayPricePence: 145,
    distanceMiles: -1,
    litres: 40,
    mpgUk: 47,
  }));
});
