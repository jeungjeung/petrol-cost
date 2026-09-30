import assert from "node:assert/strict";
import test from "node:test";
import { calculateComparison } from "../calculations.js";
import { getDecisionLabel, mapCalculationToHistoryRow } from "../calculation-history.js";

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
    nearby_price_pence: 150,
    away_price_pence: 140,
    distance_miles: 5,
    litres: 40,
    gross_saving: 4,
    travel_cost: calculateComparison({ nearbyPricePence: 150, awayPricePence: 140, distanceMiles: 5, litres: 40, mpgUk: 47 }).travelCost,
    net_saving: calculateComparison({ nearbyPricePence: 150, awayPricePence: 140, distanceMiles: 5, litres: 40, mpgUk: 47 }).netSaving,
    decision: "good",
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
