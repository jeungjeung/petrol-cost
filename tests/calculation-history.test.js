import assert from "node:assert/strict";
import test from "node:test";
import { calculateComparison, calculateRoutineJourney } from "../calculations.js";
import { getDecisionLabel, mapCalculationToHistoryRow, mapHistoryRowToInputs } from "../calculation-history.js";

const car = { id: "car-1", name: "RAV4", mpgUk: 47 };

function makeHistoryRow({ nearbyPricePence = 150, awayPricePence = 140, distanceMiles = 5, litres = 40, mpgUk = car.mpgUk, description = "Test run" } = {}) {
  const inputs = { nearbyPricePence, awayPricePence, distanceMiles, litres, mpgUk };
  const result = calculateComparison(inputs);
  return mapCalculationToHistoryRow({
    userId: "user-1",
    description,
    car: { ...car, mpgUk },
    inputs,
    result,
  });
}

test("maps calculation inputs, car snapshot, result, and description to database columns", () => {
  assert.deepEqual(makeHistoryRow(), {
    user_id: "user-1",
    description: "Test run",
    car_name: "RAV4",
    mpg_uk: 47,
    calculation_mode: "fuel_amount",
    nearby_price_pence: 150,
    away_price_pence: 140,
    distance_miles: 5,
    routine_distance_miles: null,
    litres: 40,
    gross_saving: 4,
    travel_cost: calculateComparison({ nearbyPricePence: 150, awayPricePence: 140, distanceMiles: 5, litres: 40, mpgUk: 47 }).travelCost,
    net_saving: calculateComparison({ nearbyPricePence: 150, awayPricePence: 140, distanceMiles: 5, litres: 40, mpgUk: 47 }).netSaving,
    baseline_cost: null,
    outbound_cost: null,
    return_cost: null,
    routine_away_cost: null,
    away_total_cost: null,
    decision: "good",
  });
});

test("maps routine journey mode and all of its inputs and result components", () => {
  const inputs = {
    calculationMode: "routine_journey",
    nearbyPricePence: 172.9,
    awayPricePence: 167.9,
    distanceMiles: 5,
    routineMiles: 100,
    mpgUk: 47,
  };
  const result = calculateRoutineJourney(inputs);
  const row = mapCalculationToHistoryRow({ userId: "user-1", description: "Routine", car, inputs, result });

  assert.equal(row.calculation_mode, "routine_journey");
  assert.equal(row.distance_miles, 5);
  assert.equal(row.routine_distance_miles, 100);
  assert.equal(row.litres, null);
  assert.ok(Math.abs(row.baseline_cost - 16.7238) < 0.001);
  assert.ok(Math.abs(row.outbound_cost - 0.8241) < 0.001);
  assert.ok(Math.abs(row.return_cost - 0.8120) < 0.001);
  assert.ok(Math.abs(row.routine_away_cost - 16.2402) < 0.001);
  assert.ok(Math.abs(row.away_total_cost - 17.8763) < 0.001);
});

test("restores saved inputs for each mode and defaults older rows to fuel amount mode", () => {
  const routine = mapHistoryRowToInputs({
    calculation_mode: "routine_journey",
    nearby_price_pence: 172.9,
    away_price_pence: 167.9,
    distance_miles: 5,
    routine_distance_miles: 100,
  });
  const legacy = mapHistoryRowToInputs({
    nearby_price_pence: 150,
    away_price_pence: 140,
    distance_miles: 5,
    litres: 40,
  });

  assert.deepEqual(routine, {
    calculationMode: "routine_journey",
    nearbyPricePence: 172.9,
    awayPricePence: 167.9,
    distanceMiles: 5,
    routineMiles: 100,
  });
  assert.deepEqual(legacy, {
    calculationMode: "fuel_amount",
    nearbyPricePence: 150,
    awayPricePence: 140,
    distanceMiles: 5,
    litres: 40,
  });
});

test("stores a blank optional description as null and trims supplied descriptions", () => {
  assert.equal(makeHistoryRow({ description: "   " }).description, null);
  assert.equal(makeHistoryRow({ description: "  Errand  " }).description, "Errand");
});

test("maps all calculation decisions to their history labels", () => {
  const good = makeHistoryRow({ distanceMiles: 5 });
  const bad = makeHistoryRow({ awayPricePence: 145, distanceMiles: 10 });
  const even = makeHistoryRow({ awayPricePence: 150, distanceMiles: 0 });

  assert.equal(good.decision, "good");
  assert.equal(getDecisionLabel(good.decision), "Worth travelling");
  assert.equal(bad.decision, "bad");
  assert.equal(getDecisionLabel(bad.decision), "Not worth travelling");
  assert.equal(even.decision, "even");
  assert.equal(getDecisionLabel(even.decision), "Break-even");
});

test("rejects missing user, overlong descriptions, and unknown decisions", () => {
  assert.throws(() => mapCalculationToHistoryRow({ userId: "", car, inputs: {}, result: {} }), /signed-in user/);
  assert.throws(() => makeHistoryRow({ description: "x".repeat(201) }), /200 characters/);
  assert.throws(() => getDecisionLabel("unknown"), /Unknown calculation decision/);
});
