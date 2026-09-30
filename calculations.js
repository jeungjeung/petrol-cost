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

export function calculateRoutineJourney({
  nearbyPricePence,
  awayPricePence,
  distanceMiles,
  routineMiles,
  mpgUk,
}) {
  const values = [nearbyPricePence, awayPricePence, distanceMiles, routineMiles, mpgUk];
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("All comparison values must be numbers.");
  }
  if (nearbyPricePence <= 0 || awayPricePence <= 0 || distanceMiles < 0 || routineMiles <= 0 || mpgUk <= 0) {
    throw new Error("Prices, routine distance, and MPG must be positive; station distance cannot be negative.");
  }

  const litresPerMile = IMPERIAL_GALLON_LITRES / mpgUk;
  const nearbyPrice = nearbyPricePence / 100;
  const awayPrice = awayPricePence / 100;
  const averagePrice = (nearbyPrice + awayPrice) / 2;
  const baselineCost = routineMiles * litresPerMile * nearbyPrice;
  const outboundCost = distanceMiles * litresPerMile * averagePrice;
  const returnCost = distanceMiles * litresPerMile * awayPrice;
  const routineAwayCost = routineMiles * litresPerMile * awayPrice;
  const awayTotalCost = outboundCost + returnCost + routineAwayCost;
  const grossSaving = baselineCost - routineAwayCost;
  const travelCost = outboundCost + returnCost;
  const netSaving = baselineCost - awayTotalCost;

  return {
    litresPerMile,
    baselineCost,
    outboundCost,
    returnCost,
    routineAwayCost,
    awayTotalCost,
    grossSaving,
    travelCost,
    netSaving,
    roundTripDistance: distanceMiles * 2,
    decision: netSaving > 0 ? "good" : netSaving < 0 ? "bad" : "even",
  };
}
