import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";
import { calculateComparison as calculateComparisonValues, calculateCostPerMile } from "./calculations.js";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const SESSION_IDLE_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_ACTIVITY_KEY = "petrol-cost-last-active";
let isSignupMode = false;
let currentSession = null;

const state = {
  cars: [{ id: "default-car", name: "Default Car", mpgUk: 47 }],
  selectedCarId: "default-car",
  userId: null,
  previewMode: true,
  lastCalculation: null,
};

const elements = {
  authView: document.querySelector("#auth-view"),
  appView: document.querySelector("#app-view"),
  historyView: document.querySelector("#history-view"),
  authForm: document.querySelector("#auth-form"),
  authFormTitle: document.querySelector("#auth-form-title"),
  authSubmit: document.querySelector("#auth-submit"),
  authMessage: document.querySelector("#auth-message"),
  showSignup: document.querySelector("#show-signup"),
  previewCalculator: document.querySelector("#preview-calculator"),
  signOut: document.querySelector("#sign-out"),
  showHistory: document.querySelector("#show-history"),
  backToCalculator: document.querySelector("#back-to-calculator"),
  carSelect: document.querySelector("#car-select"),
  carSummary: document.querySelector("#car-summary"),
  manageCars: document.querySelector("#manage-cars"),
  carDialog: document.querySelector("#car-dialog"),
  closeCarDialog: document.querySelector("#close-car-dialog"),
  carList: document.querySelector("#car-list"),
  carForm: document.querySelector("#car-form"),
  carFormTitle: document.querySelector("#car-form-title"),
  editingCarId: document.querySelector("#editing-car-id"),
  carName: document.querySelector("#car-name"),
  carMpg: document.querySelector("#car-mpg"),
  cancelCarEdit: document.querySelector("#cancel-car-edit"),
  comparisonForm: document.querySelector("#comparison-form"),
  resultCard: document.querySelector("#result-card"),
  resultTitle: document.querySelector("#result-title"),
  resultSummary: document.querySelector("#result-summary"),
  netSaving: document.querySelector("#net-saving"),
  grossSaving: document.querySelector("#gross-saving"),
  travelCost: document.querySelector("#travel-cost"),
  roundTripDistance: document.querySelector("#round-trip-distance"),
  saveCalculationPanel: document.querySelector("#save-calculation-panel"),
  saveDescription: document.querySelector("#save-description"),
  saveCalculation: document.querySelector("#save-calculation"),
  saveMessage: document.querySelector("#save-message"),
  historyMessage: document.querySelector("#history-message"),
  historyList: document.querySelector("#history-list"),
};

const formatMoney = (value) => `£${value.toFixed(2)}`;

function getSelectedCar() {
  return state.cars.find((car) => car.id === state.selectedCarId);
}

function renderCarSummary() {
  const selectedCar = getSelectedCar();
  if (!selectedCar) {
    elements.carSummary.textContent = state.cars.length === 0
      ? "Add a car to calculate your fuel cost per mile."
      : "Select a car to continue.";
    return;
  }

  const nearbyPricePence = Number(document.querySelector("#near-price").value);
  const costText = nearbyPricePence > 0
    ? `${formatMoney(calculateCostPerMile(nearbyPricePence, selectedCar.mpgUk))} per mile at ${nearbyPricePence}p/litre.`
    : "Enter the nearby petrol price to see cost per mile.";
  elements.carSummary.textContent = `${selectedCar.mpgUk} UK MPG · ${costText}`;
}

function renderCars() {
  elements.carSelect.replaceChildren();

  if (state.cars.length === 0) {
    elements.carSelect.add(new Option("No cars saved yet", ""));
  } else {
    state.cars.forEach((car) => {
      elements.carSelect.add(new Option(car.name, car.id, false, car.id === state.selectedCarId));
    });
  }
  renderCarSummary();

  elements.carList.replaceChildren();
  if (state.cars.length === 0) {
    const empty = document.createElement("p");
    empty.className = "car-summary";
    empty.textContent = "No cars saved yet.";
    elements.carList.append(empty);
    return;
  }

  state.cars.forEach((car) => {
    const row = document.createElement("div");
    row.className = "car-row";
    row.innerHTML = `<div><strong>${escapeHtml(car.name)}</strong><span>${car.mpgUk} UK MPG</span></div>`;
    const actions = document.createElement("div");
    actions.className = "car-row-actions";
    actions.append(
      createTextButton("Select", () => {
        state.selectedCarId = car.id;
        renderCars();
        elements.carDialog.close();
      }),
      createTextButton("Edit", () => startCarEdit(car)),
      createTextButton("Delete", () => deleteCar(car)),
    );
    row.append(actions);
    elements.carList.append(row);
  });
}

function createTextButton(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "text-button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

function formatHistoryDate(value) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function decisionLabel(decision) {
  return decision === "good" ? "Worth travelling" : decision === "bad" ? "Not worth travelling" : "Break-even";
}

function showCalculator() {
  elements.historyView.classList.add("is-hidden");
  elements.appView.classList.remove("is-hidden");
}

function showHistory() {
  if (state.previewMode) return;
  elements.appView.classList.add("is-hidden");
  elements.historyView.classList.remove("is-hidden");
  loadHistory();
}

function renderHistory(items) {
  elements.historyList.replaceChildren();
  if (items.length === 0) {
    elements.historyMessage.textContent = "No saved calculations yet.";
    return;
  }

  elements.historyMessage.textContent = `${items.length} saved calculation${items.length === 1 ? "" : "s"}`;
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = `history-item decision-${item.decision}`;
    const description = item.description ? `<p class="history-item-description">${escapeHtml(item.description)}</p>` : "";
    card.innerHTML = `
      <div class="history-item-header">
        <div>
          <h2>${escapeHtml(decisionLabel(item.decision))}</h2>
          <p class="history-item-date">${escapeHtml(formatHistoryDate(item.created_at))}</p>
        </div>
        <strong>${escapeHtml(item.car_name)}</strong>
      </div>
      ${description}
      <dl class="history-item-details">
        <div><dt>Nearby</dt><dd>${item.nearby_price_pence}p/litre</dd></div>
        <div><dt>Away</dt><dd>${item.away_price_pence}p/litre</dd></div>
        <div><dt>Distance</dt><dd>${item.distance_miles} miles one way</dd></div>
        <div><dt>Fuel</dt><dd>${item.litres} litres</dd></div>
        <div><dt>Net saving</dt><dd>${formatMoney(Number(item.net_saving))}</dd></div>
      </dl>
    `;
    const actions = document.createElement("div");
    actions.className = "history-item-actions";
    actions.append(
      createTextButton("Use inputs", () => useHistoryInputs(item)),
      createTextButton("Delete", () => deleteHistoryItem(item)),
    );
    card.append(actions);
    elements.historyList.append(card);
  });
}

function useHistoryInputs(item) {
  showCalculator();
  document.querySelector("#near-price").value = item.nearby_price_pence;
  document.querySelector("#away-price").value = item.away_price_pence;
  document.querySelector("#distance").value = item.distance_miles;
  document.querySelector("#litres").value = item.litres;
  elements.saveMessage.textContent = "Previous inputs loaded. Review them, then calculate again.";
  document.querySelector("#near-price").focus();
}

function startCarEdit(car) {
  elements.carFormTitle.textContent = "Edit car";
  elements.editingCarId.value = car.id;
  elements.carName.value = car.name;
  elements.carMpg.value = car.mpgUk;
  elements.carName.focus();
}

function resetCarForm() {
  elements.carForm.reset();
  elements.editingCarId.value = "";
  elements.carFormTitle.textContent = "Add a car";
}

async function deleteCar(car) {
  if (state.cars.length === 1) {
    elements.carSummary.textContent = "Keep at least one saved car. Add another car before deleting this one.";
    return;
  }

  if (!window.confirm(`Delete ${car.name}?`)) return;

  if (!state.previewMode) {
    const { error } = await supabase
      .from("cars")
      .delete()
      .eq("id", car.id)
      .eq("user_id", state.userId);
    if (error) {
      elements.carSummary.textContent = `Could not delete car: ${error.message}`;
      return;
    }
  }

  state.cars = state.cars.filter((item) => item.id !== car.id);
  if (state.selectedCarId === car.id) state.selectedCarId = state.cars[0]?.id || "";
  renderCars();
}

function calculateComparison(event) {
  event.preventDefault();
  const car = getSelectedCar();
  if (!car) {
    elements.resultCard.classList.remove("is-hidden");
    elements.resultTitle.textContent = "Select a car first";
    elements.resultSummary.textContent = "Choose or add a car before calculating the comparison.";
    return;
  }

  const comparisonValues = {
    nearbyPricePence: Number(document.querySelector("#near-price").value),
    awayPricePence: Number(document.querySelector("#away-price").value),
    distanceMiles: Number(document.querySelector("#distance").value),
    litres: Number(document.querySelector("#litres").value),
    mpgUk: car.mpgUk,
  };

  let result;
  try {
    result = calculateComparisonValues(comparisonValues);
  } catch (error) {
    state.lastCalculation = null;
    elements.saveCalculationPanel.classList.add("is-hidden");
    elements.resultCard.classList.remove("is-hidden", "decision-good", "decision-bad");
    elements.resultCard.classList.add("decision-even");
    elements.resultTitle.textContent = "Check your inputs";
    elements.resultSummary.textContent = error.message;
    return;
  }

  elements.resultCard.classList.remove("is-hidden");
  elements.resultCard.classList.remove("decision-good", "decision-bad", "decision-even");
  elements.resultCard.classList.add(`decision-${result.decision}`);
  elements.resultTitle.textContent = result.decision === "good" ? "Worth travelling" : result.decision === "bad" ? "Not worth travelling" : "Break-even";
  const netAmount = formatMoney(Math.abs(result.netSaving));
  elements.resultSummary.innerHTML = result.decision === "good"
    ? `The away station would save <strong class="result-highlight">${netAmount}</strong> after the journey.`
    : `The journey would cost <strong class="result-highlight">${netAmount}</strong> more than it saves.`;
  elements.netSaving.textContent = formatMoney(result.netSaving);
  elements.grossSaving.textContent = formatMoney(result.grossSaving);
  elements.travelCost.textContent = formatMoney(result.travelCost);
  elements.roundTripDistance.textContent = `${result.roundTripDistance.toFixed(1)} miles`;
  state.lastCalculation = { car, inputs: comparisonValues, result };
  elements.saveCalculationPanel.classList.toggle("is-hidden", state.previewMode);
  elements.saveMessage.textContent = state.previewMode ? "Sign in to save this calculation." : "";
}

elements.authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  authenticateUser();
});

elements.showSignup.addEventListener("click", () => {
  isSignupMode = !isSignupMode;
  elements.authFormTitle.textContent = isSignupMode ? "Create an account" : "Sign in";
  elements.authSubmit.textContent = isSignupMode ? "Create account" : "Sign in";
  elements.showSignup.textContent = isSignupMode ? "Already have an account? Sign in" : "Create an account";
  elements.authMessage.textContent = "";
});

elements.previewCalculator.addEventListener("click", () => {
  state.previewMode = true;
  elements.authView.classList.add("is-hidden");
  elements.appView.classList.remove("is-hidden");
  elements.authMessage.textContent = "";
});

elements.signOut.addEventListener("click", () => {
  supabase.auth.signOut();
});

elements.showHistory.addEventListener("click", showHistory);
elements.backToCalculator.addEventListener("click", showCalculator);
elements.saveCalculation.addEventListener("click", saveCalculation);

elements.carSelect.addEventListener("change", (event) => {
  state.selectedCarId = event.target.value;
  renderCars();
});

document.querySelector("#near-price").addEventListener("input", renderCarSummary);

elements.manageCars.addEventListener("click", () => elements.carDialog.showModal());
elements.closeCarDialog.addEventListener("click", () => elements.carDialog.close());
elements.cancelCarEdit.addEventListener("click", resetCarForm);
elements.comparisonForm.addEventListener("submit", calculateComparison);

elements.carForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = elements.carName.value.trim();
  const mpgUk = Number(elements.carMpg.value);
  if (!name || mpgUk <= 0) return;

  const existingId = elements.editingCarId.value;
  const duplicateName = state.cars.some((car) => car.name.toLowerCase() === name.toLowerCase() && car.id !== existingId);
  if (duplicateName) {
    elements.carSummary.textContent = "Use a different name for each saved car.";
    return;
  }
  const savedCar = await saveCar({ id: existingId, name, mpgUk });
  if (!savedCar) return;

  if (existingId) {
    const carIndex = state.cars.findIndex((item) => item.id === existingId);
    state.cars[carIndex] = savedCar;
  } else {
    state.cars.push(savedCar);
    state.selectedCarId = savedCar.id;
  }
  renderCars();
  resetCarForm();
});

renderCars();

async function authenticateUser() {
  const email = document.querySelector("#auth-email").value.trim();
  const password = document.querySelector("#auth-password").value;
  elements.authMessage.textContent = "Working…";

  const result = isSignupMode
    ? await supabase.auth.signUp({ email, password })
    : await supabase.auth.signInWithPassword({ email, password });

  if (result.error) {
    elements.authMessage.textContent = result.error.message;
    return;
  }

  if (isSignupMode && !result.data.session) {
    elements.authMessage.textContent = "Account created. Check your email to confirm your address, then sign in.";
  }
}

function renderSession(session) {
  const isSignedIn = Boolean(session);
  elements.authView.classList.toggle("is-hidden", isSignedIn);
  elements.appView.classList.toggle("is-hidden", !isSignedIn);
  elements.historyView.classList.add("is-hidden");
  elements.showHistory.classList.toggle("is-hidden", !isSignedIn);

  if (isSignedIn) {
    state.previewMode = false;
    state.userId = session.user.id;
    loadCars();
    loadHistory();
  } else {
    state.previewMode = true;
    state.userId = null;
    state.lastCalculation = null;
    elements.saveCalculationPanel.classList.add("is-hidden");
    elements.saveDescription.value = "";
    elements.saveMessage.textContent = "";
    state.cars = [{ id: "default-car", name: "Default Car", mpgUk: 47 }];
    state.selectedCarId = "default-car";
    renderCars();
  }
}

async function handleSession(session) {
  if (session && isSessionExpired()) {
    localStorage.removeItem(SESSION_ACTIVITY_KEY);
    await supabase.auth.signOut();
    return;
  }

  currentSession = session;
  if (session) markSessionActive();
  else localStorage.removeItem(SESSION_ACTIVITY_KEY);
  renderSession(session);
}

function isSessionExpired() {
  const lastActive = Number(localStorage.getItem(SESSION_ACTIVITY_KEY));
  return lastActive > 0 && Date.now() - lastActive >= SESSION_IDLE_LIMIT_MS;
}

function markSessionActive() {
  localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
}

function recordSessionActivity() {
  if (currentSession && !isSessionExpired()) markSessionActive();
}

window.addEventListener("pointerdown", recordSessionActivity);
window.addEventListener("keydown", recordSessionActivity);
window.setInterval(() => {
  if (currentSession && isSessionExpired()) supabase.auth.signOut();
}, 60 * 1000);

supabase.auth.onAuthStateChange((_event, session) => {
  handleSession(session);
});

supabase.auth.getSession().then(({ data }) => handleSession(data.session));

async function loadCars() {
  elements.carSummary.textContent = "Loading saved cars…";
  const { data, error } = await supabase
    .from("cars")
    .select("id, name, mpg_uk")
    .order("name");

  if (error) {
    elements.carSummary.textContent = `Could not load saved cars: ${error.message}`;
    return;
  }

  state.cars = data.map((car) => ({ id: car.id, name: car.name, mpgUk: Number(car.mpg_uk) }));
  if (state.cars.length === 0) {
    const { data: defaultCar, error: defaultError } = await supabase
      .from("cars")
      .insert({ user_id: state.userId, name: "Default Car", mpg_uk: 47 })
      .select("id, name, mpg_uk")
      .single();

    if (defaultError) {
      elements.carSummary.textContent = `Could not create the default car: ${defaultError.message}`;
      renderCars();
      return;
    }

    state.cars = [{ id: defaultCar.id, name: defaultCar.name, mpgUk: Number(defaultCar.mpg_uk) }];
  }

  state.selectedCarId = state.cars[0].id;
  renderCars();
}

async function saveCar({ id, name, mpgUk }) {
  if (state.previewMode) {
    return { id: id || crypto.randomUUID(), name, mpgUk };
  }

  const query = id
    ? supabase.from("cars").update({ name, mpg_uk: mpgUk }).eq("id", id).eq("user_id", state.userId)
    : supabase.from("cars").insert({ user_id: state.userId, name, mpg_uk: mpgUk });
  const { data, error } = await query.select("id, name, mpg_uk").single();

  if (error) {
    elements.carSummary.textContent = `Could not save car: ${error.message}`;
    return null;
  }

  return { id: data.id, name: data.name, mpgUk: Number(data.mpg_uk) };
}

async function saveCalculation() {
  if (state.previewMode || !state.lastCalculation) {
    elements.saveMessage.textContent = "Sign in and calculate a result before saving.";
    return;
  }

  elements.saveMessage.textContent = "Saving…";
  const { car, inputs, result } = state.lastCalculation;
  const description = elements.saveDescription.value.trim() || null;
  const { error } = await supabase.from("calculation_history").insert({
    user_id: state.userId,
    description,
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
  });

  if (error) {
    elements.saveMessage.textContent = `Could not save calculation: ${error.message}`;
    return;
  }

  elements.saveDescription.value = "";
  elements.saveMessage.textContent = "Calculation saved.";
  await loadHistory();
}

async function loadHistory() {
  if (state.previewMode || !state.userId) return;
  const { data, error } = await supabase
    .from("calculation_history")
    .select("id, description, car_name, mpg_uk, nearby_price_pence, away_price_pence, distance_miles, litres, gross_saving, travel_cost, net_saving, decision, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    elements.historyMessage.textContent = `Could not load history: ${error.message}`;
    return;
  }

  renderHistory(data);
}

async function deleteHistoryItem(item) {
  if (!window.confirm("Delete this saved calculation?")) return;

  const { error } = await supabase
    .from("calculation_history")
    .delete()
    .eq("id", item.id)
    .eq("user_id", state.userId);

  if (error) {
    elements.historyMessage.textContent = `Could not delete history item: ${error.message}`;
    return;
  }

  await loadHistory();
}
