const SITE_PASSWORD = "Stoyt_sf21";
const PASSWORD_SESSION_KEY = "stoyt-tvormegi-authenticated";

function unlockSite() {
  document.body.classList.remove("auth-locked");
  document.querySelector("#passwordScreen")?.setAttribute("hidden", "");
}

function setupPasswordGate() {
  const passwordScreen = document.querySelector("#passwordScreen");
  const passwordForm = document.querySelector("#passwordForm");
  const passwordInput = document.querySelector("#sitePassword");
  const passwordError = document.querySelector("#passwordError");

  if (!passwordScreen || !passwordForm || !passwordInput) return;

  if (sessionStorage.getItem(PASSWORD_SESSION_KEY) === "true") {
    unlockSite();
    return;
  }

  passwordInput.focus();

  passwordForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (passwordInput.value === SITE_PASSWORD) {
      sessionStorage.setItem(PASSWORD_SESSION_KEY, "true");
      unlockSite();
      return;
    }

    if (passwordError) passwordError.hidden = false;
    passwordInput.value = "";
    passwordInput.focus();
  });
}

setupPasswordGate();

const defaultMemberships = [
  { id: "adult", name: "Vaksin", cost: 350, members: 10 },
  { id: "youth", name: "Ung", cost: 260, members: 10 },
  { id: "shared", name: "Stoyt / Tvørmegi", cost: 270, members: 0 },
  { id: "partial", name: "Partvís hald", cost: 180, members: 0 },
];

const defaultTerms = {
  firstMembersToTvoormegi: 14,
  stoytShareAtFirstExtraMember: 0.5,
  increasePerMember: 0.01,
  maxStoytShare: 0.7,
  sharedFullPrice: 650,
  showTvoormegiKombiIncome: true,
};

const STORAGE_KEY = "stoyt-tvormegi-calculator-v3";
let memberships = structuredClone(defaultMemberships);
let terms = { ...defaultTerms };

const membershipRows = document.querySelector("#membershipRows");
const termsInputs = document.querySelector("#termsInputs");
const projectionRows = document.querySelector("#projectionRows");
const projectionMax = document.querySelector("#projectionMax");
const linkNotice = document.querySelector("#linkNotice");

const termConfig = [
  {
    key: "firstMembersToTvoormegi",
    label: "Limamark áðrenn býti",
    help: "Tal av limum, sum Tvørmegi fær grundupphæddina fyri.",
    step: 1,
    min: 0,
    suffix: "limir",
  },
  {
    key: "stoytShareAtFirstExtraMember",
    label: "Byrjunar prosent",
    help: "Hetta er fyrsti limurin eftir limamarkið, har býtið byrjar.",
    step: 1,
    min: 0,
    max: 100,
    percent: true,
    suffix: "%",
  },
  {
    key: "increasePerMember",
    label: "Prosenthækking fyri hvønn eyka lim",
    help: "Hvussu nógv prosent býti hækkar fyri hvønn eyka lim sum legst afturat limamarkinum",
    step: 1,
    min: 0,
    max: 100,
    percent: true,
    suffix: "%",
  },
  {
    key: "maxStoytShare",
    label: "Hámarks prosent",
    help: "Hægsta prosent býti, sum kann leggjast á eyka inntøkurnar",
    step: 1,
    min: 0,
    max: 100,
    percent: true,
    suffix: "%",
  },
  {
    key: "sharedFullPrice",
    label: "Samlaður kostnaður fyri Stoyt / Tvørmegi hald",
    help: "Samlaða býti hjá Stoyt og Tvørmegi fyri Stoyt / Tvørmegi haldið",
    step: 1,
    min: 0,
    suffix: "kr",
  },
];

function formatKr(value) {
  const number = Number.isFinite(value) ? value : 0;
  const hasDecimals = Math.abs(number % 1) > 0.000001;

  return `${number.toLocaleString("da-DK", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })} kr`;
}

function formatPercent(value) {
  const number = Number.isFinite(value) ? value : 0;
  return `${(number * 100).toLocaleString("da-DK", {
    maximumFractionDigits: 1,
  })}%`;
}

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSharedMembershipCost(currentMemberships) {
  return safeNumber(
    currentMemberships.find((item) => item.id === "shared")?.cost
  );
}

function calculate(currentMemberships = memberships, currentTerms = terms) {
  const totalMembers = currentMemberships.reduce(
    (sum, item) => sum + safeNumber(item.members),
    0
  );
  const totalIncome = currentMemberships.reduce(
    (sum, item) => sum + safeNumber(item.cost) * safeNumber(item.members),
    0
  );
  const sharedMembers = safeNumber(
    currentMemberships.find((item) => item.id === "shared")?.members
  );
  const sharedMembershipCost = getSharedMembershipCost(currentMemberships);

  const firstMembers = safeNumber(currentTerms.firstMembersToTvoormegi);
  const averageIncome = totalMembers > 0 ? totalIncome / totalMembers : 0;
  const baseAmount =
    totalMembers > firstMembers ? averageIncome * firstMembers : totalIncome;
  const extraIncome = Math.max(0, totalIncome - baseAmount);

  const rawStoytPercent =
    totalMembers > firstMembers
      ? safeNumber(currentTerms.stoytShareAtFirstExtraMember) +
        (totalMembers - firstMembers - 1) *
          safeNumber(currentTerms.increasePerMember)
      : 0;

  const stoytPercent =
    totalMembers > firstMembers
      ? clamp(rawStoytPercent, 0, safeNumber(currentTerms.maxStoytShare))
      : 0;

  const tvoormegiPercent = 1 - stoytPercent;
  const sharedMemberTvoormegiAmount = Math.max(
    0,
    safeNumber(currentTerms.sharedFullPrice) - sharedMembershipCost
  );
  const tvoormegiKombiIncome = sharedMemberTvoormegiAmount * sharedMembers;

  const stoytFromExtra = stoytPercent * extraIncome;
  const tvoormegiFromExtra = tvoormegiPercent * extraIncome;
  const stoytMonthly = stoytFromExtra;
  const tvoormegiMonthly = baseAmount + tvoormegiFromExtra;
  const tvoormegiMonthlyIncludingKombi =
    tvoormegiMonthly + tvoormegiKombiIncome;

  return {
    totalMembers,
    sharedMembers,
    totalIncome,
    averageIncome,
    firstMembers,
    baseAmount,
    extraIncome,
    stoytPercent,
    tvoormegiPercent,
    sharedMemberTvoormegiAmount,
    tvoormegiKombiIncome,
    stoytFromExtra,
    tvoormegiFromExtra,
    stoytMonthly,
    tvoormegiMonthly,
    tvoormegiMonthlyIncludingKombi,
    stoytYearly: stoytMonthly * 12,
    tvoormegiYearly: tvoormegiMonthly * 12,
    tvoormegiYearlyIncludingKombi: tvoormegiMonthlyIncludingKombi * 12,
    totalSplitMonthly: stoytMonthly + tvoormegiMonthly,
  };
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ memberships, terms, projectionMax: projectionMax.value })
  );
}

function loadState() {
  const queryData = new URLSearchParams(window.location.search).get("data");
  if (queryData) {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(queryData))));
      applyLoadedState(decoded);
      showNotice(
        "Deilileinkjan er innlisnað. Tú kanst broyta tølini víðari her."
      );
      return;
    } catch (error) {
      showNotice("Leinkjan kundi ikki lesast. Standardtølini verða brúkt.");
    }
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    applyLoadedState(JSON.parse(saved));
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function applyLoadedState(state) {
  if (Array.isArray(state.memberships)) {
    memberships = defaultMemberships.map((item) => ({
      ...item,
      ...(state.memberships.find((savedItem) => savedItem.id === item.id) ||
        {}),
    }));
  }
  if (state.terms && typeof state.terms === "object") {
    terms = { ...defaultTerms, ...state.terms };
  }
  if (state.projectionMax && projectionMax) {
    projectionMax.value = clamp(safeNumber(state.projectionMax), 1, 200);
  }
}

function showNotice(message) {
  linkNotice.textContent = message;
  linkNotice.hidden = false;
  setTimeout(() => {
    linkNotice.hidden = true;
  }, 4500);
}

function renderMembershipRows() {
  membershipRows.innerHTML = memberships
    .map(
      (item, index) => `
    <tr>
      <td><strong>${item.name}</strong></td>
      <td><input type="number" min="0" step="1" value="${item.cost}" data-membership-index="${index}" data-field="cost" aria-label="${item.name} kostnaður"></td>
      <td><input type="number" min="0" step="1" value="${item.members}" data-membership-index="${index}" data-field="members" aria-label="${item.name} limir"></td>
      <td id="membershipTotal-${item.id}">0,00 kr</td>
    </tr>
  `
    )
    .join("");
}

function renderTerms() {
  termsInputs.innerHTML = termConfig
    .map((config) => {
      const visibleValue = config.percent
        ? safeNumber(terms[config.key]) * 100
        : safeNumber(terms[config.key]);
      return `
      <div class="field">
        <label for="${config.key}">${config.label}<small>${
        config.help
      }</small></label>
        <div class="input-with-suffix">
          <input id="${
            config.key
          }" type="number" value="${visibleValue}" step="${config.step}" min="${
        config.min ?? 0
      }" ${
        config.max !== undefined ? `max="${config.max}"` : ""
      } data-term-key="${config.key}" data-percent="${
        config.percent ? "true" : "false"
      }" aria-label="${config.label}">
          <span>${config.suffix}</span>
        </div>
      </div>
    `;
    })
    .join("");
}

function setResultList(elementId, rows) {
  document.querySelector(`#${elementId}`).innerHTML = rows
    .map(
      ([label, value]) => `
    <div><dt>${label}</dt><dd>${value}</dd></div>
  `
    )
    .join("");
}

function renderResults() {
  const result = calculate();

  memberships.forEach((item) => {
    document.querySelector(`#membershipTotal-${item.id}`).textContent =
      formatKr(safeNumber(item.cost) * safeNumber(item.members));
  });

  document.querySelector("#heroTotalIncome").textContent = formatKr(
    result.totalIncome
  );
  document.querySelector(
    "#heroTotalMembers"
  ).textContent = `${result.totalMembers.toLocaleString("da-DK")} limir`;
  document.querySelector("#totalMembersCell").textContent =
    result.totalMembers.toLocaleString("da-DK");
  document.querySelector("#totalIncomeCell").textContent = formatKr(
    result.totalIncome
  );

  document.querySelector("#stoytMonthly").textContent = formatKr(
    result.stoytMonthly
  );
  document.querySelector("#tvoormegiMonthly").textContent = formatKr(
    result.tvoormegiMonthly
  );
  document.querySelector("#stoytYearly").textContent = formatKr(
    result.stoytYearly
  );
  document.querySelector("#tvoormegiYearly").textContent = formatKr(
    result.tvoormegiYearly
  );
  document.querySelector("#stoytPercent").textContent = formatPercent(
    result.stoytPercent
  );
  document.querySelector("#tvoormegiPercent").textContent = formatPercent(
    result.tvoormegiPercent
  );

  document.querySelector("#stoytBar").style.width = `${clamp(
    result.stoytPercent * 100,
    0,
    100
  )}%`;
  document.querySelector("#tvoormegiBar").style.width = `${clamp(
    result.tvoormegiPercent * 100,
    0,
    100
  )}%`;
  document.querySelector("#stoytBarPercent").textContent = formatPercent(
    result.stoytPercent
  );
  document.querySelector("#tvoormegiBarPercent").textContent = formatPercent(
    result.tvoormegiPercent
  );

  setResultList("monthlyResults", [
    ["Býti til Stoyt frá eyka inntøku", formatKr(result.stoytFromExtra)],
    ["Býti til Tvørmegi frá eyka inntøku", formatKr(result.tvoormegiFromExtra)],
  ]);

  setResultList("calculationResults", [
    ["Miðal inntøka fyri hvønn lim", formatKr(result.averageIncome)],
    ["Grundupphædd", formatKr(result.baseAmount)],
    ["Eyka inntøka", formatKr(result.extraIncome)],
  ]);

  const showKombi = document.querySelector("#showKombiIncome")?.checked ?? true;
  const kombiDetails = document.querySelector("#kombiDetails");
  if (kombiDetails) {
    kombiDetails.hidden = !showKombi;
  }
  setResultList("kombiResults", [
    [
      "Tal av limum við Stoyt / Tvørmegi haldi",
      result.sharedMembers.toLocaleString("da-DK"),
    ],
    [
      "Býti hjá Tvørmegi fyri Stoyt / Tvørmegi hald",
      formatKr(result.sharedMemberTvoormegiAmount),
    ],
    [
      "Inntøka hjá Tvørmegi fyri býti av Stoyt / Tvørmegi haldinum",
      formatKr(result.tvoormegiKombiIncome),
    ],
  ]);

  document.querySelector("#tvoormegiIncludingKombiMonthly").textContent =
    formatKr(result.tvoormegiMonthlyIncludingKombi);
  document.querySelector("#tvoormegiIncludingKombiYearly").textContent =
    formatKr(result.tvoormegiYearlyIncludingKombi);

  renderProjectionRows(result);
  saveState();
}

function getProjectionAveragePrice(result) {
  return result.totalMembers > 0 ? result.totalIncome / result.totalMembers : 0;
}

function renderProjectionRows(currentResult = calculate()) {
  const max = clamp(safeNumber(projectionMax.value || 40), 1, 200);
  const averagePrice = getProjectionAveragePrice(currentResult);

  projectionRows.innerHTML = Array.from({ length: max }, (_, index) => {
    const members = index + 1;
    const scenarioMemberships = defaultMemberships.map((item, itemIndex) => ({
      ...item,
      cost: itemIndex === 0 ? averagePrice : 0,
      members: itemIndex === 0 ? members : 0,
    }));
    const scenario = calculate(scenarioMemberships, terms);
    return `
      <tr>
        <td><strong>${members}</strong></td>
        <td>${formatKr(scenario.totalIncome)}</td>
        <td>${formatPercent(scenario.stoytPercent)}</td>
        <td>${formatKr(scenario.stoytMonthly)}</td>
        <td>${formatKr(scenario.tvoormegiMonthly)}</td>
        <td>${formatKr(scenario.stoytYearly)}</td>
        <td>${formatKr(scenario.tvoormegiYearly)}</td>
      </tr>
    `;
  }).join("");
}

function makeShareUrl() {
  const data = btoa(
    unescape(
      encodeURIComponent(
        JSON.stringify({
          memberships,
          terms,
          projectionMax: projectionMax.value,
        })
      )
    )
  );
  return `${window.location.origin}${window.location.pathname}?data=${data}`;
}


function openTermsModal() {
  renderTerms();
  const modal = document.querySelector("#termsModal");
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector("#termsModal input")?.focus();
}

function closeTermsModal() {
  const modal = document.querySelector("#termsModal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  document.querySelector("#openTermsButton")?.focus();
}

function saveTermsFromModal() {
  termConfig.forEach((config) => {
    const input = document.querySelector(`#${config.key}`);
    if (!input) return;
    const isPercent = input.dataset.percent === "true";
    terms[config.key] = isPercent
      ? safeNumber(input.value) / 100
      : safeNumber(input.value);
  });
  renderResults();
  closeTermsModal();
}

function attachEvents() {
  document.addEventListener("input", (event) => {
    const membershipIndex = event.target.dataset.membershipIndex;
    const field = event.target.dataset.field;
    const termKey = event.target.dataset.termKey;

    if (membershipIndex !== undefined && field) {
      memberships[Number(membershipIndex)][field] = safeNumber(
        event.target.value
      );
      renderResults();
    }

    if (termKey) {
      return;
    }

    if (
      event.target.id === "projectionMax" ||
      event.target.id === "showKombiIncome"
    ) {
      renderResults();
    }
  });

  const resetMembershipsButton = document.querySelector("#resetMemberships");
  if (resetMembershipsButton) {
    resetMembershipsButton.addEventListener("click", () => {
      memberships = structuredClone(defaultMemberships);
      renderMembershipRows();
      renderResults();
    });
  }

  const resetTermsButton = document.querySelector("#resetTerms");
  if (resetTermsButton) {
    resetTermsButton.addEventListener("click", () => {
      terms = { ...defaultTerms };
      renderTerms();
      renderResults();
    });
  }

  const printButton = document.querySelector("#printButton");
  if (printButton) {
    printButton.addEventListener("click", () => window.print());
  }

  const copyLinkButton = document.querySelector("#copyLinkButton");
  if (copyLinkButton) {
    copyLinkButton.addEventListener("click", async () => {
      const url = makeShareUrl();
      try {
        await navigator.clipboard.writeText(url);
        showNotice("Deilileinkja er avritað.");
      } catch (error) {
        showNotice(
          "Kundi ikki avrita sjálvvirkandi. Kopiera leinkjuna úr adressulinjuni eftir at tú trýstir her: " +
            url
        );
      }
    });
  }

  document.querySelector("#openTermsButton")?.addEventListener("click", openTermsModal);
  document.querySelector("#closeTermsButton")?.addEventListener("click", closeTermsModal);
  document.querySelector("#cancelTermsButton")?.addEventListener("click", closeTermsModal);
  document.querySelector("#saveTermsButton")?.addEventListener("click", saveTermsFromModal);
  document.querySelector("[data-close-terms]")?.addEventListener("click", closeTermsModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.querySelector("#termsModal")?.hidden) {
      closeTermsModal();
    }
  });
}

loadState();
renderMembershipRows();
renderTerms();
attachEvents();
renderResults();
