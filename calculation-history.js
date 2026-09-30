export function mapCalculationToHistoryRow({ userId, description, car, inputs, result }) {
  if (!userId) throw new Error("A signed-in user is required to save calculation history.");
  if (!car?.name || !Number.isFinite(car.mpgUk)) throw new Error("A valid car snapshot is required.");

  const cleanedDescription = description?.trim() || null;
  if (cleanedDescription && cleanedDescription.length > 200) {
    throw new Error("Description must be 200 characters or fewer.");
  }

  return {
    user_id: userId,
    description: cleanedDescription,
    car_name: car.name,
    mpg_uk: car.mpgUk,
    calculation_mode: inputs.calculationMode || "fuel_amount",
    nearby_price_pence: inputs.nearbyPricePence,
    away_price_pence: inputs.awayPricePence,
    distance_miles: inputs.distanceMiles,
    routine_distance_miles: inputs.routineMiles ?? null,
    litres: inputs.litres ?? null,
    gross_saving: result.grossSaving,
    travel_cost: result.travelCost,
    net_saving: result.netSaving,
    baseline_cost: result.baselineCost ?? null,
    outbound_cost: result.outboundCost ?? null,
    return_cost: result.returnCost ?? null,
    routine_away_cost: result.routineAwayCost ?? null,
    away_total_cost: result.awayTotalCost ?? null,
    decision: result.decision,
  };
}

export function mapHistoryRowToInputs(item) {
  const calculationMode = item.calculation_mode === "routine_journey" ? "routine_journey" : "fuel_amount";
  const inputs = {
    calculationMode,
    nearbyPricePence: Number(item.nearby_price_pence),
    awayPricePence: Number(item.away_price_pence),
    distanceMiles: Number(item.distance_miles),
  };

  if (calculationMode === "routine_journey") {
    inputs.routineMiles = Number(item.routine_distance_miles);
  } else {
    inputs.litres = Number(item.litres);
  }

  return inputs;
}

export function getDecisionLabel(decision) {
  if (decision === "good") return "Worth travelling";
  if (decision === "bad") return "Not worth travelling";
  if (decision === "even") return "Break-even";
  throw new Error("Unknown calculation decision.");
}
