// Cloch head office: manage properties and the tenant in each one.
// Add, change and delete properties; add or remove tenants; opt tenants in or out of the app.

const Properties = {
  editingId: null, // null: just the list. "new": adding a property. Otherwise the id being changed.
  draft: null,     // what was typed, kept when the form has errors
  errors: {},
  message: "",

  render() {
    const p = CONTENT.properties;
    const el = document.getElementById("properties-screen");
    const homes = App.state.homes;

    el.innerHTML = `
      ${this.message ? `<p class="notice" id="properties-message" tabindex="-1" role="status">${esc(this.message)}</p>` : ""}
      <p>${esc(p.intro)}</p>
      <p><button type="button" class="button" data-add>${esc(p.addButton)}</button></p>
      <div class="office-layout">
        <section class="card" aria-labelledby="property-list-title">
          <h2 id="property-list-title">${homes.length} ${homes.length === 1 ? "property" : "properties"}</h2>
          <div class="table-scroll" tabindex="0" role="region" aria-labelledby="property-list-title">
            <table>
              <thead><tr>
                <th scope="col">${esc(p.cols.home)}</th>
                <th scope="col">${esc(p.cols.tenant)}</th>
                <th scope="col">${esc(p.cols.app)}</th>
                <th scope="col"><span class="visually-hidden">Actions</span></th>
              </tr></thead>
              <tbody>
                ${homes.map((home) => `
                  <tr class="${home.id === this.editingId ? "selected" : ""}">
                    <td>${esc(home.address)}<br><span class="muted">${esc(home.type)}, energy rating ${esc(home.epc)}</span></td>
                    <td>${home.tenant ? esc(home.tenant.name) : `<span class="muted">${esc(p.empty)}</span>`}</td>
                    <td>${home.tenant ? `<span class="tag ${home.tenant.appOptIn ? "in" : "out"}">${esc(home.tenant.appOptIn ? p.optedIn : p.optedOut)}</span>` : ""}</td>
                    <td><button type="button" class="button small" data-edit="${home.id}">${esc(p.edit)}<span class="visually-hidden"> ${esc(home.address)}</span></button></td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>
        ${this.editingId ? this.formHtml(p) : ""}
      </div>`;
    this.bind(el);
  },

  // The values to show in the form: what was typed, or the saved home, or blanks for a new one.
  values() {
    if (this.draft) return this.draft;
    const home = this.editingId === "new" ? null : App.home(this.editingId);
    if (!home) {
      return { address: "", type: "Flat", epc: "D", dampRepairs: 0, name: "", phone: "", people: 1,
        olderPerson: false, youngChild: false, breathing: "unknown", app: "out" };
    }
    const hh = home.household;
    return {
      address: home.address, type: home.type, epc: home.epc, dampRepairs: home.dampRepairs,
      name: home.tenant ? home.tenant.name : "", phone: home.tenant ? home.tenant.phone : "",
      people: hh.people || 1, olderPerson: hh.olderPerson, youngChild: hh.youngChild,
      breathing: hh.breathingCondition === true ? "yes" : hh.breathingCondition === false ? "no" : "unknown",
      app: home.tenant && home.tenant.appOptIn ? "in" : "out"
    };
  },

  formHtml(p) {
    const v = this.values();
    const isNew = this.editingId === "new";
    const home = isNew ? null : App.home(this.editingId);
    const err = this.errors;
    const errorList = Object.entries(err);
    const fieldError = (key) => err[key] ? `<p class="error" id="${key}-error"><span class="visually-hidden">Error:</span> ${esc(err[key])}</p>` : "";
    const radios = (name, options, current) => options.map((o) => `
      <label class="choice"><input type="radio" name="${name}" value="${o.value}" ${o.value === current ? "checked" : ""}> ${esc(o.label)}</label>`).join("");

    return `
      <section class="card detail" aria-labelledby="property-form-title">
        <div class="detail-head">
          <h2 id="property-form-title" tabindex="-1">${esc(isNew ? p.addTitle : p.editTitle)}</h2>
          <button type="button" class="link-button" data-cancel>${esc(p.cancel)}</button>
        </div>
        ${errorList.length ? `
          <div class="error-summary" role="alert" tabindex="-1" id="property-errors">
            <h3>${esc(p.errorSummary)}</h3>
            <ul>${errorList.map(([key, text]) => `<li><a href="#prop-${key}">${esc(text)}</a></li>`).join("")}</ul>
          </div>` : ""}
        <form id="property-form" novalidate>
          <h3>${esc(p.homeSection)}</h3>
          <div class="field ${err.address ? "has-error" : ""}">
            <label for="prop-address">${esc(p.addressLabel)}</label>
            <p class="hint" id="prop-address-hint">${esc(p.addressHint)}</p>
            ${fieldError("address")}
            <input type="text" id="prop-address" autocomplete="off" value="${esc(v.address)}"
              aria-describedby="prop-address-hint${err.address ? " address-error" : ""}">
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

          <h3>${esc(p.tenantSection)}</h3>
          <div class="field">
            <label for="prop-name">${esc(p.nameLabel)}</label>
            <p class="hint" id="prop-name-hint">${esc(p.nameHint)}</p>
            <input type="text" id="prop-name" autocomplete="off" value="${esc(v.name)}" aria-describedby="prop-name-hint">
          </div>
          <div class="field">
            <label for="prop-phone">${esc(p.phoneLabel)}</label>
            <input type="tel" id="prop-phone" autocomplete="off" value="${esc(v.phone)}">
          </div>
          <div class="field ${err.people ? "has-error" : ""}">
            <label for="prop-people">${esc(p.peopleLabel)}</label>
            ${fieldError("people")}
            <input type="number" id="prop-people" class="short" min="1" step="1" inputmode="numeric" value="${esc(v.people)}"
              ${err.people ? `aria-describedby="people-error"` : ""}>
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
            <legend>${esc(p.appLabel)}</legend>
            <p class="hint">${esc(p.appHint)}</p>
            ${radios("prop-app", p.appOptions, v.app)}
          </fieldset>

          <div class="button-row">
            <button type="submit" class="button">${esc(p.save)}</button>
            <button type="button" class="button secondary" data-cancel>${esc(p.cancel)}</button>
          </div>
        </form>
        ${home ? `
          <div class="danger-zone">
            ${home.tenant ? `<button type="button" class="button secondary" data-remove-tenant>${esc(p.removeTenant)}</button>` : ""}
            ${home.id === DATA.you
              ? `<p class="hint">${esc(p.cantDelete)}</p>`
              : `<button type="button" class="button danger" data-delete>${esc(p.deleteProperty)}</button>`}
          </div>` : ""}
      </section>`;
  },

  readForm() {
    const val = (id) => document.getElementById(id).value.trim();
    const checked = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
    return {
      address: val("prop-address"), type: val("prop-type"), epc: val("prop-epc"),
      dampRepairs: Math.max(0, parseInt(val("prop-repairs"), 10) || 0),
      name: val("prop-name"), phone: val("prop-phone"), people: val("prop-people"),
      olderPerson: document.getElementById("prop-older").checked,
      youngChild: document.getElementById("prop-child").checked,
      breathing: checked("prop-breathing") || "unknown",
      app: checked("prop-app") || "out"
    };
  },

  validate(v) {
    const p = CONTENT.properties;
    const errors = {};
    if (!v.address) errors.address = p.errorAddress;
    if (v.name && !(/^\d+$/.test(v.people) && Number(v.people) >= 1)) errors.people = p.errorPeople;
    return errors;
  },

  save(v) {
    const p = CONTENT.properties;
    const hasTenant = Boolean(v.name);
    const household = hasTenant
      ? { people: Number(v.people), olderPerson: v.olderPerson, youngChild: v.youngChild,
          breathingCondition: v.breathing === "yes" ? true : v.breathing === "no" ? false : null }
      : emptyHousehold();
    const tenant = hasTenant ? { name: v.name, phone: v.phone, appOptIn: v.app === "in" } : null;

    if (this.editingId === "new") {
      App.state.homes.push({
        id: nextHomeId(), address: v.address, type: v.type, epc: v.epc, dampRepairs: v.dampRepairs,
        lastContactDays: 0, humidity: null, household, tenant
      });
      this.message = p.added.replace("{address}", v.address);
    } else {
      Object.assign(App.home(this.editingId), { address: v.address, type: v.type, epc: v.epc, dampRepairs: v.dampRepairs, household, tenant });
      this.message = p.saved.replace("{address}", v.address);
    }
    this.close();
  },

  close() {
    this.editingId = null;
    this.draft = null;
    this.errors = {};
    App.save();
    const msg = document.getElementById("properties-message");
    if (msg) msg.focus();
  },

  open(id) {
    this.editingId = id;
    this.draft = null;
    this.errors = {};
    this.message = "";
    this.render();
    document.getElementById("property-form-title").focus();
  },

  bind(el) {
    const p = CONTENT.properties;
    el.querySelector("[data-add]").addEventListener("click", () => this.open("new"));
    el.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => this.open(btn.dataset.edit)));
    el.querySelectorAll("[data-cancel]").forEach((btn) => btn.addEventListener("click", () => {
      this.message = "";
      this.close();
    }));

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

    const home = this.editingId && this.editingId !== "new" ? App.home(this.editingId) : null;
    const remove = el.querySelector("[data-remove-tenant]");
    if (remove) remove.addEventListener("click", () => {
      if (!confirm(p.removeTenantConfirm.replace("{name}", home.tenant.name).replace("{address}", home.address))) return;
      home.tenant = null;
      home.household = emptyHousehold();
      this.message = p.removed.replace("{address}", home.address);
      this.close();
    });

    const del = el.querySelector("[data-delete]");
    if (del) del.addEventListener("click", () => {
      const count = App.state.reports.filter((r) => r.homeId === home.id).length;
      if (!confirm(p.deleteConfirm.replace("{address}", home.address).replace("{count}", count))) return;
      App.state.homes = App.state.homes.filter((h) => h.id !== home.id);
      App.state.reports = App.state.reports.filter((r) => r.homeId !== home.id);
      if (typeof Office !== "undefined" && Office.openHomeId === home.id) Office.openHomeId = null;
      this.message = p.deleted.replace("{address}", home.address);
      this.close();
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

App.views.properties = Properties;
