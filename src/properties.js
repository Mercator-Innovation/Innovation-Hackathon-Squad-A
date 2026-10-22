// Cloch head office: manage properties and the tenant in each one.
// A list of properties; a full-width record for each one (the home, the tenant, its risk and a
// timeline of every damp and mould report, check and repair); and a form to add or change one.
// It's a section of the head office view, next to "Homes at risk". OfficeTabs switches between them.

const OfficeTabs = {
  start() {
    document.querySelectorAll("[data-office-tab]").forEach((btn) => btn.addEventListener("click", () => {
      App.state.officeTab = btn.dataset.officeTab;
      App.save();
    }));
  },

  // Show the chosen section. Runs on every redraw, so it stays right after a reload.
  render() {
    const tab = App.state.officeTab === "properties" ? "properties" : "risk";
    document.querySelectorAll("[data-office-tab]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.officeTab === tab));
    });
    document.getElementById("office-screen").hidden = tab !== "risk";
    document.getElementById("properties-screen").hidden = tab !== "properties";
  }
};

const Properties = {
  mode: "list",    // "list", "record" (one property) or "edit" (the form)
  currentId: null, // the property being looked at or changed, or "new" when adding one
  draft: null,     // what was typed, kept when a form has errors
  errors: {},
  historyDraft: null,
  historyErrors: {},
  message: "",
  search: "",
  filters: { town: "all", app: "all", epc: "all", lives: "all" },
  sort: "address",

  render() {
    const p = CONTENT.properties;
    const el = document.getElementById("properties-screen");
    const home = this.currentId && this.currentId !== "new" ? App.home(this.currentId) : null;
    if (this.mode !== "list" && this.currentId !== "new" && !home) this.mode = "list"; // it was deleted

    const message = this.message ? `<p class="notice" id="properties-message" tabindex="-1" role="status">${esc(this.message)}</p>` : "";
    if (this.mode === "record") el.innerHTML = message + this.recordHtml(p, home);
    else if (this.mode === "edit") el.innerHTML = this.formHtml(p, home);
    else el.innerHTML = message + this.listHtml(p);
    this.bind(el, home);
  },

  // ---------- The list ----------

  // The homes that match the search and filters, in the chosen order.
  matching() {
    const f = this.filters;
    const words = this.search.toLowerCase().split(/\s+/).filter(Boolean);
    const epcGroups = { good: "ABC", middle: "D", poor: "EFG" };
    const lives = {
      older: (h) => h.household.olderPerson,
      child: (h) => h.household.youngChild,
      breathing: (h) => h.household.breathingCondition === true,
      sight: (h) => Boolean(h.tenant && h.tenant.sightLoss)
    };
    const shown = App.state.homes.filter((h) => {
      const text = [h.address, h.tenant && h.tenant.name, h.tenant && h.tenant.phone].filter(Boolean).join(" ").toLowerCase();
      const appState = !h.tenant ? "empty" : h.tenant.appOptIn ? "in" : "out";
      return words.every((w) => text.includes(w) || text.replace(/\s/g, "").includes(w)) &&
        (f.town === "all" || townOf(h) === f.town) &&
        (f.app === "all" || appState === f.app) &&
        (f.epc === "all" || epcGroups[f.epc].includes(h.epc)) &&
        (f.lives === "all" || lives[f.lives](h));
    });
    if (this.sort === "tenant") {
      shown.sort((a, b) => (a.tenant ? a.tenant.name : "~").localeCompare(b.tenant ? b.tenant.name : "~"));
    } else if (this.sort === "latest") {
      const latest = (h) => (this.timeline(h)[0] || { date: "" }).date;
      shown.sort((a, b) => latest(b).localeCompare(latest(a)));
    } else {
      shown.sort((a, b) => a.address.localeCompare(b.address));
    }
    return shown;
  },

  filtersHtml(p) {
    const f = this.filters;
    const o = CONTENT.office;
    const towns = [...new Set(App.state.homes.map(townOf))].sort();
    const select = (id, label, value, options) => `
      <div class="field">
        <label for="${id}">${esc(label)}</label>
        <select id="${id}">${options.map(([v, text]) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(text)}</option>`).join("")}</select>
      </div>`;
    return `
      <div class="field search">
        <label for="property-search">${esc(p.searchLabel)}</label>
        <p class="hint" id="property-search-hint">${esc(p.searchHint)}</p>
        <input type="search" id="property-search" autocomplete="off" value="${esc(this.search)}" aria-describedby="property-search-hint">
      </div>
      <fieldset class="filters">
        <legend>${esc(o.filtersTitle)}</legend>
        ${select("prop-filter-town", o.filterTown, f.town, [["all", o.any], ...towns.map((t) => [t, t])])}
        ${select("prop-filter-app", p.filterApp, f.app, [["all", o.any], ["in", p.optedIn], ["out", p.optedOut], ["empty", p.filterEmpty]])}
        ${select("prop-filter-epc", p.epcLabel, f.epc, [["all", o.any], ["good", p.epcGood], ["middle", "D"], ["poor", p.epcPoor]])}
        ${select("prop-filter-lives", p.filterLives, f.lives, [["all", o.any], ["older", p.olderPerson], ["child", p.youngChild], ["breathing", p.breathingShort], ["sight", p.sightShort]])}
        ${select("prop-sort", o.sortLabel, this.sort, [["address", o.sortAddress], ["tenant", p.sortTenant], ["latest", p.sortLatest]])}
      </fieldset>`;
  },

  listHtml(p) {
    const all = App.state.homes;
    const homes = this.matching();
    const filtered = homes.length < all.length;
    return `
      <p>${esc(p.intro)}</p>
      <p><button type="button" class="button" id="add-property" data-add>${esc(p.addButton)}</button></p>
      <section class="card" aria-labelledby="property-list-title">
        <h2 id="property-list-title">${all.length} ${all.length === 1 ? "property" : "properties"}</h2>
        ${this.filtersHtml(p)}
        <p class="result-count" aria-live="polite">${esc(CONTENT.office.showing.replace("{shown}", homes.length).replace("{total}", all.length))}
          ${filtered ? `<button type="button" class="link-button" data-clear-filters>${esc(CONTENT.office.clearFilters)}</button>` : ""}</p>
        ${homes.length ? "" : `<p>${esc(p.noMatches)}</p>`}
        <div class="table-scroll" tabindex="0" role="region" aria-labelledby="property-list-title" ${homes.length ? "" : "hidden"}>
          <table>
            <thead><tr>
              <th scope="col">${esc(p.cols.home)}</th>
              <th scope="col">${esc(p.cols.tenant)}</th>
              <th scope="col">${esc(p.cols.app)}</th>
              <th scope="col">${esc(p.cols.lastEvent)}</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr></thead>
            <tbody>
              ${homes.map((home) => {
                const latest = this.timeline(home)[0];
                return `
                <tr>
                  <td>${esc(home.address)}<br><span class="muted">${esc(home.type)}, energy rating ${esc(home.epc)}</span></td>
                  <td>${home.tenant ? `${esc(home.tenant.name)}${home.tenant.age ? `<br><span class="muted">Age ${esc(home.tenant.age)}</span>` : ""}` : `<span class="muted">${esc(p.empty)}</span>`}</td>
                  <td>${home.tenant ? this.appTag(p, home.tenant) : ""}</td>
                  <td>${latest ? `${esc(latest.title)}<br><span class="muted">${esc(shortDate(latest.date))}</span>` : `<span class="muted">${esc(p.noHistoryShort)}</span>`}</td>
                  <td><button type="button" class="button small" data-view-record="${home.id}">${esc(p.view)}<span class="visually-hidden"> ${esc(home.address)}</span></button></td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>
      </section>`;
  },

  appTag(p, tenant) {
    return `<span class="tag ${tenant.appOptIn ? "in" : "out"}">${esc(tenant.appOptIn ? p.optedIn : p.optedOut)}</span>`;
  },

  // ---------- One property's record ----------

  recordHtml(p, home) {
    const risk = Risk.score(home);
    const t = home.tenant;
    const hh = home.household;
    const yesNoUnknown = (value) => value === true ? p.yes : value === false ? p.no : p.notTold;
    const row = (label, value) => `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`;

    const tenantRows = t ? [
      row(p.nameLabel, esc(t.name)),
      row(p.ageLabel, t.age ? esc(t.age) : `<span class="muted">${esc(p.notRecorded)}</span>`),
      row(p.phoneLabel.replace(" (optional)", ""), t.phone ? esc(t.phone) : `<span class="muted">${esc(p.notRecorded)}</span>`),
      row(p.peopleShort, esc(hh.people)),
      row(p.householdShort, esc([hh.olderPerson && p.olderPerson, hh.youngChild && p.youngChild].filter(Boolean).join(", ") || p.none)),
      row(p.breathingShort, esc(yesNoUnknown(hh.breathingCondition))),
      row(p.sightShort, esc(yesNoUnknown(t.sightLoss))),
      row(p.appLabel, this.appTag(p, t))
    ].join("") : "";

    const events = this.timeline(home);
    const repairs = events.filter((e) => e.type === "repair").length;

    return `
      <p><button type="button" class="link-button" data-back>‹ ${esc(p.back)}</button></p>
      <div class="record-head">
        <h2 id="record-title" tabindex="-1">${esc(home.address)}</h2>
        <div class="button-row">
          <button type="button" class="button" data-edit>${esc(p.edit)}</button>
          ${t ? `<button type="button" class="button secondary" data-remove-tenant>${esc(p.removeTenant)}</button>` : ""}
          ${home.id === DATA.you ? "" : `<button type="button" class="button danger" data-delete>${esc(p.deleteProperty)}</button>`}
        </div>
      </div>
      ${home.id === DATA.you ? `<p class="hint">${esc(p.cantDelete)}</p>` : ""}

      <div class="record-grid">
        <section class="card" aria-labelledby="record-home-title">
          <h3 id="record-home-title">${esc(p.homeSection)}</h3>
          <dl class="facts">
            ${row(p.typeLabel, esc(home.type))}
            ${row(p.epcLabel, esc(home.epc))}
            ${row(p.sensorLabel, home.sensor ? esc(sensorSummary(home.sensor)) : `<span class="muted">${esc(p.noSensor)}</span>`)}
            ${row(p.repairsShort, esc(home.dampRepairs))}
          </dl>
        </section>

        <section class="card" aria-labelledby="record-tenant-title">
          <h3 id="record-tenant-title">${esc(p.tenantSection)}</h3>
          ${t ? `<dl class="facts">${tenantRows}</dl>
            ${t.sightLoss ? `<p class="callout">${esc(p.sightTip)}</p>` : ""}
            <p class="hint">${esc(p.consentNote)}</p>` : `<p class="muted">${esc(p.noTenant)}</p>`}
        </section>

        <section class="card" aria-labelledby="record-risk-title">
          <h3 id="record-risk-title">${esc(p.riskTitle)}</h3>
          <p><span class="badge ${risk.band}">${esc(CONTENT.office.bands[risk.band])} risk</span> <span class="score">${risk.total} / 100</span></p>
          ${risk.reasons.length ? `<ul class="reasons">${risk.reasons.map((r) => `<li><span class="points">+${r.points}</span> ${esc(r.text)}</li>`).join("")}</ul>` : `<p class="muted">${esc(p.noReasons)}</p>`}
        </section>
      </div>

      <section class="card" aria-labelledby="history-title">
        <div class="record-head">
          <h3 id="history-title">${esc(p.historyTitle)}</h3>
          ${this.historyDraft ? "" : `<button type="button" class="button secondary small" data-add-history>${esc(p.addHistory)}</button>`}
        </div>
        <p class="muted">${esc(p.historySummary.replace("{count}", events.length).replace("{repairs}", repairs))}</p>
        ${this.historyDraft ? this.historyFormHtml(p) : ""}
        ${events.length ? `<ol class="timeline">${events.map((e) => this.eventHtml(p, e)).join("")}</ol>` : `<p>${esc(p.noHistory)}</p>`}
      </section>`;
  },

  eventHtml(p, e) {
    return `
      <li class="event ${esc(e.type)}">
        <p class="event-meta"><span class="event-type">${esc(p.eventTypes[e.type] || e.type)}</span> <time datetime="${esc(e.date)}">${esc(shortDate(e.date))}</time>${e.by ? ` · ${esc(e.by)}` : ""}</p>
        <h4>${esc(e.title)}</h4>
        ${e.detail ? `<p>${esc(e.detail)}</p>` : ""}
        ${e.outcome ? `<p><strong>${esc(p.outcomeLabel)}:</strong> ${esc(e.outcome)}</p>` : ""}
      </li>`;
  },

  // Everything that's happened at a home, newest first: checks and repairs, plus tenant reports
  // and the visits booked for them.
  timeline(home) {
    const o = CONTENT.tenant;
    const sizes = { small: "a small patch", medium: "a few patches", large: "a lot" };
    const fromReports = App.reportsFor(home.id).flatMap((r) => {
      const items = [{
        date: r.date, type: "report", title: `Tenant reported damp or mould (${r.ref})`, by: home.tenant ? home.tenant.name : "",
        detail: `${r.rooms.join(", ")}: ${sizes[r.severity] || r.severity}.${r.note ? ` “${r.note}”` : ""}`,
        outcome: o.statusSteps[r.status]
      }];
      if (r.visitDate) items.push({
        date: r.visitDate, type: "inspection", title: `Housing officer visit for ${r.ref}`, by: r.officer,
        detail: "", outcome: r.status === "visit" ? "Booked" : "Visited"
      });
      return items;
    });
    return [...this.historyFor(home), ...fromReports].sort((a, b) => b.date.localeCompare(a.date));
  },

  // Homes saved before the history existed get the made-up history from data/history.js.
  historyFor(home) {
    if (!home.history) home.history = JSON.parse(JSON.stringify((window.HISTORY || {})[home.id] || []));
    return home.history;
  },

  historyFormHtml(p) {
    const v = this.historyDraft;
    const err = this.historyErrors;
    const errorList = Object.entries(err);
    const fieldError = (key) => err[key] ? `<p class="error" id="hist-${key}-error"><span class="visually-hidden">Error:</span> ${esc(err[key])}</p>` : "";
    return `
      <form id="history-form" class="history-form" novalidate>
        <h4>${esc(p.addHistory)}</h4>
        ${errorList.length ? `
          <div class="error-summary" role="alert" tabindex="-1" id="history-errors">
            <h3>${esc(p.errorSummary)}</h3>
            <ul>${errorList.map(([key, text]) => `<li><a href="#hist-${key}">${esc(text)}</a></li>`).join("")}</ul>
          </div>` : ""}
        <div class="form-columns">
          <div class="field ${err.date ? "has-error" : ""}">
            <label for="hist-date">${esc(p.histDate)}</label>
            ${fieldError("date")}
            <input type="date" id="hist-date" value="${esc(v.date)}" ${err.date ? `aria-describedby="hist-date-error" aria-invalid="true"` : ""}>
          </div>
          <div class="field">
            <label for="hist-type">${esc(p.histType)}</label>
            <select id="hist-type">${["inspection", "repair", "advice", "sensor", "survey"].map((k) => `<option value="${k}" ${k === v.type ? "selected" : ""}>${esc(p.eventTypes[k])}</option>`).join("")}</select>
          </div>
        </div>
        <div class="field ${err.title ? "has-error" : ""}">
          <label for="hist-title">${esc(p.histTitle)}</label>
          <p class="hint" id="hist-title-hint">${esc(p.histTitleHint)}</p>
          ${fieldError("title")}
          <input type="text" id="hist-title" value="${esc(v.title)}" aria-describedby="hist-title-hint${err.title ? " hist-title-error" : ""}" ${err.title ? 'aria-invalid="true"' : ""}>
        </div>
        <div class="field">
          <label for="hist-detail">${esc(p.histDetail)}</label>
          <textarea id="hist-detail" rows="3">${esc(v.detail)}</textarea>
        </div>
        <div class="field">
          <label for="hist-outcome">${esc(p.histOutcome)}</label>
          <textarea id="hist-outcome" rows="2">${esc(v.outcome)}</textarea>
        </div>
        <div class="field">
          <label for="hist-by">${esc(p.histBy)}</label>
          <input type="text" id="hist-by" value="${esc(v.by)}">
        </div>
        <div class="button-row">
          <button type="submit" class="button">${esc(p.histSave)}</button>
          <button type="button" class="button secondary" data-cancel-history>${esc(p.cancel)}</button>
        </div>
      </form>`;
  },

  // ---------- Add or change a property ----------

  // The values to show in the form: what was typed, or the saved home, or blanks for a new one.
  values(home) {
    if (this.draft) return this.draft;
    if (!home) {
      return { address: "", type: "Flat", epc: "D", dampRepairs: 0, name: "", age: "", phone: "", people: 1,
        olderPerson: false, youngChild: false, breathing: "unknown", sight: "unknown", app: "out" };
    }
    const hh = home.household;
    const t = home.tenant;
    const tri = (value) => value === true ? "yes" : value === false ? "no" : "unknown";
    return {
      address: home.address, type: home.type, epc: home.epc, dampRepairs: home.dampRepairs,
      name: t ? t.name : "", age: t && t.age ? String(t.age) : "", phone: t ? t.phone : "",
      people: hh.people || 1, olderPerson: hh.olderPerson, youngChild: hh.youngChild,
      breathing: tri(hh.breathingCondition), sight: tri(t ? t.sightLoss : null),
      app: t && t.appOptIn ? "in" : "out"
    };
  },

  formHtml(p, home) {
    const v = this.values(home);
    const err = this.errors;
    const errorList = Object.entries(err);
    const fieldError = (key) => err[key] ? `<p class="error" id="${key}-error"><span class="visually-hidden">Error:</span> ${esc(err[key])}</p>` : "";
    const radios = (name, options, current) => options.map((o) => `
      <label class="choice"><input type="radio" name="${name}" value="${o.value}" ${o.value === current ? "checked" : ""}> ${esc(o.label)}</label>`).join("");

    return `
      <p><button type="button" class="link-button" data-cancel>‹ ${esc(home ? p.backToRecord : p.back)}</button></p>
      <h2 id="property-form-title" tabindex="-1">${esc(home ? `${p.editTitle}: ${home.address}` : p.addTitle)}</h2>
      ${errorList.length ? `
        <div class="error-summary" role="alert" tabindex="-1" id="property-errors">
          <h3>${esc(p.errorSummary)}</h3>
          <ul>${errorList.map(([key, text]) => `<li><a href="#prop-${key}">${esc(text)}</a></li>`).join("")}</ul>
        </div>` : ""}
      <form id="property-form" novalidate>
        <div class="record-grid two">
          <section class="card" aria-labelledby="form-home-title">
            <h3 id="form-home-title">${esc(p.homeSection)}</h3>
            <div class="field ${err.address ? "has-error" : ""}">
              <label for="prop-address">${esc(p.addressLabel)}</label>
              <p class="hint" id="prop-address-hint">${esc(p.addressHint)}</p>
              ${fieldError("address")}
              <input type="text" id="prop-address" autocomplete="off" value="${esc(v.address)}"
                aria-describedby="prop-address-hint${err.address ? " address-error" : ""}" ${err.address ? 'aria-invalid="true"' : ""}>
            </div>
            <div class="field">
              <label for="prop-type">${esc(p.typeLabel)}</label>
              <select id="prop-type">${p.types.map((t) => `<option ${t === v.type ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
            </div>
            <div class="field">
              <label for="prop-epc">${esc(p.epcLabel)}</label>
              <p class="hint" id="prop-epc-hint">${esc(p.epcHint)}</p>
              <select id="prop-epc" aria-describedby="prop-epc-hint">${"ABCDEFG".split("").map((r) => `<option ${r === v.epc ? "selected" : ""}>${r}</option>`).join("")}</select>
            </div>
            <div class="field">
              <label for="prop-repairs">${esc(p.repairsLabel)}</label>
              <input type="number" id="prop-repairs" class="short" min="0" step="1" inputmode="numeric" value="${esc(v.dampRepairs)}">
            </div>
          </section>

          <section class="card" aria-labelledby="form-tenant-title">
            <h3 id="form-tenant-title">${esc(p.tenantSection)}</h3>
            <div class="field">
              <label for="prop-name">${esc(p.nameLabel)}</label>
              <p class="hint" id="prop-name-hint">${esc(p.nameHint)}</p>
              <input type="text" id="prop-name" autocomplete="off" value="${esc(v.name)}" aria-describedby="prop-name-hint">
            </div>
            <div class="field ${err.age ? "has-error" : ""}">
              <label for="prop-age">${esc(p.ageLabelOptional)}</label>
              ${fieldError("age")}
              <input type="number" id="prop-age" class="short" min="16" max="120" step="1" inputmode="numeric" value="${esc(v.age)}"
                ${err.age ? `aria-describedby="age-error" aria-invalid="true"` : ""}>
            </div>
            <div class="field">
              <label for="prop-phone">${esc(p.phoneLabel)}</label>
              <input type="tel" id="prop-phone" autocomplete="off" value="${esc(v.phone)}">
            </div>
            <div class="field ${err.people ? "has-error" : ""}">
              <label for="prop-people">${esc(p.peopleLabel)}</label>
              ${fieldError("people")}
              <input type="number" id="prop-people" class="short" min="1" step="1" inputmode="numeric" value="${esc(v.people)}"
                ${err.people ? `aria-describedby="people-error" aria-invalid="true"` : ""}>
            </div>
            <fieldset class="field">
              <legend>${esc(p.householdLabel)}</legend>
              <p class="hint">${esc(p.householdHint)}</p>
              <label class="choice"><input type="checkbox" id="prop-older" ${v.olderPerson ? "checked" : ""}> ${esc(p.olderPerson)}</label>
              <label class="choice"><input type="checkbox" id="prop-child" ${v.youngChild ? "checked" : ""}> ${esc(p.youngChild)}</label>
            </fieldset>
            <fieldset class="field">
              <legend>${esc(p.breathingLabel)}</legend>
              ${radios("prop-breathing", p.breathingOptions, v.breathing)}
            </fieldset>
            <fieldset class="field">
              <legend>${esc(p.sightLabel)}</legend>
              <p class="hint">${esc(p.sightHint)}</p>
              ${radios("prop-sight", p.breathingOptions, v.sight)}
            </fieldset>
            <fieldset class="field">
              <legend>${esc(p.appLabel)}</legend>
              <p class="hint">${esc(p.appHint)}</p>
              ${radios("prop-app", p.appOptions, v.app)}
            </fieldset>
          </section>
        </div>
        <div class="button-row">
          <button type="submit" class="button">${esc(p.save)}</button>
          <button type="button" class="button secondary" data-cancel>${esc(p.cancel)}</button>
        </div>
      </form>`;
  },

  readForm() {
    const val = (id) => document.getElementById(id).value.trim();
    const checked = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
    return {
      address: val("prop-address"), type: val("prop-type"), epc: val("prop-epc"),
      dampRepairs: Math.max(0, parseInt(val("prop-repairs"), 10) || 0),
      name: val("prop-name"), age: val("prop-age"), phone: val("prop-phone"), people: val("prop-people"),
      olderPerson: document.getElementById("prop-older").checked,
      youngChild: document.getElementById("prop-child").checked,
      breathing: checked("prop-breathing") || "unknown",
      sight: checked("prop-sight") || "unknown",
      app: checked("prop-app") || "out"
    };
  },

  validate(v) {
    const p = CONTENT.properties;
    const errors = {};
    if (!v.address) errors.address = p.errorAddress;
    if (v.name && v.age && !(/^\d+$/.test(v.age) && Number(v.age) >= 16 && Number(v.age) <= 120)) errors.age = p.errorAge;
    if (v.name && !(/^\d+$/.test(v.people) && Number(v.people) >= 1)) errors.people = p.errorPeople;
    return errors;
  },

  save(v) {
    const p = CONTENT.properties;
    const fromTri = (value) => value === "yes" ? true : value === "no" ? false : null;
    const hasTenant = Boolean(v.name);
    const household = hasTenant
      ? { people: Number(v.people), olderPerson: v.olderPerson, youngChild: v.youngChild, breathingCondition: fromTri(v.breathing) }
      : emptyHousehold();
    const tenant = hasTenant
      ? { name: v.name, age: v.age ? Number(v.age) : null, sightLoss: fromTri(v.sight), phone: v.phone, appOptIn: v.app === "in" }
      : null;

    if (this.currentId === "new") {
      const id = nextHomeId();
      App.state.homes.push({
        id, address: v.address, type: v.type, epc: v.epc, dampRepairs: v.dampRepairs,
        lastContactDays: 0, sensor: null, household, tenant, history: []
      });
      this.currentId = id;
      this.message = p.added.replace("{address}", v.address);
    } else {
      Object.assign(App.home(this.currentId), { address: v.address, type: v.type, epc: v.epc, dampRepairs: v.dampRepairs, household, tenant });
      this.message = p.saved.replace("{address}", v.address);
    }
    this.go("record", this.currentId, "properties-message");
  },

  // ---------- Moving between list, record and form ----------

  go(mode, id, focusId) {
    this.mode = mode;
    this.currentId = id || null;
    this.draft = null;
    this.errors = {};
    this.historyDraft = null;
    this.historyErrors = {};
    App.save();
    const target = document.getElementById(focusId) || document.getElementById(
      mode === "record" ? "record-title" : mode === "edit" ? "property-form-title" : "property-list-title");
    if (target) target.focus();
    window.scrollTo(0, document.getElementById("office-view").offsetTop);
  },

  bind(el, home) {
    const p = CONTENT.properties;
    const on = (selector, handler) => el.querySelectorAll(selector).forEach((btn) => btn.addEventListener("click", handler.bind(this, btn)));

    on("[data-add]", () => { this.message = ""; this.go("edit", "new"); });

    // Search and filters: redraw the list, then put focus back where it was.
    const search = el.querySelector("#property-search");
    if (search) search.addEventListener("input", () => {
      this.search = search.value;
      this.message = "";
      this.render();
      const box = document.getElementById("property-search");
      box.focus();
      box.setSelectionRange(box.value.length, box.value.length);
    });
    const filterIds = { "prop-filter-town": "town", "prop-filter-app": "app", "prop-filter-epc": "epc", "prop-filter-lives": "lives" };
    Object.entries(filterIds).forEach(([id, key]) => {
      const box = el.querySelector(`#${id}`);
      if (box) box.addEventListener("change", () => {
        this.filters[key] = box.value;
        this.message = "";
        this.render();
        document.getElementById(id).focus();
      });
    });
    const sort = el.querySelector("#prop-sort");
    if (sort) sort.addEventListener("change", () => {
      this.sort = sort.value;
      this.render();
      document.getElementById("prop-sort").focus();
    });
    on("[data-clear-filters]", () => {
      this.search = "";
      this.filters = { town: "all", app: "all", epc: "all", lives: "all" };
      this.render();
      document.getElementById("property-search").focus();
    });
    on("[data-view-record]", (btn) => { this.message = ""; this.go("record", btn.dataset.viewRecord); });
    on("[data-back]", () => { this.message = ""; this.go("list"); });
    on("[data-edit]", () => { this.message = ""; this.go("edit", home.id); });
    on("[data-cancel]", () => {
      this.message = "";
      // Put keyboard focus back where the person came from.
      if (this.currentId && this.currentId !== "new") this.go("record", this.currentId);
      else this.go("list", null, "add-property");
    });

    const form = el.querySelector("#property-form");
    if (form) form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const v = this.readForm();
      this.errors = this.validate(v);
      if (Object.keys(this.errors).length) {
        this.draft = v;
        this.render();
        document.getElementById("property-errors").focus();
        return;
      }
      this.save(v);
    });

    on("[data-remove-tenant]", () => {
      if (!confirm(p.removeTenantConfirm.replace("{name}", home.tenant.name).replace("{address}", home.address))) return;
      home.tenant = null;
      home.household = emptyHousehold();
      this.message = p.removed.replace("{address}", home.address);
      this.go("record", home.id, "properties-message");
    });

    on("[data-delete]", () => {
      const count = App.state.reports.filter((r) => r.homeId === home.id).length;
      if (!confirm(p.deleteConfirm.replace("{address}", home.address).replace("{count}", count))) return;
      App.state.homes = App.state.homes.filter((h) => h.id !== home.id);
      App.state.reports = App.state.reports.filter((r) => r.homeId !== home.id);
      if (typeof Office !== "undefined" && Office.openHomeId === home.id) Office.openHomeId = null;
      this.message = p.deleted.replace("{address}", home.address);
      this.go("list", null, "properties-message");
    });

    // Adding to the history
    on("[data-add-history]", () => {
      this.historyDraft = { date: todayIso(), type: "inspection", title: "", detail: "", outcome: "", by: "" };
      this.render();
      document.getElementById("hist-date").focus();
    });
    on("[data-cancel-history]", () => {
      this.historyDraft = null;
      this.historyErrors = {};
      this.render();
      document.querySelector("#properties-screen [data-add-history]").focus();
    });
    const historyForm = el.querySelector("#history-form");
    if (historyForm) historyForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const val = (id) => document.getElementById(id).value.trim();
      const entry = { date: val("hist-date"), type: val("hist-type"), title: val("hist-title"),
        detail: val("hist-detail"), outcome: val("hist-outcome"), by: val("hist-by") };
      const errors = {};
      if (!entry.date) errors.date = p.errorHistDate;
      if (!entry.title) errors.title = p.errorHistTitle;
      if (Object.keys(errors).length) {
        this.historyDraft = entry;
        this.historyErrors = errors;
        this.render();
        document.getElementById("history-errors").focus();
        return;
      }
      this.historyFor(home).push(entry);
      if (entry.type === "repair") home.dampRepairs += 1;
      this.message = p.historyAdded.replace("{title}", entry.title);
      this.go("record", home.id, "properties-message");
    });
  }
};

function emptyHousehold() {
  return { people: 0, olderPerson: false, youngChild: false, breathingCondition: null };
}

function nextHomeId() {
  const highest = App.state.homes.reduce((max, h) => Math.max(max, parseInt(h.id.slice(2), 10) || 0), 100);
  return "H-" + (highest + 1);
}

// The same sensor wording as the Homes at risk panel (CONTENT.office.sensorText).
function sensorSummary(sensor) {
  return CONTENT.office.sensorText
    .replaceAll("{cold}", sensor.coldDays).replaceAll("{damp}", sensor.dampDays)
    .replaceAll("{days}", sensor.days).replaceAll("{temp}", sensor.avgTemp)
    .replaceAll("{humidity}", sensor.avgHumidity);
}

// The town is the last part of the address, as on Homes at risk.
function townOf(home) {
  return home.address.split(",").pop().trim();
}

function shortDate(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

App.views.properties = Properties;
App.views.officeTabs = OfficeTabs;
OfficeTabs.start();
