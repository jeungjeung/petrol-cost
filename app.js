import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const IMPERIAL_GALLON_LITRES = 4.54609;
let isSignupMode = false;

const state = {
  cars: [{ id: "default-car", name: "Default Car", mpgUk: 47 }],
  selectedCarId: "default-car",
  userId: null,
  previewMode: true,
};

const elements = {
  authView: document.querySelector("#auth-view"),
  appView: document.querySelector("#app-view"),
  authForm: document.querySelector("#auth-form"),
  authFormTitle: document.querySelector("#auth-form-title"),
  authSubmit: document.querySelector("#auth-submit"),
  authMessage: document.querySelector("#auth-message"),
  showSignup: document.querySelector("#show-signup"),
  previewCalculator: document.querySelector("#preview-calculator"),
  signOut: document.querySelector("#sign-out"),
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
};

const formatMoney = (value) => `£${value.toFixed(2)}`;

function getSelectedCar() {
  return state.cars.find((car) => car.id === state.selectedCarId);
}

function renderCars() {
  elements.carSelect.replaceChildren();

  if (state.cars.length === 0) {
    elements.carSelect.add(new Option("No cars saved yet", ""));
    elements.carSummary.textContent = "Add a car to calculate your fuel cost per mile.";
  } else {
    state.cars.forEach((car) => {
      elements.carSelect.add(new Option(car.name, car.id, false, car.id === state.selectedCarId));
    });
    const selectedCar = getSelectedCar();
    const costPerMile = selectedCar ? "Add a petrol price to see the exact cost per mile." : "Select a car to continue.";
    elements.carSummary.textContent = selectedCar
      ? `${selectedCar.mpgUk} UK MPG. ${costPerMile}`
      : "Select a car to continue.";
  }

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

  const nearbyPrice = Number(document.querySelector("#near-price").value) / 100;
  const awayPrice = Number(document.querySelector("#away-price").value) / 100;
  const distance = Number(document.querySelector("#distance").value);
  const litres = Number(document.querySelector("#litres").value);
  const costPerMile = (nearbyPrice * IMPERIAL_GALLON_LITRES) / car.mpgUk;
  const travelCost = distance * 2 * costPerMile;
  const grossSaving = (nearbyPrice - awayPrice) * litres;
  const netSaving = grossSaving - travelCost;

  elements.resultCard.classList.remove("is-hidden");
  elements.resultCard.classList.remove("decision-good", "decision-bad", "decision-even");
  const decision = netSaving > 0 ? "good" : netSaving < 0 ? "bad" : "even";
  elements.resultCard.classList.add(`decision-${decision}`);
  elements.resultTitle.textContent = netSaving > 0 ? "Worth travelling" : netSaving < 0 ? "Not worth travelling" : "Break-even";
  elements.resultSummary.textContent = netSaving > 0
    ? `The away station would save ${formatMoney(netSaving)} after the journey.`
    : `The journey would cost ${formatMoney(Math.abs(netSaving))} more than it saves.`;
  elements.netSaving.textContent = formatMoney(netSaving);
  elements.grossSaving.textContent = formatMoney(grossSaving);
  elements.travelCost.textContent = formatMoney(travelCost);
  elements.roundTripDistance.textContent = `${(distance * 2).toFixed(1)} miles`;
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

elements.carSelect.addEventListener("change", (event) => {
  state.selectedCarId = event.target.value;
  renderCars();
});

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

  if (isSignedIn) {
    state.previewMode = false;
    state.userId = session.user.id;
    loadCars();
  } else {
    state.previewMode = true;
    state.userId = null;
    state.cars = [{ id: "default-car", name: "Default Car", mpgUk: 47 }];
    state.selectedCarId = "default-car";
    renderCars();
  }
}

supabase.auth.onAuthStateChange((_event, session) => {
  renderSession(session);
});

supabase.auth.getSession().then(({ data }) => renderSession(data.session));

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
