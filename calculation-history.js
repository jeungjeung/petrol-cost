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
    nearby_price_pence: inputs.nearbyPricePence,
    away_price_pence: inputs.awayPricePence,
    distance_miles: inputs.distanceMiles,
    litres: inputs.litres,
    gross_saving: result.grossSaving,
    travel_cost: result.travelCost,
    net_saving: result.netSaving,
    decision: result.decision,
  };
}

export function getDecisionLabel(decision) {
  if (decision === "good") return "Worth travelling";
  if (decision === "bad") return "Not worth travelling";
  if (decision === "even") return "Break-even";
  throw new Error("Unknown calculation decision.");
}
