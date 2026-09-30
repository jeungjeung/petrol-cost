import assert from "node:assert/strict";
import test from "node:test";
import { calculateComparison, calculateCostPerMile, calculateRoutineJourney } from "../calculations.js";

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

test("compares a routine journey and applies the agreed leg-specific prices", () => {
  const result = calculateRoutineJourney({
    nearbyPricePence: 172.9,
    awayPricePence: 167.9,
    distanceMiles: 5,
    routineMiles: 100,
    mpgUk: 47,
  });

  assert.equal(result.decision, "bad");
  assert.ok(Math.abs(result.baselineCost - 16.7238) < 0.001);
  assert.ok(Math.abs(result.outboundCost - 0.8241) < 0.001);
  assert.ok(Math.abs(result.returnCost - 0.8120) < 0.001);
  assert.ok(Math.abs(result.routineAwayCost - 16.2402) < 0.001);
  assert.ok(Math.abs(result.awayTotalCost - 17.8763) < 0.001);
  assert.ok(Math.abs(result.netSaving - -1.1525) < 0.001);
});

test("rejects invalid routine journey inputs", () => {
  assert.throws(() => calculateRoutineJourney({
    nearbyPricePence: 172.9,
    awayPricePence: 167.9,
    distanceMiles: 5,
    routineMiles: 0,
    mpgUk: 47,
  }));
});

test("classifies worthwhile and break-even routine journeys", () => {
  const worthwhile = calculateRoutineJourney({
    nearbyPricePence: 150,
    awayPricePence: 140,
    distanceMiles: 0,
    routineMiles: 100,
    mpgUk: 47,
  });
  const breakEven = calculateRoutineJourney({
    nearbyPricePence: 150,
    awayPricePence: 150,
    distanceMiles: 0,
    routineMiles: 100,
    mpgUk: 47,
  });

  assert.equal(worthwhile.decision, "good");
  assert.equal(breakEven.decision, "even");
  assert.equal(breakEven.netSaving, 0);
});
