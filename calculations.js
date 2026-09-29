export const IMPERIAL_GALLON_LITRES = 4.54609;

export function calculateCostPerMile(pricePencePerLitre, mpgUk) {
  if (pricePencePerLitre <= 0 || mpgUk <= 0) {
    throw new Error("Petrol price and UK MPG must be positive values.");
  }
  return ((pricePencePerLitre / 100) * IMPERIAL_GALLON_LITRES) / mpgUk;
}

export function calculateComparison({
  nearbyPricePence,
  awayPricePence,
  distanceMiles,
  litres,
  mpgUk,
}) {
  const values = [nearbyPricePence, awayPricePence, distanceMiles, litres, mpgUk];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("All comparison values must be numbers.");
  }
  if (nearbyPricePence <= 0 || awayPricePence <= 0 || distanceMiles < 0 || litres <= 0 || mpgUk <= 0) {
    throw new Error("Prices, litres, and MPG must be positive; distance cannot be negative.");
  }

  const costPerMile = calculateCostPerMile(nearbyPricePence, mpgUk);
  const roundTripDistance = distanceMiles * 2;
  const travelCost = roundTripDistance * costPerMile;
  const grossSaving = ((nearbyPricePence - awayPricePence) / 100) * litres;
  const netSaving = grossSaving - travelCost;

  return {
    costPerMile,
    roundTripDistance,
    travelCost,
    grossSaving,
    netSaving,
    decision: netSaving > 0 ? "good" : netSaving < 0 ? "bad" : "even",
  };
}
