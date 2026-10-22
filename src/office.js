// Cloch head office: alerts, homes ranked by risk with reasons, and booking visits.

const Office = {
  filter: "all",
  openHomeId: null,
  dateError: false,

  render() {
    const o = CONTENT.office;
    const el = document.getElementById("office-screen");
    const ranked = App.state.homes
      .map((home) => ({ home, risk: Risk.score(home), report: App.openReport(home.id) }))
      .sort((a, b) => b.risk.total - a.risk.total);
    const shown = this.filter === "high" ? ranked.filter((r) => r.risk.band === "high") : ranked;

    el.innerHTML = `
      ${this.alertsHtml(o)}
      <div class="office-layout">
        <section class="card" aria-labelledby="list-title">
          <h2 id="list-title">${esc(o.listTitle)}</h2>
          <p class="muted">${esc(o.listIntro)}</p>
          <div class="field inline">
            <label for="risk-filter">${esc(o.filterLabel)}</label>
            <select id="risk-filter">
              <option value="all" ${this.filter === "all" ? "selected" : ""}>${esc(o.filterAll)}</option>
              <option value="high" ${this.filter === "high" ? "selected" : ""}>${esc(o.filterHigh)}</option>
            </select>
          </div>
          <div class="table-scroll" tabindex="0" role="region" aria-labelledby="list-title">
            <table>
              <thead><tr>
                <th scope="col">${esc(o.cols.rank)}</th>
                <th scope="col">${esc(o.cols.home)}</th>
                <th scope="col">${esc(o.cols.risk)}</th>
                <th scope="col">${esc(o.cols.why)}</th>
                <th scope="col">${esc(o.cols.status)}</th>
                <th scope="col">${esc(o.cols.deadline)}</th>
                <th scope="col"><span class="visually-hidden">Actions</span></th>
              </tr></thead>
              <tbody>
                ${shown.map((row) => `
                  <tr class="${row.home.id === this.openHomeId ? "selected" : ""}">
                    <td>${ranked.indexOf(row) + 1}</td>
                    <td>${esc(row.home.address)}</td>
                    <td><span class="badge ${row.risk.band}">${esc(o.bands[row.risk.band])}</span> <span class="score">${row.risk.total}</span></td>
                    <td class="why">${esc(row.risk.reasons.slice(0, 2).map((r) => r.text).join("; "))}</td>
                    <td>${row.report ? esc(CONTENT.tenant.statusSteps[row.report.status]) : `<span class="muted">${esc(o.noStatus)}</span>`}</td>
                    <td>${row.report ? this.deadlineHtml(o.awaab, row.report) : ""}</td>
                    <td><button type="button" class="button small" data-review="${row.home.id}">${esc(o.review)}<span class="visually-hidden"> ${esc(row.home.address)}</span></button></td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </section>
        ${this.openHomeId ? this.detailHtml(o) : ""}
      </div>`;
    this.bind(el);
  },

  alertsHtml(o) {
    const fresh = App.state.reports.filter((r) => !r.seen);
    return `
      <section class="card alerts" aria-labelledby="alerts-title">
        <h2 id="alerts-title">${esc(o.alertsTitle)} <span class="count">${fresh.length}</span></h2>
        ${fresh.length ? `<ul>${fresh.map((r) => `
          <li>
            <span><strong>${esc(App.home(r.homeId).address)}</strong>: ${esc(r.rooms.join(", "))}, ${esc(r.severity === "large" ? "a lot" : r.severity === "medium" ? "a few patches" : "a small patch")} · ${esc(formatDate(r.date))}</span>
            <span class="button-row">
              <button type="button" class="button small" data-review="${r.homeId}">${esc(o.review)}</button>
              <button type="button" class="button small secondary" data-seen="${r.ref}">${esc(o.markSeen)}</button>
            </span>
          </li>`).join("")}</ul>` : `<p class="muted">${esc(o.noAlerts)}</p>`}
      </section>`;
  },

  // The next Awaab's Law step for the list: what's due, when, and how long is left.
  deadlineHtml(a, report) {
    if (!Awaab.covered(report)) return `<span class="muted">${esc(a.notCovered)}</span>`;
    const next = Awaab.steps(report).next;
    if (!next) return esc(a.allDone);
    return `${esc(a.by.replace("{step}", a.steps[next.key]).replace("{date}", shortDate(next.due)))}<br>${this.leftHtml(a, next.left)}`;
  },

  leftHtml(a, left) {
    if (left < 0) return `<span class="badge high">${esc(a.overdue)}</span> <span class="score">${esc(left === -1 ? a.overdueByOne : a.overdueBy.replace("{n}", -left))}</span>`;
    if (left === 0) return `<span class="badge medium">${esc(a.dueToday)}</span>`;
    return `<span class="score">${esc(left === 1 ? a.leftOne : a.left.replace("{n}", left))}</span>`;
  },

  // Every step for one report, so head office can see the whole clock.
  awaabHtml(a, report) {
    if (!Awaab.covered(report)) return `<h3>${esc(a.title)}</h3><p class="muted">${esc(a.notCovered)}</p>`;
    const { steps, next } = Awaab.steps(report);
    return `
      <h3>${esc(a.title)}</h3>
      <p class="hint">${esc(a.intro)}</p>
      <ul class="deadlines">${steps.map((s) => `
        <li class="${s.done ? "done" : s === next ? "next" : ""}">
          <strong>${esc(a.steps[s.key])}</strong>:
          ${s.done ? esc(s.doneOn ? a.done.replace("{date}", shortDate(s.doneOn)) : a.doneNoDate)
            : s.due ? `by ${esc(shortDate(s.due))}${s === next ? ` · ${this.leftHtml(a, s.left)}` : ""}`
            : `<span class="muted">${esc(a.notYet)}</span>`}
        </li>`).join("")}</ul>
      <p class="hint">${esc(a.source)}</p>`;
  },

  detailHtml(o) {
    const home = App.home(this.openHomeId);
    const risk = Risk.score(home);
    const report = App.openReport(home.id);
    const hh = home.household;
    const facts = [
      `${hh.people} ${hh.people === 1 ? "person" : "people"}`,
      hh.olderPerson && "older person",
      hh.youngChild && "young child",
      hh.breathingCondition === true && "breathing problems (shared by tenant)"
    ].filter(Boolean).join(", ");

    let actions = "";
    if (report && report.status === "received") {
      const covered = Awaab.covered(report);
      const deadline = Awaab.steps(report).steps[0].due;
      let visitDate = todayIso(risk.band === "high" ? 1 : 5);
      if (covered && visitDate > deadline) visitDate = deadline < todayIso() ? todayIso() : deadline;
      if (this.dateError) visitDate = this.dateValue;
      actions = `
        <h3>${esc(o.assignTitle)}</h3>
        <form id="assign-form" novalidate>
          <div class="field">
            <label for="officer">${esc(o.officerLabel)}</label>
            <select id="officer">${DATA.officers.map((n) => `<option>${esc(n)}</option>`).join("")}</select>
          </div>
          <div class="field ${this.dateError ? "has-error" : ""}">
            <label for="visit-date">${esc(o.dateLabel)}</label>
            ${covered ? `<p class="hint" id="visit-date-hint">${esc(o.awaab.visitHint.replace("{date}", formatDate(deadline)))}</p>` : ""}
            ${this.dateError ? `<p class="error" id="visit-date-error"><span class="visually-hidden">Error: </span>${esc(o.dateError)}</p>` : ""}
            <input type="date" id="visit-date" required min="${todayIso()}" value="${esc(visitDate)}"
              aria-describedby="${[covered && "visit-date-hint", this.dateError && "visit-date-error", "visit-date-late"].filter(Boolean).join(" ")}"
              ${this.dateError ? 'aria-invalid="true"' : ""}>
            <p class="warning" id="visit-date-late" aria-live="polite">${covered && visitDate > deadline ? esc(o.awaab.lateWarning) : ""}</p>
          </div>
          <button type="submit" class="button">${esc(o.assignButton)}</button>
        </form>`;
    } else if (report && report.status === "visit") {
      actions = `<p>${esc(CONTENT.tenant.visitText.replace("{officer}", report.officer).replace("{date}", formatDate(report.visitDate)))}</p>
        <button type="button" class="button" data-progress="repair">${esc(o.repairButton)}</button>`;
    } else if (report && report.status === "repair") {
      actions = `<button type="button" class="button" data-progress="fixed">${esc(o.fixedButton)}</button>`;
    }

    return `
      <section class="card detail" aria-labelledby="detail-title">
        <div class="detail-head">
          <h2 id="detail-title" tabindex="-1">${esc(home.address)}</h2>
          <button type="button" class="link-button" data-close>${esc(o.close)}</button>
        </div>
        <p><span class="badge ${risk.band}">${esc(o.bands[risk.band])} risk</span> <span class="score">${risk.total} / 100</span></p>
        <h3>${esc(o.detailTitle)}</h3>
        <ul class="reasons">${risk.reasons.map((r) => `<li><span class="points">+${r.points}</span> ${esc(r.text)}</li>`).join("")}</ul>
        <h3>${esc(o.household)}</h3>
        <p>${esc(home.type)}, energy rating ${esc(home.epc)}. ${esc(facts)}.</p>
        <p class="hint">${esc(o.consentNote)}</p>
        <h3>${esc(o.sensorTitle)}</h3>
        <p>${home.sensor ? esc(o.sensorText
          .replaceAll("{cold}", home.sensor.coldDays).replaceAll("{damp}", home.sensor.dampDays)
          .replaceAll("{days}", home.sensor.days).replaceAll("{temp}", home.sensor.avgTemp)
          .replaceAll("{humidity}", home.sensor.avgHumidity)) : `<span class="muted">${esc(o.noSensor)}</span>`}</p>
        ${report ? `<h3>${esc(o.reports)}</h3>
          <p>${esc(report.ref)}: ${esc(report.rooms.join(", "))} · ${esc(formatDate(report.date))}${report.note ? `<br>“${esc(report.note)}”` : ""}</p>` : ""}
        ${report ? this.awaabHtml(o.awaab, report) : ""}
        ${actions}
      </section>`;
  },

  bind(el) {
    el.querySelector("#risk-filter").addEventListener("change", (ev) => {
      this.filter = ev.target.value;
      this.render();
      document.getElementById("risk-filter").focus();
    });
    el.querySelectorAll("[data-review]").forEach((btn) => btn.addEventListener("click", () => {
      this.openHomeId = btn.dataset.review;
      this.dateError = false;
      const report = App.openReport(this.openHomeId);
      if (report) report.seen = true;
      App.save();
      document.getElementById("detail-title").focus();
    }));
    el.querySelectorAll("[data-seen]").forEach((btn) => btn.addEventListener("click", () => {
      App.state.reports.find((r) => r.ref === btn.dataset.seen).seen = true;
      App.save();
    }));
    const close = el.querySelector("[data-close]");
    if (close) close.addEventListener("click", () => {
      const homeId = this.openHomeId;
      this.openHomeId = null;
      this.render();
      // Put keyboard focus back on the Review button the person came from.
      const back = document.querySelector(`#office-screen table [data-review="${homeId}"]`);
      if (back) back.focus();
    });

    const report = this.openHomeId && App.openReport(this.openHomeId);
    const visitInput = el.querySelector("#visit-date");
    if (visitInput && report && Awaab.covered(report)) visitInput.addEventListener("input", () => {
      const late = visitInput.value > Awaab.steps(report).steps[0].due;
      document.getElementById("visit-date-late").textContent = late ? CONTENT.office.awaab.lateWarning : "";
    });
    const assign = el.querySelector("#assign-form");
    if (assign) assign.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const date = document.getElementById("visit-date").value;
      if (!date || date < todayIso()) {
        this.dateError = true;
        this.dateValue = date; // keep what they typed, so they can see what was wrong
        this.render();
        document.getElementById("visit-date").focus();
        return;
      }
      this.dateError = false;
      report.status = "visit";
      report.officer = document.getElementById("officer").value;
      report.visitDate = document.getElementById("visit-date").value;
      App.save();
      document.getElementById("detail-title").focus(); // redrawing loses focus, so keep the person in the panel
    });
    el.querySelectorAll("[data-progress]").forEach((btn) => btn.addEventListener("click", () => {
      report.status = btn.dataset.progress;
      if (report.status === "repair") report.repairStarted = todayIso(); // starts the 20-working-day repair clock
      App.save();
      document.getElementById("detail-title").focus();
    }));
  }
};

App.views.office = Office;
