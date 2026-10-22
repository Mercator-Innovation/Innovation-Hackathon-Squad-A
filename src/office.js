// Cloch head office: alerts, homes ranked by risk with reasons, filters and sorting,
// Awaab's Law deadlines, and booking visits.

// Awaab's Law (Scotland), in force from 6 October 2026. Maximum times, in working days.
// Weekends are skipped; bank holidays aren't, so treat the dates as a guide.
const AWAAB = { investigate: 10, summary: 3, startRepair: 5, finishRepair: 20 };
const AWAAB_FROM = "2026-10-06"; // reports made before this date aren't covered

// Our own rule, stricter than the law: how soon a housing officer should visit, by risk.
const VISIT_WITHIN = { high: 2, medium: 5, low: 10 };

function addWorkingDays(iso, days) {
  const d = new Date(iso + "T12:00:00");
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) left--;
  }
  return d.toISOString().slice(0, 10);
}

// Working days from today to a date: negative if it's passed.
function workingDaysUntil(iso) {
  const today = todayIso();
  if (iso === today) return 0;
  const forward = iso > today;
  const d = new Date((forward ? today : iso) + "T12:00:00");
  const end = forward ? iso : today;
  let count = 0;
  while (d.toISOString().slice(0, 10) < end) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) count++;
  }
  return forward ? count : -count;
}

// "Due in 1 working day" or "Due in 3 working days".
function daysText(template, n) {
  return template.replace("{n}", n).replace("{days}", n === 1 ? "day" : "days");
}

const Deadlines = {
  covered(report) {
    return report.date >= AWAAB_FROM;
  },

  // Every legal step for a report, with its due date and whether it's done.
  steps(report) {
    const today = todayIso();
    const visited = report.visitDate && report.visitDate <= today && report.status !== "received";
    const investigateBy = addWorkingDays(report.date, AWAAB.investigate);
    const steps = [
      { key: "investigate", due: investigateBy, done: visited ? report.visitDate : null }
    ];
    if (visited) {
      const repairStarted = report.repairStarted || (report.status === "repair" || report.status === "fixed" ? report.visitDate : null);
      steps.push(
        { key: "summary", due: addWorkingDays(report.visitDate, AWAAB.summary), done: report.summarySent || null },
        { key: "startRepair", due: addWorkingDays(report.visitDate, AWAAB.startRepair), done: repairStarted }
      );
      if (repairStarted) {
        steps.push({ key: "finishRepair", due: addWorkingDays(repairStarted, AWAAB.finishRepair), done: report.status === "fixed" ? (report.fixedDate || today) : null });
      }
    }
    return steps;
  },

  // The soonest step still to do, or null.
  next(report) {
    if (!report || report.status === "fixed" || !this.covered(report)) return null;
    const open = this.steps(report).filter((s) => !s.done).sort((a, b) => a.due.localeCompare(b.due));
    return open[0] || null;
  }
};

const Office = {
  filters: { risk: "all", status: "all", officer: "all", town: "all" },
  sort: "risk",
  openHomeId: null,
  fullScreen: false, // the review shown full width, instead of next to the list
  search: "",
  assignError: null,
  dateValue: null,

  rows() {
    return App.state.homes
      .map((home) => {
        const report = App.openReport(home.id);
        return { home, risk: Risk.score(home), report, next: Deadlines.next(report) };
      })
      .sort((a, b) => b.risk.total - a.risk.total)
      .map((row, i) => ({ ...row, rank: i + 1 }));
  },

  statusKey(row) {
    return row.report ? row.report.status : "none";
  },

  officerOf(row) {
    return row.report && row.report.officer && row.report.status !== "received" ? row.report.officer : null;
  },

  town(home) {
    return home.address.split(",").pop().trim();
  },

  render() {
    const o = CONTENT.office;
    const el = document.getElementById("office-screen");
    const ranked = this.rows();
    const f = this.filters;
    const words = this.search.toLowerCase().split(/\s+/).filter(Boolean);
    const text = (row) => [row.home.address, row.home.tenant && row.home.tenant.name, row.home.tenant && row.home.tenant.phone,
      ...App.reportsFor(row.home.id).map((r) => r.ref)].filter(Boolean).join(" ").toLowerCase();
    const shown = ranked.filter((row) =>
      words.every((w) => text(row).includes(w) || text(row).replace(/\s/g, "").includes(w)) &&
      (f.risk === "all" || row.risk.band === f.risk) &&
      (f.status === "all" || this.statusKey(row) === f.status) &&
      (f.officer === "all" || (f.officer === "none" ? !this.officerOf(row) : this.officerOf(row) === f.officer)) &&
      (f.town === "all" || this.town(row.home) === f.town)
    );
    if (this.sort === "deadline") {
      shown.sort((a, b) => (a.next ? a.next.due : "9999").localeCompare(b.next ? b.next.due : "9999") || a.rank - b.rank);
    } else if (this.sort === "address") {
      shown.sort((a, b) => a.home.address.localeCompare(b.home.address));
    }
    const towns = [...new Set(App.state.homes.map((h) => this.town(h)))].sort();

    const select = (id, label, value, options) => `
      <div class="field">
        <label for="${id}">${esc(label)}</label>
        <select id="${id}">${options.map(([v, text]) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(text)}</option>`).join("")}</select>
      </div>`;

    if (this.fullScreen && this.openHomeId && App.home(this.openHomeId)) {
      el.innerHTML = this.fullHtml(o);
      this.bind(el);
      return;
    }
    this.fullScreen = false;

    el.innerHTML = `
      ${this.alertsHtml(o)}
      <div class="office-layout">
        <section class="card" aria-labelledby="list-title">
          <h2 id="list-title">${esc(o.listTitle)}</h2>
          <p class="muted">${esc(o.listIntro)}</p>
          ${this.howItWorksHtml(o)}
          <div class="field search">
            <label for="risk-search">${esc(o.searchLabel)}</label>
            <p class="hint" id="risk-search-hint">${esc(o.searchHint)}</p>
            <input type="search" id="risk-search" autocomplete="off" value="${esc(this.search)}" aria-describedby="risk-search-hint">
          </div>
          <fieldset class="filters">
            <legend>${esc(o.filtersTitle)}</legend>
            ${select("filter-risk", o.filterRisk, f.risk, [["all", o.any], ["high", o.bands.high], ["medium", o.bands.medium], ["low", o.bands.low]])}
            ${select("filter-status", o.filterStatus, f.status, [["all", o.any], ["received", o.statuses.received], ["visit", o.statuses.visit], ["repair", o.statuses.repair], ["none", o.noStatus]])}
            ${select("filter-officer", o.filterOfficer, f.officer, [["all", o.any], ["none", o.notAssigned], ...DATA.officers.map((n) => [n, n])])}
            ${select("filter-town", o.filterTown, f.town, [["all", o.any], ...towns.map((t) => [t, t])])}
            ${select("sort-by", o.sortLabel, this.sort, [["risk", o.sortRisk], ["deadline", o.sortDeadline], ["address", o.sortAddress]])}
          </fieldset>
          <p class="result-count" aria-live="polite">${esc(o.showing.replace("{shown}", shown.length).replace("{total}", ranked.length))}
            ${shown.length < ranked.length || this.search ? `<button type="button" class="link-button" data-clear>${esc(o.clearFilters)}</button>` : ""}</p>
          <div class="table-scroll" tabindex="0" role="region" aria-labelledby="list-title">
            <table>
              <thead><tr>
                <th scope="col">${esc(o.cols.rank)}</th>
                <th scope="col">${esc(o.cols.home)}</th>
                <th scope="col">${esc(o.cols.risk)}</th>
                <th scope="col">${esc(o.cols.why)}</th>
                <th scope="col">${esc(o.cols.status)}</th>
                <th scope="col">${esc(o.cols.assigned)}</th>
                <th scope="col">${esc(o.cols.deadline)}</th>
                <th scope="col"><span class="visually-hidden">Actions</span></th>
              </tr></thead>
              <tbody>
                ${shown.length ? shown.map((row) => `
                  <tr class="${row.home.id === this.openHomeId ? "selected" : ""}">
                    <td>${row.rank}</td>
                    <td>${esc(row.home.address)}</td>
                    <td><span class="badge ${row.risk.band}">${esc(o.bands[row.risk.band])}</span> <span class="score">${row.risk.total}</span></td>
                    <td class="why">${esc(row.risk.reasons.slice(0, 2).map((r) => r.text).join("; "))}</td>
                    <td>${row.report ? esc(o.statuses[row.report.status]) : `<span class="muted">${esc(o.noStatus)}</span>`}</td>
                    <td>${this.officerOf(row) ? esc(this.officerOf(row)) : `<span class="muted">${esc(o.notAssigned)}</span>`}</td>
                    <td>${row.report && !Deadlines.covered(row.report) ? `<span class="muted">${esc(o.notCoveredShort)}</span>` : this.deadlineHtml(o, row.next)}</td>
                    <td><button type="button" class="button small" data-review="${row.home.id}">${esc(o.review)}<span class="visually-hidden"> ${esc(row.home.address)}</span></button></td>
                  </tr>`).join("") : `<tr><td colspan="8">${esc(o.noMatches)}</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
        ${this.openHomeId ? this.detailHtml(o) : ""}
      </div>`;
    this.bind(el);
  },

  // A step's due date, with words (not just colour) saying how close it is.
  deadlineHtml(o, step) {
    if (!step) return `<span class="muted">${esc(o.noDeadline)}</span>`;
    const left = workingDaysUntil(step.due);
    const when = left < 0 ? daysText(o.overdue, -left) : left === 0 ? o.dueToday : daysText(o.dueIn, left);
    const level = left < 0 ? "overdue" : left <= 2 ? "soon" : "ok";
    return `<span class="deadline ${level}"><strong>${esc(when)}</strong><br>${esc(o.steps[step.key])}</span>`;
  },

  // How the ranking works, as pictures: a bar for each thing that adds points, the risk bands on
  // a 0 to 100 scale, and the deadlines as steps. Every picture has its numbers in words too.
  howItWorksHtml(o) {
    const max = Math.max(...o.howPoints.map(([pts]) => Number(String(pts).match(/\d+(?!.*\d)/)[0])));
    const bars = o.howPoints.map(([pts, text]) => {
      const top = Number(String(pts).match(/\d+(?!.*\d)/)[0]);
      return `<li><span class="how-label">${esc(text)}</span>
        <span class="how-bar" aria-hidden="true"><span style="width:${Math.round(100 * top / max)}%"></span></span>
        <span class="how-pts">${esc(pts)}</span></li>`;
    }).join("");
    const days = (n) => `${n} working ${n === 1 ? "day" : "days"}`;
    const steps = [["investigate", AWAAB.investigate, o.howFromReport], ["summary", AWAAB.summary, o.howFromVisit],
      ["startRepair", AWAAB.startRepair, o.howFromVisit], ["finishRepair", AWAAB.finishRepair, o.howFromStart]];
    return `
      <details class="how-it-works">
        <summary>${esc(o.howTitle)}</summary>
        <p>${esc(o.howIntro)}</p>
        <h3>${esc(o.howPointsTitle)}</h3>
        <ul class="how-bars">${bars}</ul>
        <h3>${esc(o.howBandsTitle)}</h3>
        <div class="how-scale" aria-hidden="true">
          <span class="low" style="width:35%">${esc(o.bands.low)}</span><span class="medium" style="width:25%">${esc(o.bands.medium)}</span><span class="high" style="width:40%">${esc(o.bands.high)}</span>
        </div>
        <div class="how-scale-ticks" aria-hidden="true"><span>0</span><span style="left:35%">35</span><span style="left:60%">60</span><span style="left:100%">100</span></div>
        <p>${esc(o.howBands)}</p>
        <h3>${esc(o.howVisitsTitle)}</h3>
        <ul class="how-visits">
          ${["high", "medium", "low"].map((b) => `<li><span class="badge ${b}">${esc(o.bands[b])}</span> ${esc(o.howWithin.replace("{days}", days(VISIT_WITHIN[b])))}</li>`).join("")}
        </ul>
        <h3>${esc(o.howLawTitle)}</h3>
        <ol class="how-steps">
          ${steps.map(([key, n, from]) => `<li><strong>${esc(o.steps[key])}</strong><span class="how-days">${esc(days(n))}</span><span class="hint">${esc(from)}</span></li>`).join("")}
        </ol>
        <p class="hint">${esc(o.howLawNote)}</p>
      </details>`;
  },

  alertsHtml(o) {
    const fresh = App.state.reports.filter((r) => !r.seen && App.home(r.homeId));
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

  // The window for booking a visit: from the next working day to our risk rule or the legal limit, whichever is sooner.
  visitWindow(report, band) {
    const earliest = addWorkingDays(todayIso(), 1);
    const byRisk = addWorkingDays(todayIso(), VISIT_WITHIN[band]);
    const byLaw = addWorkingDays(report.date, AWAAB.investigate);
    const latest = byRisk < byLaw ? byRisk : byLaw;
    return { earliest, latest: latest < earliest ? earliest : latest, byLaw };
  },

  // The pieces of a review, shared by the side panel and the full screen.
  detailParts(o) {
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

    const today = todayIso();
    let actions = "";
    if (report && report.status === "received") {
      const win = this.visitWindow(report, risk.band);
      const err = this.assignError;
      actions = `
        <h3>${esc(o.assignTitle)}</h3>
        <form id="assign-form" novalidate>
          <div class="field">
            <label for="officer">${esc(o.officerLabel)}</label>
            <select id="officer">${DATA.officers.map((n) => `<option>${esc(n)}</option>`).join("")}</select>
          </div>
          <div class="field ${err ? "has-error" : ""}">
            <label for="visit-date">${esc(o.dateLabel)}</label>
            <p class="hint" id="visit-date-hint">${esc(o.visitRule.replace("{band}", o.bands[risk.band].toLowerCase()).replace("{n}", VISIT_WITHIN[risk.band]).replace("{latest}", formatDate(win.latest)))}</p>
            ${Deadlines.covered(report) && win.earliest > win.byLaw ? `<p class="warning" id="visit-date-late">${esc(o.lateWarning.replace("{date}", formatDate(win.byLaw)))}</p>` : ""}
            ${err ? `<p class="error" id="visit-date-error"><span class="visually-hidden">Error: </span>${esc(err)}</p>` : ""}
            <input type="date" id="visit-date" required value="${err ? esc(this.dateValue) : win.earliest}" min="${win.earliest}" max="${win.latest}"
              aria-describedby="visit-date-hint${Deadlines.covered(report) && win.earliest > win.byLaw ? " visit-date-late" : ""}${err ? " visit-date-error" : ""}" ${err ? 'aria-invalid="true"' : ""}>
          </div>
          <button type="submit" class="button">${esc(o.assignButton)}</button>
        </form>`;
    } else if (report && report.status === "visit") {
      const visited = report.visitDate <= today;
      actions = `<p>${esc(CONTENT.tenant.visitText.replace("{officer}", report.officer).replace("{date}", formatDate(report.visitDate)))}</p>
        ${visited ? `<div class="button-row">
          ${report.summarySent ? "" : `<button type="button" class="button secondary" data-summary>${esc(o.summaryButton)}</button>`}
          <button type="button" class="button" data-progress="repair">${esc(o.repairButton)}</button>
        </div>` : `<p class="hint">${esc(o.afterVisit)}</p>`}`;
    } else if (report && report.status === "repair") {
      actions = `<div class="button-row">
        ${report.summarySent ? "" : `<button type="button" class="button secondary" data-summary>${esc(o.summaryButton)}</button>`}
        <button type="button" class="button" data-progress="fixed">${esc(o.fixedButton)}</button>
      </div>`;
    }

    const li = (items) => `<ul class="facts-list">${items.filter(Boolean).map((i) => `<li>${i}</li>`).join("")}</ul>`;
    const household = li([
      esc(home.type), esc(o.epcItem.replace("{epc}", home.epc)), ...facts.split(", ").map((f) => esc(f))
    ]);
    const sensor = home.sensor
      ? li(o.sensorText.replaceAll("{cold}", home.sensor.coldDays).replaceAll("{damp}", home.sensor.dampDays)
          .replaceAll("{days}", home.sensor.days).replaceAll("{temp}", home.sensor.avgTemp)
          .replaceAll("{humidity}", home.sensor.avgHumidity).split(". ").map((s) => esc(s.replace(/\.$/, ""))))
      : `<p class="muted">${esc(o.noSensor)}</p>`;
    const reportPart = report ? li([
      `<strong>${esc(o.refItem)}</strong> ${esc(report.ref)}`,
      `<strong>${esc(o.roomsItem)}</strong> ${esc(report.rooms.join(", "))}`,
      `<strong>${esc(o.dateItem)}</strong> ${esc(formatDate(report.date))}`,
      report.note && `<strong>${esc(o.noteItem)}</strong> “${esc(report.note)}”`
    ]) + this.answersHtml(report) : "";
    return {
      home, risk, report, actions, household, sensor, reportPart,
      why: `<ul class="reasons">${risk.reasons.map((r) => `<li><span class="points">+${r.points}</span> ${esc(r.text)}</li>`).join("")}</ul>`,
      law: report ? this.lawHtml(o, report) : "",
      badge: `<p><span class="badge ${risk.band}">${esc(o.bands[risk.band])} risk</span> <span class="score">${risk.total} / 100</span></p>`
    };
  },

  // The review, next to the list.
  detailHtml(o) {
    const d = this.detailParts(o);
    return `
      <section class="card detail" aria-labelledby="detail-title">
        <div class="detail-head">
          <h2 id="detail-title" tabindex="-1">${esc(d.home.address)}</h2>
          <button type="button" class="link-button" data-close>${esc(o.close)}</button>
        </div>
        <p><button type="button" class="button secondary small" data-full>${esc(o.fullScreen)}<span class="visually-hidden"> ${esc(o.forHome.replace("{address}", d.home.address))}</span></button></p>
        ${d.badge}
        <h3>${esc(o.detailTitle)}</h3>
        ${d.why}
        <h3>${esc(o.household)}</h3>
        ${d.household}
        <p class="hint">${esc(o.consentNote)}</p>
        <h3>${esc(o.sensorTitle)}</h3>
        ${d.sensor}
        ${d.report ? `<h3>${esc(o.reports)}</h3>${d.reportPart}${d.law}` : ""}
        ${d.actions}
      </section>`;
  },

  // The same review across the whole screen, with room for photos and the deadlines.
  fullHtml(o) {
    const d = this.detailParts(o);
    const t = d.home.tenant;
    return `
      <p><button type="button" class="link-button" data-exit-full>‹ ${esc(o.backToList)}</button></p>
      <div class="record-head">
        <h2 id="detail-title" tabindex="-1">${esc(d.home.address)}</h2>
        <button type="button" class="button secondary" data-open-record>${esc(o.openRecord)}</button>
      </div>
      ${d.badge}
      ${t ? `<p class="muted">${esc(o.tenantLine.replace("{name}", t.name))}</p>` : ""}
      <div class="record-grid full-review">
        <section class="card" aria-labelledby="full-why"><h3 id="full-why">${esc(o.detailTitle)}</h3>${d.why}</section>
        <section class="card" aria-labelledby="full-household"><h3 id="full-household">${esc(o.household)}</h3>${d.household}
          <p class="hint">${esc(o.consentNote)}</p>
          <h3>${esc(o.sensorTitle)}</h3>${d.sensor}</section>
        ${d.report ? `<section class="card" aria-labelledby="full-law">${d.law.replace("<h3>", '<h3 id="full-law">')}</section>` : ""}
      </div>
      ${d.report ? `<section class="card full-report" aria-labelledby="full-report"><h3 id="full-report">${esc(o.reports)}</h3>${d.reportPart}</section>` : `<section class="card"><p class="muted">${esc(o.noStatus)}</p></section>`}
      ${d.actions ? `<section class="card" aria-labelledby="full-next"><h3 id="full-next">${esc(o.nextStep)}</h3>${d.actions}</section>` : ""}`;
  },

  // The tenant's answers from the report form, in the tenant's own words. Skipped questions aren't shown.
  answersHtml(report) {
    const t = CONTENT.tenant;
    const pick = (options, values) => options.filter((o) => values.includes(o.value) && o.value !== "skip").map((o) => o.label).join(", ");
    const rows = [
      [t.howLongLabel, pick(t.howLongOptions, [report.howLong || ""])],
      [t.looksLabel, pick(t.looksOptions, report.looks || [])],
      [t.heatingLabel, pick(t.heatingOptions, [report.heating || ""])],
      [t.agesLabel, pick(t.agesOptions, report.ages || [])]
    ].filter(([, answer]) => answer);
    const photos = report.photos || [];
    if (!rows.length && !photos.length) return "";
    return `
          <dl class="answers">${rows.map(([q, a]) => `<dt>${esc(q)}</dt><dd>${esc(a)}</dd>`).join("")}</dl>
          ${photos.length ? `<div class="photo-previews">${photos.map((src, i) => `<img src="${src}" alt="Tenant's photo ${i + 1} of the damp or mould">`).join("")}</div>` : ""}`;
  },

  lawHtml(o, report) {
    if (!Deadlines.covered(report)) return `<h3>${esc(o.lawTitle)}</h3><p class="muted">${esc(o.notCovered)}</p>`;
    const steps = Deadlines.steps(report);
    return `
      <h3>${esc(o.lawTitle)}</h3>
      <ol class="law-steps">
        ${steps.map((s) => {
          const left = workingDaysUntil(s.due);
          const state = s.done
            ? o.stepDone.replace("{date}", formatDate(s.done))
            : left < 0 ? daysText(o.overdue, -left) : left === 0 ? o.dueToday : daysText(o.dueIn, left);
          const cls = s.done ? "done" : left < 0 ? "overdue" : left <= 2 ? "soon" : "";
          return `<li class="${cls}"><strong>${esc(o.steps[s.key])}</strong> by ${esc(formatDate(s.due))}<br><span class="state">${esc(state)}</span></li>`;
        }).join("")}
      </ol>`;
  },

  bind(el) {
    const filterIds = { "filter-risk": "risk", "filter-status": "status", "filter-officer": "officer", "filter-town": "town" };
    Object.entries(filterIds).forEach(([id, key]) => el.querySelector(`#${id}`)?.addEventListener("change", (ev) => {
      this.filters[key] = ev.target.value;
      this.render();
      document.getElementById(id).focus();
    }));
    el.querySelector("#sort-by")?.addEventListener("change", (ev) => { // not there on the full screen
      this.sort = ev.target.value;
      this.render();
      document.getElementById("sort-by").focus();
    });
    const clear = el.querySelector("[data-clear]");
    if (clear) clear.addEventListener("click", () => {
      this.filters = { risk: "all", status: "all", officer: "all", town: "all" };
      this.search = "";
      this.render();
      document.getElementById("filter-risk").focus();
    });

    el.querySelectorAll("[data-review]").forEach((btn) => btn.addEventListener("click", () => {
      this.openHomeId = btn.dataset.review;
      this.assignError = null;
      const report = App.openReport(this.openHomeId);
      if (report) report.seen = true;
      App.save();
      document.getElementById("detail-title").focus();
    }));
    el.querySelectorAll("[data-seen]").forEach((btn) => btn.addEventListener("click", () => {
      App.state.reports.find((r) => r.ref === btn.dataset.seen).seen = true;
      App.save();
    }));
    const search = el.querySelector("#risk-search");
    if (search) search.addEventListener("input", () => {
      this.search = search.value;
      const at = search.selectionStart;
      this.render();
      const box = document.getElementById("risk-search");
      box.focus();
      box.setSelectionRange(at, at);
    });
    const full = el.querySelector("[data-full]");
    if (full) full.addEventListener("click", () => { this.fullScreen = true; this.render(); document.getElementById("detail-title").focus(); });
    const exitFull = el.querySelector("[data-exit-full]");
    if (exitFull) exitFull.addEventListener("click", () => {
      this.fullScreen = false;
      this.render();
      const back = document.querySelector(`#office-screen table [data-review="${this.openHomeId}"]`);
      if (back) back.focus();
    });
    const record = el.querySelector("[data-open-record]");
    if (record) record.addEventListener("click", () => {
      App.state.officeTab = "properties";
      Properties.message = "";
      Properties.go("record", this.openHomeId);
    });
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
    const assign = el.querySelector("#assign-form");
    if (assign) assign.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const o = CONTENT.office;
      const date = document.getElementById("visit-date").value;
      const win = this.visitWindow(report, Risk.score(App.home(this.openHomeId)).band);
      if (!date || date < win.earliest || date > win.latest) {
        this.assignError = o.visitError.replace("{earliest}", formatDate(win.earliest)).replace("{latest}", formatDate(win.latest));
        this.dateValue = date; // keep what they typed, so they can see what was wrong
        this.render();
        document.getElementById("visit-date").focus();
        return;
      }
      this.assignError = null;
      report.status = "visit";
      report.officer = document.getElementById("officer").value;
      report.visitDate = date;
      App.save();
      document.getElementById("detail-title").focus(); // redrawing loses focus, so keep the person in the panel
    });
    el.querySelectorAll("[data-summary]").forEach((btn) => btn.addEventListener("click", () => {
      report.summarySent = todayIso();
      App.save();
      document.getElementById("detail-title").focus();
    }));
    el.querySelectorAll("[data-progress]").forEach((btn) => btn.addEventListener("click", () => {
      report.status = btn.dataset.progress;
      if (report.status === "repair") report.repairStarted = todayIso();
      if (report.status === "fixed") report.fixedDate = todayIso();
      App.save();
      document.getElementById("detail-title").focus();
    }));
  }
};

App.views.office = Office;
