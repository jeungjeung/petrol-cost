const IMPERIAL_GALLON_LITRES = 4.54609;

const state = {
  cars: [],
  selectedCarId: "",
};

const elements = {
  authView: document.querySelector("#auth-view"),
  appView: document.querySelector("#app-view"),
  authForm: document.querySelector("#auth-form"),
  authMessage: document.querySelector("#auth-message"),
  showSignup: document.querySelector("#show-signup"),
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
  elements.authMessage.textContent = "Authentication will be connected to Supabase in the next step.";
});

elements.showSignup.addEventListener("click", () => {
  elements.authMessage.textContent = "Account creation will be connected to Supabase in the next step.";
});

elements.signOut.addEventListener("click", () => {
  elements.appView.classList.add("is-hidden");
  elements.authView.classList.remove("is-hidden");
});

elements.carSelect.addEventListener("change", (event) => {
  state.selectedCarId = event.target.value;
  renderCars();
});

elements.manageCars.addEventListener("click", () => elements.carDialog.showModal());
elements.closeCarDialog.addEventListener("click", () => elements.carDialog.close());
elements.cancelCarEdit.addEventListener("click", resetCarForm);
elements.comparisonForm.addEventListener("submit", calculateComparison);

elements.carForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = elements.carName.value.trim();
  const mpgUk = Number(elements.carMpg.value);
  if (!name || mpgUk <= 0) return;

  const existingId = elements.editingCarId.value;
  if (existingId) {
    const car = state.cars.find((item) => item.id === existingId);
    car.name = name;
    car.mpgUk = mpgUk;
  } else {
    const id = crypto.randomUUID();
    state.cars.push({ id, name, mpgUk });
    state.selectedCarId = id;
  }
  renderCars();
  resetCarForm();
});

renderCars();
