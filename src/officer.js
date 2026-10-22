// Housing officer: their current assignments, and a page for each one where they record what they
// found, whether a repair is needed, whether it's booked, started or done, and any notes.
// What they record is saved on the report, so the tenant sees it in "What we found" and head office
// sees it in the property's history.

const Officer = {
  openRef: null,  // the report being looked at, or null for the list
  draft: null,    // what was typed, kept when the form has errors
  errors: {},
  noteError: null,
  message: "",

  me() {
    if (!DATA.officers.includes(App.state.officerMe)) {
      // Start the demo as the first officer with work to do.
      const busy = DATA.officers.find((n) => this.assignments(n).open.length);
      App.state.officerMe = busy || DATA.officers[0];
    }
    return App.state.officerMe;
  },

  assignments(name) {
    const mine = App.state.reports.filter((r) => r.officer === name && App.home(r.homeId));
    const due = (r) => { const next = Deadlines.next(r); return next ? next.due : r.visitDate || "9999"; };
    return {
      open: mine.filter((r) => r.status !== "fixed").sort((a, b) => due(a).localeCompare(due(b))),
      done: mine.filter((r) => r.status === "fixed").sort((a, b) => (b.fixedDate || "").localeCompare(a.fixedDate || ""))
    };
  },

  render() {
    const c = CONTENT.officer;
    const el = document.getElementById("officer-screen");
    const report = this.openRef && App.state.reports.find((r) => r.ref === this.openRef);
    if (!report || report.officer !== this.me()) this.openRef = null;
    const message = this.message ? `<p class="notice" id="officer-message" tabindex="-1" role="status">${esc(this.message)}</p>` : "";
    el.innerHTML = message + (this.openRef ? this.assignmentHtml(c, report) : this.listHtml(c));
    this.bind(el, report);
  },

  // ---------- The list of assignments ----------

  listHtml(c) {
    const me = this.me();
    const { open, done } = this.assignments(me);
    return `
      <div class="field inline-select">
        <label for="officer-me">${esc(c.meLabel)}</label>
        <p class="hint" id="officer-me-hint">${esc(c.meHint)}</p>
        <select id="officer-me" aria-describedby="officer-me-hint">${DATA.officers.map((n) => `<option ${n === me ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
      </div>
      <h2 id="assignments-title">${esc(c.openTitle.replace("{n}", open.length))}</h2>
      ${open.length ? `<ul class="assignment-list">${open.map((r) => this.cardHtml(c, r)).join("")}</ul>` : `<p>${esc(c.noOpen)}</p>`}
      <details class="done-list">
        <summary>${esc(c.doneTitle.replace("{n}", done.length))}</summary>
        ${done.length ? `<ul class="assignment-list">${done.map((r) => this.cardHtml(c, r)).join("")}</ul>` : `<p class="muted">${esc(c.noDone)}</p>`}
      </details>`;
  },

  cardHtml(c, r) {
    const home = App.home(r.homeId);
    const risk = Risk.score(home);
    const next = Deadlines.next(r);
    let deadline = "";
    if (next) {
      const left = workingDaysUntil(next.due);
      const o = CONTENT.office;
      const when = left < 0 ? daysText(o.overdue, -left) : left === 0 ? o.dueToday : daysText(o.dueIn, left);
      deadline = `<p class="officer-deadline ${left < 0 ? "overdue" : left <= 2 ? "soon" : ""}"><strong>${esc(c.next)}:</strong> ${esc(o.steps[next.key])}. ${esc(when)}.</p>`;
    }
    return `
      <li class="card assignment">
        <div class="record-head">
          <h3>${esc(home.address)}</h3>
          <span class="badge ${risk.band}">${esc(CONTENT.office.bands[risk.band])} risk</span>
        </div>
        <p class="muted">${esc(r.ref)} · ${esc(r.rooms.join(", "))}${home.tenant ? ` · ${esc(home.tenant.name)}` : ""}</p>
        <p><strong>${esc(this.stageText(c, r))}</strong></p>
        ${deadline}
        ${this.lateBookingHtml(c, r)}
        <p><button type="button" class="button small" data-open="${esc(r.ref)}">${esc(r.status === "fixed" ? c.view : c.open)}<span class="visually-hidden"> ${esc(home.address)}</span></button></p>
      </li>`;
  },

  // Where the job is up to, in a few words.
  stageText(c, r) {
    const today = todayIso();
    if (r.status === "fixed") return r.repairNeeded === "no" ? c.stageClosedNoRepair.replace("{date}", shortDate(r.fixedDate || today)) : c.stageFixed.replace("{date}", shortDate(r.fixedDate || today));
    if (r.status === "repair") return c.stageRepair.replace("{date}", shortDate(r.repairStarted || r.visitDate || today));
    if (r.repairBooked) return c.stageBooked.replace("{date}", shortDate(r.repairBooked));
    if (r.findings) return c.stageInvestigated;
    if (r.visitDate > today) return c.stageVisitBooked.replace("{date}", shortDate(r.visitDate));
    return c.stageToRecord.replace("{date}", shortDate(r.visitDate));
  },

  // ---------- One assignment ----------

  assignmentHtml(c, r) {
    const home = App.home(r.homeId);
    const t = home.tenant;
    const hh = home.household;
    const p = CONTENT.properties;
    const yesNo = (v) => v === true ? p.yes : v === false ? p.no : p.notTold;
    const row = (label, value) => `<div><dt>${esc(label)}</dt><dd>${value}</dd></div>`;
    const sizes = { small: "A small patch", medium: "A few patches", large: "A lot" };
    const notes = (r.notes || []).slice().sort((a, b) => b.date.localeCompare(a.date));

    return `
      <p><button type="button" class="link-button" data-back>‹ ${esc(c.back)}</button></p>
      <h2 id="assignment-title" tabindex="-1">${esc(home.address)} <span class="muted">${esc(r.ref)}</span></h2>
      <p><strong>${esc(this.stageText(c, r))}</strong></p>
      ${this.lateBookingHtml(c, r)}

      <div class="record-grid">
        <section class="card" aria-labelledby="a-tenant-title">
          <h3 id="a-tenant-title">${esc(c.tenantTitle)}</h3>
          ${t ? `<dl class="facts">
            ${row(p.nameLabel, esc(t.name))}
            ${row(p.phoneLabel.replace(" (optional)", ""), t.phone ? esc(t.phone) : `<span class="muted">${esc(p.notRecorded)}</span>`)}
            ${row(p.agesShort, esc(agesText(home)))}
            ${row(p.breathingShort, esc(yesNo(hh.breathingCondition)))}
            ${row(p.sightShort, esc(yesNo(t.sightLoss)))}
          </dl>
          ${t.sightLoss ? `<p class="callout">${esc(p.sightTip)}</p>` : ""}` : `<p class="muted">${esc(p.noTenant)}</p>`}
        </section>

        <section class="card" aria-labelledby="a-report-title">
          <h3 id="a-report-title">${esc(c.reportTitle)}</h3>
          <dl class="facts">
            ${row(c.reported, esc(shortDate(r.date)))}
            ${row(c.rooms, esc(r.rooms.join(", ")))}
            ${row(c.howBad, esc(sizes[r.severity] || r.severity))}
            ${r.note ? row(c.tenantSaid, `“${esc(r.note)}”`) : ""}
          </dl>
          ${Office.answersHtml(r)}
        </section>

        <section class="card">
          ${Office.lawHtml(CONTENT.office, r)}
        </section>
      </div>

      ${r.status === "fixed" ? this.summaryHtml(c, r) : this.formHtml(c, r)}

      <section class="card" aria-labelledby="notes-title">
        <h3 id="notes-title">${esc(c.notesTitle)}</h3>
        <form id="note-form" novalidate>
          <div class="field ${this.noteError ? "has-error" : ""}">
            <label for="note-text">${esc(c.noteLabel)}</label>
            <p class="hint" id="note-hint">${esc(c.noteHint)}</p>
            ${this.noteError ? `<p class="error" id="note-error"><span class="visually-hidden">Error:</span> ${esc(this.noteError)}</p>` : ""}
            <textarea id="note-text" rows="3" aria-describedby="note-hint${this.noteError ? " note-error" : ""}" ${this.noteError ? 'aria-invalid="true"' : ""}></textarea>
          </div>
          <button type="submit" class="button secondary">${esc(c.addNote)}</button>
        </form>
        ${notes.length ? `<ol class="notes">${notes.map((n) => `
          <li><p class="event-meta"><time datetime="${esc(n.date)}">${esc(shortDate(n.date))}</time> · ${esc(n.by)}</p><p>${esc(n.text)}</p></li>`).join("")}</ol>`
          : `<p class="muted">${esc(c.noNotes)}</p>`}
      </section>`;
  },

  // Warn if the repair is booked later than Awaab's Law allows it to start.
  lateBookingHtml(c, r) {
    if (!r.repairBooked || r.status !== "visit" || !Deadlines.covered(r)) return "";
    const start = Deadlines.steps(r).find((s) => s.key === "startRepair");
    if (!start || r.repairBooked <= start.due) return "";
    return `<p class="warning">${esc(c.lateBooking.replace("{date}", formatDate(start.due)))}</p>`;
  },

  // A finished job: what was recorded, read-only.
  summaryHtml(c, r) {
    const f = r.findings;
    const row = (label, value) => value ? `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>` : "";
    return `
      <section class="card" aria-labelledby="a-found-title">
        <h3 id="a-found-title">${esc(c.foundTitle)}</h3>
        ${f ? `<dl class="facts">
          ${row(c.outcome, f.outcome)}
          ${row(c.summaryLabel, f.summary)}
          ${row(c.checkedLabel, f.checked)}
          ${row(c.causeLabel, f.cause)}
          ${row(c.readingLabel, f.reading)}
          ${row(c.mouldLabel, f.mould)}
          ${row(c.workLabel, (f.plan || []).join(". "))}
        </dl>` : `<p class="muted">${esc(c.nothingRecorded)}</p>`}
      </section>`;
  },

  values(r) {
    if (this.draft) return this.draft;
    const f = r.findings || {};
    const today = todayIso();
    return {
      visited: r.visitedOn || (r.visitDate && r.visitDate <= today ? r.visitDate : ""),
      checked: f.checked || r.rooms.join(", "),
      cause: f.cause || "",
      reading: f.reading || "",
      mould: f.mould || "",
      summary: f.summary || "",
      needed: r.repairNeeded || "",
      work: (r.repairNeeded === "yes" && f.plan ? f.plan : []).join("\n"),
      state: r.repairState || "notBooked",
      repairDate: r.repairState === "booked" ? r.repairBooked || "" : r.repairState === "started" ? r.repairStarted || "" : r.repairState === "done" ? r.fixedDate || "" : "",
      summarySent: Boolean(r.summarySent)
    };
  },

  formHtml(c, r) {
    const v = this.values(r);
    const err = this.errors;
    const errorList = Object.entries(err);
    const fieldError = (key) => err[key] ? `<p class="error" id="of-${key}-error"><span class="visually-hidden">Error:</span> ${esc(err[key])}</p>` : "";
    const invalid = (key) => err[key] ? `aria-invalid="true"` : "";
    const describedBy = (key, hint) => `aria-describedby="${[hint, err[key] && `of-${key}-error`].filter(Boolean).join(" ")}"`;
    const radios = (name, options, current) => options.map((o, i) => `
      <label class="choice"><input type="radio" name="${name}" ${i === 0 ? `id="of-${name}"` : ""} value="${o.value}" ${o.value === current ? "checked" : ""}> ${esc(o.label)}</label>`).join("");

    return `
      <section class="card" aria-labelledby="update-title">
        <h3 id="update-title">${esc(c.updateTitle)}</h3>
        ${errorList.length ? `
          <div class="error-summary" role="alert" tabindex="-1" id="officer-errors">
            <h3>${esc(CONTENT.properties.errorSummary)}</h3>
            <ul>${errorList.map(([key, text]) => `<li><a href="#of-${key}">${esc(text)}</a></li>`).join("")}</ul>
          </div>` : ""}
        <form id="officer-form" novalidate>
          <fieldset class="form-section">
            <legend>${esc(c.investigationTitle)}</legend>
            <div class="form-columns">
              <div class="field ${err.visited ? "has-error" : ""}">
                <label for="of-visited">${esc(c.visitedLabel)}</label>
                ${fieldError("visited")}
                <input type="date" id="of-visited" value="${esc(v.visited)}" max="${todayIso()}" ${describedBy("visited")} ${invalid("visited")}>
              </div>
              <div class="field">
                <label for="of-checked">${esc(c.checkedLabel)}</label>
                <input type="text" id="of-checked" value="${esc(v.checked)}">
              </div>
            </div>
            <div class="field">
              <label for="of-cause">${esc(c.causeLabel)}</label>
              <select id="of-cause">
                <option value="">${esc(c.choose)}</option>
                ${c.causes.map((cause) => `<option ${cause === v.cause ? "selected" : ""}>${esc(cause)}</option>`).join("")}
              </select>
            </div>
            <div class="form-columns">
              <div class="field">
                <label for="of-reading">${esc(c.readingLabel)}</label>
                <p class="hint" id="of-reading-hint">${esc(c.readingHint)}</p>
                <input type="text" id="of-reading" value="${esc(v.reading)}" aria-describedby="of-reading-hint">
              </div>
              <div class="field">
                <label for="of-mould">${esc(c.mouldLabel)}</label>
                <p class="hint" id="of-mould-hint">${esc(c.mouldHint)}</p>
                <input type="text" id="of-mould" value="${esc(v.mould)}" aria-describedby="of-mould-hint">
              </div>
            </div>
            <div class="field ${err.summary ? "has-error" : ""}">
              <label for="of-summary">${esc(c.summaryLabel)}</label>
              <p class="hint" id="of-summary-hint">${esc(c.summaryHint)}</p>
              ${fieldError("summary")}
              <textarea id="of-summary" rows="3" ${describedBy("summary", "of-summary-hint")} ${invalid("summary")}>${esc(v.summary)}</textarea>
            </div>
          </fieldset>

          <fieldset class="form-section ${err.needed ? "has-error" : ""}" ${err.needed ? `aria-describedby="of-needed-error"` : ""}>
            <legend>${esc(c.neededLabel)}</legend>
            ${fieldError("needed")}
            ${radios("needed", c.neededOptions, v.needed)}

            <div class="conditional" id="repair-details" ${v.needed === "yes" ? "" : "hidden"}>
              <div class="field ${err.work ? "has-error" : ""}">
                <label for="of-work">${esc(c.workLabel)}</label>
                <p class="hint" id="of-work-hint">${esc(c.workHint)}</p>
                ${fieldError("work")}
                <textarea id="of-work" rows="3" ${describedBy("work", "of-work-hint")} ${invalid("work")}>${esc(v.work)}</textarea>
              </div>
              <fieldset class="field">
                <legend>${esc(c.stateLabel)}</legend>
                ${radios("state", c.stateOptions, v.state)}
              </fieldset>
              <div class="field ${err.repairDate ? "has-error" : ""}" id="repair-date-field" ${v.state === "notBooked" ? "hidden" : ""}>
                <label for="of-repairDate">${esc(c.repairDateLabel)}</label>
                <p class="hint" id="of-repairDate-hint">${esc(c.repairDateHint)}</p>
                ${fieldError("repairDate")}
                <input type="date" id="of-repairDate" value="${esc(v.repairDate)}" ${describedBy("repairDate", "of-repairDate-hint")} ${invalid("repairDate")}>
              </div>
            </div>
            <p class="hint conditional" id="no-repair-note" ${v.needed === "no" ? "" : "hidden"}>${esc(c.noRepairNote)}</p>
          </fieldset>

          <fieldset class="form-section">
            <legend>${esc(c.writtenTitle)}</legend>
            <p class="hint">${esc(c.writtenHint)}</p>
            ${r.summarySent
              ? `<p>${esc(c.writtenSent.replace("{date}", formatDate(r.summarySent)))}</p>`
              : `<label class="choice"><input type="checkbox" id="of-summarySent" ${v.summarySent ? "checked" : ""}> ${esc(c.writtenLabel)}</label>`}
          </fieldset>

          <button type="submit" class="button">${esc(c.save)}</button>
        </form>
      </section>`;
  },

  readForm() {
    const val = (id) => (document.getElementById(id) || { value: "" }).value.trim();
    const radio = (name) => (document.querySelector(`#officer-form input[name="${name}"]:checked`) || {}).value || "";
    const sent = document.getElementById("of-summarySent");
    return {
      visited: val("of-visited"), checked: val("of-checked"), cause: val("of-cause"), reading: val("of-reading"),
      mould: val("of-mould"), summary: val("of-summary"), needed: radio("needed"), work: val("of-work"),
      state: radio("state") || "notBooked", repairDate: val("of-repairDate"), summarySent: sent ? sent.checked : false
    };
  },

  validate(v) {
    const c = CONTENT.officer;
    const today = todayIso();
    const errors = {};
    if (!v.visited) errors.visited = c.errorVisited;
    else if (v.visited > today) errors.visited = c.errorVisitedFuture;
    if (v.needed && !v.summary) errors.summary = c.errorSummary;
    if (!v.needed) errors.needed = c.errorNeeded;
    if (v.needed === "yes" && !v.work) errors.work = c.errorWork;
    if (v.needed === "yes" && v.state !== "notBooked") {
      if (!v.repairDate) errors.repairDate = c.errorRepairDate;
      else if (v.state !== "booked" && v.repairDate > today) errors.repairDate = c.errorRepairFuture;
    }
    return errors;
  },

  save(r, v) {
    const c = CONTENT.officer;
    const today = todayIso();
    r.visitedOn = v.visited;
    r.visitDate = v.visited; // the visit happened: this is what the investigation deadline checks
    r.repairNeeded = v.needed;
    r.repairState = v.needed === "yes" ? v.state : null;
    r.findings = {
      outcome: c.outcomes[v.needed],
      summary: v.summary,
      checked: v.checked || c.notRecorded,
      cause: v.cause || c.notSure,
      reading: v.reading || c.notRecorded,
      mould: v.mould || c.notRecorded,
      plan: v.needed === "yes" ? v.work.split("\n").map((s) => s.trim()).filter(Boolean) : [c.outcomes[v.needed]]
    };
    delete r.repairBooked;
    if (v.needed === "yes" && v.state === "booked") {
      r.repairBooked = v.repairDate;
      r.status = "visit";
    } else if (v.needed === "yes" && v.state === "started") {
      r.repairStarted = v.repairDate;
      r.status = "repair";
    } else if (v.needed === "yes" && v.state === "done") {
      r.repairStarted = r.repairStarted && r.repairStarted <= v.repairDate ? r.repairStarted : v.repairDate;
      r.fixedDate = v.repairDate;
      r.status = "fixed";
    } else if (v.needed === "no") {
      r.fixedDate = today;
      r.status = "fixed";
    } else {
      r.status = "visit";
    }
    if (v.summarySent && !r.summarySent) r.summarySent = today;
    this.message = r.status === "fixed" ? c.savedClosed : c.saved;
    this.draft = null;
    this.errors = {};
    App.save();
    document.getElementById("officer-message").focus();
  },

  go(ref) {
    this.openRef = ref;
    this.draft = null;
    this.errors = {};
    this.noteError = null;
    this.message = "";
    this.render();
    const target = document.getElementById(ref ? "assignment-title" : "assignments-title");
    if (target) target.focus();
    window.scrollTo(0, document.getElementById("officer-view").offsetTop);
  },

  bind(el, r) {
    const c = CONTENT.officer;
    const me = el.querySelector("#officer-me");
    if (me) me.addEventListener("change", () => {
      App.state.officerMe = me.value;
      this.message = "";
      App.save();
      document.getElementById("officer-me").focus();
    });
    el.querySelectorAll("[data-open]").forEach((btn) => btn.addEventListener("click", () => this.go(btn.dataset.open)));
    el.querySelectorAll("[data-back]").forEach((btn) => btn.addEventListener("click", () => {
      const ref = this.openRef;
      this.go(null);
      const back = document.querySelector(`#officer-screen [data-open="${ref}"]`);
      if (back) back.focus();
    }));

    // Show the repair questions only when they apply.
    const form = el.querySelector("#officer-form");
    if (form) {
      const sync = () => {
        const needed = (form.querySelector('input[name="needed"]:checked') || {}).value;
        const state = (form.querySelector('input[name="state"]:checked') || {}).value;
        form.querySelector("#repair-details").hidden = needed !== "yes";
        form.querySelector("#no-repair-note").hidden = needed !== "no";
        form.querySelector("#repair-date-field").hidden = !state || state === "notBooked";
      };
      form.addEventListener("change", sync);
      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const v = this.readForm();
        this.errors = this.validate(v);
        if (Object.keys(this.errors).length) {
          this.draft = v;
          this.message = "";
          this.render();
          document.getElementById("officer-errors").focus();
          return;
        }
        this.save(r, v);
      });
    }

    const noteForm = el.querySelector("#note-form");
    if (noteForm) noteForm.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const text = document.getElementById("note-text").value.trim();
      if (!text) {
        this.noteError = c.errorNote;
        this.render();
        document.getElementById("note-text").focus();
        return;
      }
      this.noteError = null;
      r.notes = r.notes || [];
      r.notes.push({ date: todayIso(), by: this.me(), text });
      this.message = c.noteAdded;
      App.save();
      document.getElementById("officer-message").focus();
    });
  }
};

App.views.officer = Officer;
