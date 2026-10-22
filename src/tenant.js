// The tenant's phone: monthly prompt, reporting damp and mould, and progress updates.

const Tenant = {
  screen: "home", // home | form | done | status
  currentRef: null,
  errors: null,

  go(screen, ref) {
    this.screen = screen;
    this.currentRef = ref || this.currentRef;
    this.errors = null;
    this.render();
    const heading = document.querySelector("#tenant-screen h2");
    if (heading) heading.focus();
  },

  render() {
    const el = document.getElementById("tenant-screen");
    const t = CONTENT.tenant;
    const home = App.home(DATA.you);
    if (this.screen === "form") el.innerHTML = this.formHtml(t);
    else if (this.screen === "done") el.innerHTML = this.doneHtml(t);
    else if (this.screen === "status") el.innerHTML = this.statusHtml(t);
    else el.innerHTML = this.homeHtml(t, home);
    this.bind(el);
  },

  homeHtml(t, home) {
    const reports = App.reportsFor(home.id);
    const prompt = App.state.promptAnswered
      ? `<p class="notice">${esc(t.promptThanks)}</p>`
      : `<div class="card prompt">
          <h3>${esc(t.promptTitle)}</h3>
          <p>${esc(t.promptText)}</p>
          <div class="button-row">
            <button type="button" class="button" data-action="prompt-yes">${esc(t.promptYes)}</button>
            <button type="button" class="button secondary" data-action="prompt-no">${esc(t.promptNo)}</button>
          </div>
        </div>`;
    const list = reports.length
      ? `<ul class="report-list">${reports.map((r) => `
          <li class="card">
            <p class="report-ref">${esc(r.ref)} · ${esc(formatDate(r.date))}</p>
            <p><strong>${esc(t.statusSteps[r.status])}</strong></p>
            <button type="button" class="link-button" data-action="status" data-ref="${esc(r.ref)}">${esc(t.viewReport)}<span class="visually-hidden"> for ${esc(r.ref)}</span></button>
          </li>`).join("")}</ul>`
      : `<p>${esc(t.noReports)}</p>`;
    return `
      <h2 tabindex="-1">${esc(t.greeting)}</h2>
      <p class="muted">${esc(home.address)}</p>
      ${prompt}
      <button type="button" class="button wide" data-action="form">${esc(t.reportButton)}</button>
      <h3>${esc(t.yourReports)}</h3>
      ${list}`;
  },

  formHtml(t) {
    const e = this.errors || {};
    const summary = this.errors
      ? `<div class="error-summary" role="alert" tabindex="-1">
          <h3>${esc(t.errorSummary)}</h3>
          <ul>${Object.entries(e).map(([id, msg]) => `<li><a href="#${id}">${esc(msg)}</a></li>`).join("")}</ul>
        </div>`
      : "";
    return `
      <button type="button" class="link-button back" data-action="home">${esc(t.back)}</button>
      <h2 tabindex="-1">${esc(t.formTitle)}</h2>
      ${summary}
      <form id="report-form" novalidate>
        <fieldset class="field ${e["rooms-0"] ? "has-error" : ""}" aria-describedby="rooms-hint${e["rooms-0"] ? " rooms-error" : ""}">
          <legend>${esc(t.roomsLabel)}</legend>
          <p class="hint" id="rooms-hint">${esc(t.roomsHint)}</p>
          ${e["rooms-0"] ? `<p class="error" id="rooms-error"><span class="visually-hidden">Error: </span>${esc(e["rooms-0"])}</p>` : ""}
          ${t.rooms.map((room, i) => `
            <div class="choice">
              <input type="checkbox" id="rooms-${i}" name="rooms" value="${esc(room)}">
              <label for="rooms-${i}">${esc(room)}</label>
            </div>`).join("")}
        </fieldset>

        <fieldset class="field ${e["severity-0"] ? "has-error" : ""}" ${e["severity-0"] ? 'aria-describedby="severity-error"' : ""}>
          <legend>${esc(t.severityLabel)}</legend>
          ${e["severity-0"] ? `<p class="error" id="severity-error"><span class="visually-hidden">Error: </span>${esc(e["severity-0"])}</p>` : ""}
          ${t.severities.map((s, i) => `
            <div class="choice">
              <input type="radio" id="severity-${i}" name="severity" value="${s.value}" aria-describedby="severity-${i}-hint">
              <label for="severity-${i}">${esc(s.label)}</label>
              <p class="hint" id="severity-${i}-hint">${esc(s.hint)}</p>
            </div>`).join("")}
        </fieldset>

        <fieldset class="field">
          <legend>${esc(t.healthLabel)}</legend>
          <p class="hint">${esc(t.healthHint)}</p>
          ${t.healthOptions.map((o, i) => `
            <div class="choice">
              <input type="radio" id="health-${i}" name="health" value="${o.value}">
              <label for="health-${i}">${esc(o.label)}</label>
            </div>`).join("")}
        </fieldset>

        <div class="field">
          <label for="note">${esc(t.noteLabel)}</label>
          <textarea id="note" name="note" rows="3"></textarea>
        </div>

        <button type="submit" class="button wide">${esc(t.submit)}</button>
      </form>`;
  },

  doneHtml(t) {
    return `
      <div class="panel-success">
        <h2 tabindex="-1">${esc(t.doneTitle)}</h2>
        <p>${esc(t.doneRef)}<br><strong class="big-ref">${esc(this.currentRef)}</strong></p>
      </div>
      <h3>${esc(t.doneNext)}</h3>
      <ol>${t.doneSteps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <button type="button" class="button wide" data-action="home">${esc(t.doneButton)}</button>`;
  },

  statusHtml(t) {
    const r = App.state.reports.find((x) => x.ref === this.currentRef);
    const order = ["received", "visit", "repair", "fixed"];
    const reached = order.indexOf(r.status);
    return `
      <button type="button" class="link-button back" data-action="home">${esc(t.back)}</button>
      <h2 tabindex="-1">${esc(t.statusTitle)} ${esc(r.ref)}</h2>
      <p class="muted">${esc(r.rooms.join(", "))} · ${esc(formatDate(r.date))}</p>
      <ol class="steps">
        ${order.map((step, i) => `
          <li class="${i <= reached ? "done" : ""}" ${i === reached ? 'aria-current="step"' : ""}>
            <span class="step-mark" aria-hidden="true">${i <= reached ? "✓" : ""}</span>
            <span>${esc(t.statusSteps[step])}${i <= reached ? "" : '<span class="visually-hidden"> (not yet)</span>'}</span>
            ${step === "visit" && r.officer ? `<p class="hint">${esc(t.visitText.replace("{officer}", r.officer).replace("{date}", formatDate(r.visitDate)))}</p>` : ""}
          </li>`).join("")}
      </ol>
      ${reached >= order.indexOf("repair") ? this.foundHtml(t, r) : ""}`;
  },

  // What the housing officer found: a short summary first, then the full report for anyone who wants it.
  foundHtml(t, r) {
    const f = DATA.findings[r.ref] || DATA.findings.default;
    const row = (label, value) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`;
    return `
      <section class="card found" aria-labelledby="found-title">
        <h3 id="found-title">${esc(t.foundTitle)}</h3>
        <p><span class="found-outcome">${esc(f.outcome)}</span></p>
        <p>${esc(f.summary)}</p>
        ${r.officer ? `<p class="hint">${esc(t.foundVisited.replace("{officer}", r.officer).replace("{date}", formatDate(r.visitDate)))}</p>` : ""}
        <details>
          <summary>${esc(t.foundMore)}</summary>
          <dl class="found-details">
            ${row(t.foundChecked, f.checked)}
            ${row(t.foundCause, f.cause)}
            ${row(t.foundReading, f.reading)}
            ${row(t.foundMould, f.mould)}
            <dt>${esc(t.foundPlan)}</dt>
            <dd><ul>${f.plan.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></dd>
          </dl>
        </details>
      </section>`;
  },

  bind(el) {
    el.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        if (action === "prompt-yes") { App.state.promptAnswered = true; this.go("form"); }
        else if (action === "prompt-no") { App.state.promptAnswered = true; App.save(); }
        else if (action === "status") this.go("status", btn.dataset.ref);
        else this.go(action);
      });
    });

    const form = el.querySelector("#report-form");
    if (form) form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      this.submit(form);
    });
  },

  submit(form) {
    const t = CONTENT.tenant;
    const data = new FormData(form);
    const rooms = data.getAll("rooms");
    const severity = data.get("severity");
    const errors = {};
    if (!rooms.length) errors["rooms-0"] = t.errorRooms;
    if (!severity) errors["severity-0"] = t.errorSeverity;
    if (Object.keys(errors).length) {
      this.errors = errors;
      this.render();
      document.querySelector("#tenant-screen .error-summary").focus();
      return;
    }

    const ref = "DM-" + App.state.nextRef++;
    App.state.reports.push({
      ref, homeId: DATA.you, date: todayIso(), rooms, severity,
      health: data.get("health") || "skip", note: data.get("note") || "",
      status: "received", seen: false
    });
    App.state.promptAnswered = true;
    this.currentRef = ref;
    App.save();
    this.go("done", ref);
  }
};

App.views.tenant = Tenant;
