(() => {
  const storageKey = "campus-stores.shift.v4";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  // Desk clock on one scale so slips can be compared with "now".
  // Phase 0 = Fri 3:45 pm, phase 1 = Fri 7:30 pm, phase 2 = Sat 9:00 am.
  const dueTimes = ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"];
  const dueRank = { "Fri 8 pm": 2, "Sat 9 am": 3, "Sat 10 am": 4, "Sat noon": 5 };
  const phaseRank = [0, 1, 3];
  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  // Clock hours on one axis: Fri 3:45 pm = 15.75, Sat 9 am = 24 + 9.
  const phaseHour = [15.75, 19.5, 33];
  const dueHour = { "Fri 8 pm": 20, "Sat 9 am": 33, "Sat 10 am": 34, "Sat noon": 36 };
  const original = () => ({
    version: 4,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        holder: "Tara Shah",
        expect: "Sat 10 am",
        auth: "",
        back: false,
        log: [{ at: "Friday · 3:30 pm", text: "Issued to Tara Shah (request owner)" }],
        trail: [{ h: 15.5, who: "Tara Shah" }],
      },
    ],
    notes: [],
    editing: false,
    undo: 0,
    tl: 0,
    staff: "Priya Nair",
    handoverFrom: "",
    repairs: [],
    holding: 0,
    kit: "",
    adding: false,
    added: [],
    lookup: "",
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  // Seed units plus any received at the desk during this shift.
  const allAssets = () => assets.concat(s.added);
  // In repair: seeded workshop units plus anything checked in damaged this shift.
  const inRepair = (a) => a.repair || s.repairs.some((x) => x.id === a.id);
  const getAsset = (id) => allAssets().find((x) => x.id === id);
  const prefix = {
    "HDMI projector": "PR",
    "Portable speaker": "SP",
    "USB-C → HDMI adapter": "AD",
    "Wireless microphone": "MI",
    "Digital camera": "CA",
  };
  const nextId = (type) => {
    const p = prefix[type];
    const n = Math.max(
      0,
      ...allAssets()
        .filter((a) => a.id.startsWith(p + "-"))
        .map((a) => Number(a.id.slice(p.length + 1))),
    );
    return p + "-" + String(n + 1).padStart(2, "0");
  };
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const typeIcon = {
    "HDMI projector": "projector",
    "Portable speaker": "speaker",
    "USB-C → HDMI adapter": "cable",
    "Wireless microphone": "mic",
    "Digital camera": "camera",
  };
  // Staff recognise a unit by its shape before they read its tag.
  const thumb = (type, big = false) =>
    '<span class="thumb' +
    (big ? " big" : "") +
    '" title="' +
    esc(type) +
    '"><svg aria-hidden="true"><use href="#ill-' +
    typeIcon[type] +
    '"></use></svg></span>';
  const row = (label, sub, right, extra = "", type = "") =>
    '<div class="row' +
    (type ? " has-thumb" : "") +
    '">' +
    (type ? thumb(type) : "") +
    "<div><strong>" +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small>" +
    extra +
    "</div><div>" +
    right +
    "</div></div>";
  // Every slip keeps its own chain of custody: issued, moved, returned.
  // Desk staff: every entry is signed by whoever is on shift.
  const staff = ["Priya Nair", "Rahul Iyer", "Meera Pillai"];
  const shiftStaff = ["Priya Nair", "Priya Nair", "Rahul Iyer"];
  const logTo = (l, text) =>
    l.log.push({ at: shifts[s.phase].time, text: text + " · desk: " + s.staff });
  const history = (l, open = false) =>
    '<details class="history"' +
    (open ? " open" : "") +
    "><summary>Custody history (" +
    l.log.length +
    ")</summary><ol>" +
    l.log
      .map((e) => "<li><small>" + esc(e.at) + "</small> " + esc(e.text) + "</li>")
      .join("") +
    "</ol></details>";
  const reqLoans = (id) => s.loans.filter((l) => l.req === id);
  const reqStatus = (r) => {
    const all = reqLoans(r.id),
      open = all.filter((l) => !l.back);
    if (!all.length) return badge("Not issued");
    if (!open.length) return badge("All returned", true);
    if (open.length === all.length)
      return badge(all.length === 1 ? "On loan" : "All " + all.length + " out");
    return badge(open.length + " of " + all.length + " still out", false, true);
  };
  const badge = (t, good = false, warn = false) =>
    '<span class="tag' +
    (good ? " good" : "") +
    (warn ? " warn" : "") +
    '">' +
    esc(t) +
    "</span>";
  const unitName = (l) => l.asset + " · " + getAsset(l.asset).type;
  // Where the unit is and when it is due, in one line a new shift can trust.
  const custody = (l) => {
    const r = getReq(l.req);
    let t = r.club + " · " + l.req + " · Collected by " + l.who;
    if (l.auth) t += " for " + r.owner;
    if (l.holder !== l.who) t += " · Now with " + l.holder;
    if (l.expect !== l.due)
      t += " · Expected " + l.expect + " (slip due " + l.due + ")";
    else t += " · Due " + l.due;
    return t;
  };
  // Who has the unit right now, shown wherever the unit appears.
  const loanee = (l) => {
    const r = getReq(l.req);
    return (
      '<p class="loanee">With <b>' +
      esc(l.holder) +
      "</b>" +
      (l.holder !== l.who ? " (collected by " + esc(l.who) + ")" : "") +
      " · " +
      esc(r.club) +
      " · L-" +
      l.num +
      " · " +
      (l.expect !== l.due ? "Expected " : "Due ") +
      esc(l.expect) +
      "</p>"
    );
  };
  const timing = (l) => {
    const now = phaseRank[s.phase],
      at = dueRank[l.expect];
    if (at < now) return badge("Overdue", false, true);
    if (at === now) return badge("Expected now", true);
    return badge("On loan");
  };
  const select = (label, key, options, value = "") =>
    "<label><span>" +
    label +
    '</span><select name="' +
    key +
    '" required><option value="">Select…</option>' +
    options
      .map(
        ([v, t]) =>
          '<option value="' +
          esc(v) +
          '"' +
          (v === value ? " selected" : "") +
          ">" +
          esc(t) +
          "</option>",
      )
      .join("") +
    "</select></label>";
  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      html +=
        btn("Back to list", "close") +
        '<div class="record"><small>' +
        esc(r.id) +
        " · Approved</small><h3>" +
        esc(r.event) +
        "</h3><p>" +
        esc(r.club) +
        " · Filed by " +
        esc(r.owner) +
        "</p><p><b>Return by</b> " +
        esc(r.due) +
        "</p><p><b>Approved equipment</b></p><ul>" +
        r.items
          .map((x) => {
            const l = reqLoans(r.id).find((l) => getAsset(l.asset).type === x);
            const where = !l
              ? ""
              : l.back
                ? '<small>' + l.asset + " · returned by " + esc(l.backBy || l.holder) + "</small>"
                : '<small>' + l.asset + " · with " + esc(l.holder) + " · L-" + l.num + "</small>";
            return '<li class="withthumb">' + thumb(x) + "<span>" + esc(x) + where + "</span></li>";
          })
          .join("") +
        "</ul><p>" +
        esc(r.note) +
        '</p><div class="buttons">' +
        reqStatus(r) +
        (reqLoans(r.id).length
          ? btn("Open its slips", "tab", "Loan register")
          : s.kit === r.id
            ? ""
            : btn("Issue this kit", "kit", r.id, "primary")) +
        "</div></div>";
      if (s.kit === r.id && !reqLoans(r.id).length) html += kitForm(r);
    } else
      html += requests
        .map((r) =>
          row(
            r.event,
            r.id + " · " + r.club + " · Return by " + r.due,
            '<div class="buttons tight">' +
              reqStatus(r) +
              btn("View form", "request", r.id) +
              "</div>",
          ),
        )
        .join("");
    return html;
  }
  // Pickup: one form for the whole approved kit, due time taken from the form.
  function kitForm(r) {
    let html =
      '<form data-kit class="record"><small>' +
      r.id +
      " · Issue kit</small><h3>One slip per unit, issued together</h3>" +
      '<p class="kitnote"><b>From the request:</b> ' +
      esc(r.note) +
      "</p>" +
      '<div class="form">';
    const short = r.items.filter(
      (type) => !allAssets().some((a) => a.type === type && !inRepair(a) && !out(a.id)),
    );
    if (short.length)
      html +=
        '<p class="kitnote"><b>Not on the shelf:</b> ' +
        esc(short.join(", ")) +
        ". Check Inventory or the Loan register before the club leaves without it.</p>";
    r.items.forEach((type, i) => {
      const units = allAssets().filter((a) => a.type === type && !inRepair(a) && !out(a.id));
      html += select(
        type,
        "unit" + i,
        units.map((a) => [a.id, a.id + " · " + a.model + " · bin " + a.bin]),
        units[0] ? units[0].id : "",
      );
    });
    html +=
      select("Collected by", "who", people.map((p) => [p, p]), r.owner) +
      select("Return by", "due", dueTimes.map((d) => [d, d]), r.due) +
      '<label class="full"><span>If not ' +
      esc(r.owner) +
      ", how did they authorise the collector?</span>" +
      '<select name="auth"><option value="">Owner is collecting</option>' +
      opts(
        ["Message in desk book", "In person", "Phone call"].map((x) => [x, x]),
      ) +
      "</select></label></div>" +
      '<div class="buttons"><button type="submit" class="primary"' +
      (short.length ? " disabled" : "") +
      ">Issue " +
      r.items.length +
      " slips</button>" +
      btn("Cancel", "unkit") +
      "</div></form>";
    return html;
  }
  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
      s.adding ? btn("Cancel", "unadd") : btn("Add unit", "add", "", "primary"),
    );
    if (s.adding) html += addForm();
    // Stock at a glance: what can leave the desk right now, per type.
    html +=
      '<div class="stock">' +
      Object.keys(prefix)
        .map((type) => {
          const units = allAssets().filter((a) => a.type === type);
          const loaned = units.filter((a) => !inRepair(a) && out(a.id)).length;
          const repair = units.filter(inRepair).length;
          const shelf = units.length - loaned - repair;
          return (
            '<div class="stocktile">' +
            thumb(type) +
            "<div><strong>" +
            shelf +
            " of " +
            units.length +
            "</strong><small>" +
            esc(type) +
            "s free</small><small>" +
            loaned +
            " on loan" +
            (repair ? " · " + repair + " in repair" : "") +
            "</small></div></div>"
          );
        })
        .join("") +
      "</div>";
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        ["All items", "On shelf", "On loan", "In repair"].map((f) => [f, f]),
      ) +
      "</select></label></div>";
    for (const a of allAssets()) {
      const status = inRepair(a)
        ? "In repair"
        : out(a.id)
          ? "On loan"
          : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      const l = out(a.id);
      html += row(
        a.id + " · " + a.type,
        a.model +
          " · " +
          a.bin +
          (a.at ? " · Received " + a.at : "") +
          (s.repairs.find((x) => x.id === a.id)
            ? " · Returned " + s.repairs.find((x) => x.id === a.id).why.toLowerCase()
            : ""),
        l ? '<div class="buttons tight">' + timing(l) + "</div>" : badge(status, status === "On shelf"),
        l ? loanee(l) : "",
        a.type,
      );
    }
    return html;
  }
  // Receiving: a new unit gets its tag ID here and starts on its home shelf.
  function addForm() {
    const type = s.addType || "HDMI projector";
    return (
      '<form data-add class="record"><small>Receive new stock</small><h3 class="withthumb">' +
      thumb(type) +
      "Will be tagged " +
      nextId(type) +
      '</h3><div class="form">' +
      select(
        "Equipment type",
        "type",
        Object.keys(prefix).map((t) => [t, t]),
        type,
      ) +
      '<label><span>Make and model</span><input name="model" required maxlength="40" placeholder="e.g. BenQ MH560" /></label>' +
      '<label><span>Home shelf</span><input name="bin" required maxlength="12" placeholder="e.g. A3" /></label>' +
      '</div><div class="buttons"><button type="submit" class="primary">Add to stock</button>' +
      btn("Cancel", "unadd") +
      "</div></form>"
    );
  }
  function register() {
    if (s.tl) return timeline();
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : '<div class="buttons tight">' +
            btn("Custody timeline", "tl", "-1") +
            btn("New issue slip", "new", "", "primary") +
            "</div>",
    );
    if (s.editing) {
      const available = allAssets().filter((a) => !inRepair(a) && !out(a.id));
      return (
        html +
        '<form data-issue><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.map((r) => [r.id, r.id + " · " + r.club]),
        ) +
        select(
          "Unit leaving the desk",
          "asset",
          available.map((a) => [a.id, a.id + " · " + a.type]),
        ) +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          dueTimes.map((d) => [d, d]),
        ) +
        '</div><button type="submit" class="primary">Save issue slip</button></form>'
      );
    }
    html += checkIn();
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += "<p>No outstanding slips.</p>";
    for (const l of shown) {
      html += row(
        "L-" + l.num + " · " + unitName(l),
        custody(l),
        l.back
          ? badge("Returned")
          : '<div class="buttons tight">' +
              timing(l) +
              btn("Still out…", "hold", String(l.num)) +
              btn("Record return", "return", String(l.num)) +
              "</div>",
        history(l) + btn("Timeline", "tl", String(l.num), "linkbtn"),
        getAsset(l.asset).type,
      );
      if (s.holding === l.num && !l.back) html += holdForm(l);
    }
    return html;
  }
  // Partial return: record who has the unit now and when it is coming back.
  function holdForm(l) {
    const r = getReq(l.req);
    return (
      '<form data-hold class="record"><small>Still out · L-' +
      l.num +
      "</small><h3>" +
      esc(unitName(l)) +
      "</h3><p>" +
      esc(r.club + " · " + r.event) +
      '</p><div class="form">' +
      select(
        "Who has it now",
        "holder",
        people.map((p) => [p, p]),
        l.holder,
      ) +
      select(
        "Expected back",
        "expect",
        dueTimes.map((d) => [d, d]),
        l.expect,
      ) +
      '</div><div class="buttons">' +
      '<button type="submit" class="primary">Save on slip</button>' +
      btn("Cancel", "unhold") +
      "</div></form>"
    );
  }
  // Morning check-in: start from the ID printed on the item in hand.
  // Counter lookup: start from the tag on the item, or the person at the desk.
  const slipCard = (l) =>
    '<div class="record lookup"><small>Open slip L-' +
    l.num +
    '</small><h3 class="withthumb">' +
    thumb(getAsset(l.asset).type, true) +
    esc(unitName(l)) +
    "</h3><p>" +
    esc(custody(l)) +
    '</p><div class="buttons">' +
    timing(l) +
    btn("Close slip L-" + l.num, "return", String(l.num), "primary") +
    btn("Clear", "clear") +
    "</div>" +
    history(l, true) +
    "</div>";
  function checkIn() {
    let html =
      '<form data-checkin class="checkin"><label><span>At the counter</span>' +
      '<input name="unit" placeholder="Tag on the item (AD-12) or a name (Leela)" autocomplete="off" value="' +
      esc(s.lookup) +
      '" /></label><button type="submit">Find slip</button></form>';
    if (!s.lookup) return html;
    const unit = getAsset(s.lookup.toUpperCase());
    if (unit) {
      const l = out(unit.id);
      return (
        html +
        (l
          ? slipCard(l)
          : '<p class="lookup">' +
            esc(unit.id + " · " + unit.type) +
            " is not on loan" +
            (inRepair(unit) ? " (it is in repair)" : " (home shelf " + unit.bin + ")") +
            ". Nothing to close.</p>")
      );
    }
    const term = s.lookup.toLowerCase();
    const hits = s.loans.filter(
      (l) =>
        !l.back &&
        [l.holder, l.who, getReq(l.req).owner].some((n) =>
          n.toLowerCase().includes(term),
        ),
    );
    if (!hits.length)
      return (
        html +
        '<p class="lookup">No tag or person matches “' +
        esc(s.lookup) +
        "”. Check the tag on the item.</p>"
      );
    return (
      html +
      '<p class="lookup">' +
      hits.length +
      " open slip" +
      (hits.length === 1 ? "" : "s") +
      " linked to “" +
      esc(s.lookup) +
      "”. Match the tag on the item before closing.</p>" +
      hits.map(slipCard).join("")
    );
  }
  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([
        shifts[n.phase].time,
        "Counter handover" + (n.by ? " · " + n.by : ""),
        n.text,
      ]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }
  // Custody timeline: every slip as a lane, coloured by who held the unit.
  function timeline() {
    const lo = 15.5,
      hi = 36,
      now = phaseHour[s.phase];
    const x = (h) => (((Math.min(Math.max(h, lo), hi) - lo) / (hi - lo)) * 100).toFixed(2) + "%";
    const fmt = (h) => {
      const day = h < 24 ? "Fri" : "Sat",
        t = h % 24,
        hr = Math.floor(t),
        m = Math.round((t - hr) * 60);
      const h12 = hr % 12 || 12;
      return day + " " + h12 + (m ? ":" + String(m).padStart(2, "0") : "") + (hr < 12 ? " am" : " pm");
    };
    const tone = (who) => "p" + (people.indexOf(who) % 5);
    const one = s.tl > 0 ? s.loans.find((l) => l.num === s.tl) : null;
    let html = head(
      one ? "Custody timeline · L-" + one.num : "Custody timeline",
      (one ? esc(unitName(one)) + " · " : "Who held each unit, from issue to return · ") +
        "desk time " +
        fmt(now),
      btn("Back to register", "tl", "0"),
    );
    const ticks = [
      [15.75, "Fri 3:45 pm"],
      [19.5, "7:30 pm"],
      [24, "Midnight"],
      [33, "Sat 9 am"],
      [36, "Noon"],
    ];
    html +=
      '<div class="tl"><div class="tlaxis"><span></span><div class="tltrack">' +
      ticks
        .map(([h, t]) => '<small style="left:' + x(h) + '">' + t + "</small>")
        .join("") +
      "</div></div>";
    const lanes = s.loans.filter((l) => l.trail && l.trail.length && (!one || l === one));
    for (const l of lanes) {
      const end = l.back ? l.endH : now;
      let segs = "";
      l.trail.forEach((t, i) => {
        const to = i + 1 < l.trail.length ? l.trail[i + 1].h : end;
        const w = Math.max(((to - t.h) / (hi - lo)) * 100, 1.4);
        segs +=
          '<i class="seg ' +
          tone(t.who) +
          '" style="left:' +
          x(t.h) +
          ";width:" +
          w.toFixed(2) +
          '%" title="' +
          esc(t.who + " · " + fmt(t.h) + " → " + (to === now && !l.back ? "now" : fmt(to))) +
          '">' +
          (w > 7 ? esc(t.who.split(" ")[0]) : "") +
          "</i>";
      });
      const exp = dueHour[l.expect];
      if (!l.back && exp < now)
        segs +=
          '<i class="late" style="left:' +
          x(exp) +
          ";width:" +
          (((now - exp) / (hi - lo)) * 100).toFixed(2) +
          '%" title="Overdue since ' +
          esc(fmt(exp)) +
          '"></i>';
      segs += '<b class="due" style="left:' + x(exp) + '" title="' + esc((l.expect !== l.due ? "Expected " : "Due ") + l.expect) + '"></b>';
      if (l.expect !== l.due)
        segs += '<b class="due was" style="left:' + x(dueHour[l.due]) + '" title="' + esc("Slip due " + l.due) + '"></b>';
      html +=
        '<div class="tlrow"><span class="withthumb">' +
        thumb(getAsset(l.asset).type) +
        "<span><b>L-" +
        l.num +
        " · " +
        esc(l.asset) +
        "</b><small>" +
        esc(getReq(l.req).club) +
        (l.back ? " · returned" : "") +
        '</small></span></span><div class="tltrack">' +
        segs +
        '<b class="now" style="left:' +
        x(now) +
        '"></b></div></div>';
    }
    if (!lanes.length) html += "<p>No slips yet.</p>";
    const seen = [...new Set(lanes.flatMap((l) => l.trail.map((t) => t.who)))];
    html +=
      '</div><div class="tllegend">' +
      seen.map((w) => '<span><i class="seg ' + tone(w) + '"></i>' + esc(w) + "</span>").join("") +
      '<span><b class="due"></b>Due / expected</span><span><i class="late"></i>Overdue</span><span><b class="now"></b>Desk time</span></div>' +
      '<p class="tlnote">Hover a bar to see who held the unit and when. A colour change mid-lane is a hand-off, like Kabir → Leela on the adapter.</p>';
    return html;
  }
  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  // Start of a new shift: what is still out and what needs a follow-up.
  function shiftSummary() {
    if (s.phase === 0) return "";
    const open = s.loans.filter((l) => !l.back);
    const moved = open.filter((l) => l.holder !== l.who || l.expect !== l.due);
    const late = open.filter((l) => dueRank[l.expect] < phaseRank[s.phase]);
    if (!moved.length && !late.length) return "";
    const items = open
      .filter((l) => moved.includes(l) || late.includes(l))
      .map((l) => {
        const r = getReq(l.req);
        return (
          '<li class="withthumb">' +
          thumb(getAsset(l.asset).type) +
          "<span><b>" +
          esc(unitName(l)) +
          "</b><small>" +
          (l.holder !== l.who
            ? "Changed hands: " + esc(l.who) + " → " + esc(l.holder)
            : "With " + esc(l.holder)) +
          " · " +
          (l.expect !== l.due ? "expected " : "due ") +
          esc(l.expect) +
          "</small></span>" +
          '<span class="buttons tight">' +
          timing(l) +
          btn("Find slip", "find", l.asset, "primary") +
          "</span></li>"
        );
      })
      .join("");
    return (
      '<section class="summary" aria-label="Since last shift"><h3>Since last shift' +
      (s.handoverFrom ? " (" + esc(s.handoverFrom) + " → " + esc(s.staff) + ")" : "") +
      " · " +
      open.length +
      " unit" +
      (open.length === 1 ? "" : "s") +
      " still out · " +
      (items.match(/<li/g) || []).length +
      " to check</h3><ul>" +
      items +
      "</ul>" +
      btn("Copy handover", "copy") +
      "</section>"
    );
  }
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-staff]").innerHTML = staff
      .map(
        (n) =>
          '<option value="' + esc(n) + '"' + (n === s.staff ? " selected" : "") + ">" + esc(n) + "</option>",
      )
      .join("");
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");
    const undoL = s.undo && s.loans.find((x) => x.num === s.undo);
    q("[data-page]").innerHTML =
      (undoL
        ? '<div class="undo">Closed slip L-' +
          undoL.num +
          " · " +
          esc(unitName(undoL)) +
          " · checked in as complete. " +
          btn("Damaged", "cond", undoL.num + "|Damaged") +
          btn("Missing parts", "cond", undoL.num + "|Missing parts") +
          btn("Wrong item? Undo", "undo") +
          "</div>"
        : "") +
      shiftSummary() +
      screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    if (s.focus && q("[data-checkin] input")) q("[data-checkin] input").focus();
    s.focus = false;
    q("[data-status]").textContent = s.notice;
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    if (b.dataset.action !== "return" && b.dataset.action !== "undo") s.undo = 0;
    switch (b.dataset.action) {
      case "cond": {
        const [num, kind] = v.split("|");
        const l = s.loans.find((x) => x.num === Number(num));
        if (!l || !l.back || out(l.asset)) return;
        s.repairs.push({ id: l.asset, why: kind });
        logTo(l, "Checked in: " + kind.toLowerCase() + " · sent to the workshop");
        s.notes.push({
          phase: s.phase,
          by: s.staff,
          text:
            unitName(l) +
            " came back " +
            kind.toLowerCase() +
            " from " +
            l.holder +
            " (" +
            getReq(l.req).club +
            ", slip L-" +
            l.num +
            "). Held in the workshop; follow up with " +
            getReq(l.req).owner +
            ".",
        });
        s.notice = unitName(l) + " marked " + kind.toLowerCase() + " and moved to repair. It can't be issued until fixed.";
        break;
      }
      case "copy": {
        const open = s.loans.filter((l) => !l.back);
        const text =
          "Campus Stores handover · " +
          shifts[s.phase].time +
          " · from " +
          s.staff +
          "\n" +
          open
            .map((l) => "- " + unitName(l) + ": " + custody(l) + " [" + (dueRank[l.expect] < phaseRank[s.phase] ? "OVERDUE" : "slip L-" + l.num) + "]")
            .join("\n") +
          (s.repairs.length
            ? "\nIn repair: " + s.repairs.map((x) => x.id + " (" + x.why.toLowerCase() + ")").join(", ")
            : "");
        try {
          navigator.clipboard.writeText(text).then(
            () => commit("Handover copied. Paste it into the desk group."),
            () => commit("Copy was blocked by the browser."),
          );
        } catch {
          s.notice = "Copy was blocked by the browser.";
        }
        break;
      }
      case "undo": {
        const l = s.loans.find((x) => x.num === s.undo);
        s.undo = 0;
        if (!l || !l.back || out(l.asset)) return;
        l.back = false;
        delete l.endH;
        logTo(l, "Return undone · slip reopened with " + l.holder);
        s.notice = "Slip L-" + l.num + " reopened. " + unitName(l) + " is back on loan.";
        break;
      }
      case "restart":
        s = original();
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        if (shiftStaff[s.phase] !== s.staff) {
          s.handoverFrom = s.staff;
          s.staff = shiftStaff[s.phase];
        }
        s.notice =
          "Shift time updated." +
          (s.handoverFrom && s.phase === 2
            ? " " + s.staff + " takes over the desk from " + s.handoverFrom + "."
            : "");
        break;
      case "tab":
        s.tl = 0;
        s.focus = v === "Loan register";
        s.tab = v;
        s.editing = false;
        s.holding = 0;
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        s.kit = "";
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "hold":
        s.holding = Number(v);
        break;
      case "find":
        s.tab = "Loan register";
        s.lookup = v;
        s.editing = false;
        s.holding = 0;
        break;
      case "tl":
        s.tl = Number(v);
        break;
      case "add":
        s.adding = true;
        break;
      case "unadd":
        s.adding = false;
        break;
      case "kit":
        s.kit = v;
        break;
      case "unkit":
        s.kit = "";
        break;
      case "unhold":
        s.holding = 0;
        break;
      case "clear":
        s.focus = true;
        s.lookup = "";
        break;
      case "return": {
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;
        l.back = true;
        l.backBy = l.holder;
        l.endH = phaseHour[s.phase];
        s.undo = l.num;
        logTo(
          l,
          "Returned by " +
            l.holder +
            (s.lookup.toUpperCase() === l.asset
              ? " · matched by the tag " + l.asset
              : s.lookup
                ? " · found by name “" + s.lookup + "”"
                : ""),
        );
        s.lookup = "";
        if (s.holding === l.num) s.holding = 0;
        s.notice =
          unitName(l) + " returned to stock. Slip L-" + l.num + " closed.";
        // A request coming back in pieces: ask about what is still out.
        const left = s.loans.filter((x) => x.req === l.req && !x.back);
        if (left.length) {
          s.notice +=
            " Still out on " +
            l.req +
            ": " +
            left.map(unitName).join(", ") +
            ". If it is not coming back now, record who has it.";
          if (left.length === 1 && !s.holding) s.holding = left[0].num;
        }
        break;
      }
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    if (e.target.matches('[data-add] select[name="type"]')) {
      s.addType = e.target.value;
      const f = e.target.form;
      const keep = [f.model.value, f.bin.value];
      paint();
      const g = q("[data-add]");
      g.model.value = keep[0];
      g.bin.value = keep[1];
      return;
    }
    if (e.target.matches("[data-staff]")) {
      if (!staff.includes(e.target.value)) return;
      if (e.target.value !== s.staff) s.handoverFrom = s.staff;
      s.staff = e.target.value;
      commit(s.staff + " is now on the desk.");
      return;
    }
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
    }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, by: s.staff, text });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-checkin]")) {
      s.lookup = String(form.get("unit") || "").trim();
      commit();
      return;
    }
    if (f.matches("[data-hold]")) {
      const l = s.loans.find((x) => x.num === s.holding);
      const holder = form.get("holder"),
        expect = form.get("expect");
      if (
        !l ||
        l.back ||
        !people.includes(holder) ||
        !dueTimes.includes(expect)
      )
        return;
      logTo(
        l,
        l.holder +
          " says it is with " +
          holder +
          ", back " +
          expect,
      );
      if (holder !== l.holder) l.trail.push({ h: phaseHour[s.phase], who: holder });
      l.holder = holder;
      l.expect = expect;
      s.holding = 0;
      // Mirror the change into the desk book so both records agree.
      s.notes.push({
        phase: s.phase,
        by: s.staff,
        text:
          "Slip L-" +
          l.num +
          " (" +
          unitName(l) +
          ") is still out with " +
          holder +
          ", expected " +
          expect +
          ". Close it from the Loan register when it comes in.",
      });
      commit("Slip L-" + l.num + " updated: with " + holder + ", expected " + expect + ".");
      return;
    }
    if (f.matches("[data-add]")) {
      const type = String(form.get("type")),
        model = String(form.get("model") || "").trim(),
        bin = String(form.get("bin") || "").trim().toUpperCase();
      if (!prefix[type] || !model || !bin) return;
      const id = nextId(type);
      s.added.push({ id, type, model, bin, at: shifts[s.phase].time });
      s.adding = false;
      s.addType = "";
      commit("Added " + id + " · " + type + " to shelf " + bin + ". Put tag " + id + " on the unit.");
      return;
    }
    if (f.matches("[data-kit]")) {
      const r = getReq(s.kit);
      if (!r || reqLoans(r.id).length) return;
      const who = form.get("who"),
        due = form.get("due"),
        auth = String(form.get("auth") || "");
      const units = r.items.map((type, i) => getAsset(form.get("unit" + i)));
      if (!people.includes(who) || !dueTimes.includes(due)) return;
      if (
        units.some(
          (u, i) => !u || inRepair(u) || out(u.id) || u.type !== r.items[i],
        )
      )
        return;
      if (who !== r.owner && !auth) {
        q("[data-status]").textContent =
          who +
          " is not the request owner. Record how " +
          r.owner +
          " authorised the collection.";
        return;
      }
      let num = Math.max(...s.loans.map((l) => l.num));
      const first = num + 1;
      for (const u of units) {
        const l = {
          num: ++num,
          req: r.id,
          asset: u.id,
          who,
          due,
          holder: who,
          expect: due,
          auth: who === r.owner ? "" : auth,
            back: false,
          log: [],
          trail: [{ h: phaseHour[s.phase], who }],
        };
        logTo(
          l,
          "Issued to " +
            who +
            (who === r.owner
              ? " (request owner)"
              : " · authorised by " + r.owner + " (" + auth.toLowerCase() + ")"),
        );
        s.loans.push(l);
      }
      s.kit = "";
      s.tab = "Loan register";
      s.selected = "";
      commit(
        "Issued the " +
          r.club +
          " kit to " +
          who +
          " on slips L-" +
          first +
          " to L-" +
          num +
          ". Due " +
          due +
          ".",
      );
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);
    if (!r || !unit || inRepair(unit) || out(asset) || !people.includes(who))
      return;
    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }
    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }
    const num = Math.max(...s.loans.map((l) => l.num)) + 1;
    const l = { num, req, asset, who, due, holder: who, expect: due, auth: "", back: false, log: [], trail: [{ h: phaseHour[s.phase], who }] };
    logTo(
      l,
      "Issued to " +
        who +
        (who === r.owner ? " (request owner)" : " · owner authorisation not recorded"),
    );
    s.loans.push(l);
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });
  function restore(d) {
    if (
      !d ||
      d.version !== 4 ||
      !Object.hasOwn(screens, d.tab) ||
      !shifts[d.phase] ||
      (d.selected && !getReq(d.selected)) ||
      !Array.isArray(d.notes) ||
      !d.notes.every(
        (n) => n && shifts[n.phase] && typeof n.text === "string",
      ) ||
      (d.staff !== undefined && !staff.includes(d.staff)) ||
      !Array.isArray(d.added) ||
      (d.repairs !== undefined &&
        (!Array.isArray(d.repairs) ||
          !d.repairs.every((x) => x && typeof x.id === "string" && typeof x.why === "string"))) ||
      !d.added.every(
        (a) =>
          a &&
          prefix[a.type] &&
          typeof a.id === "string" &&
          typeof a.model === "string" &&
          typeof a.bin === "string",
      ) ||
      !Array.isArray(d.loans) ||
      !d.loans.length ||
      !d.loans.every(
        (l) =>
          l &&
          getReq(l.req) &&
          assets.concat(d.added).some((a) => a.id === l.asset) &&
          Number.isInteger(l.num) &&
          people.includes(l.holder) &&
          dueTimes.includes(l.expect) &&
          Array.isArray(l.log),
      )
    )
      return;
    s = {
      ...original(),
      ...d,
      loans: d.loans.map((l) => ({
        ...l,
        log: l.log.map((e) => ({ ...e })),
        trail: Array.isArray(l.trail) ? l.trail.map((t) => ({ ...t })) : [],
      })),
      notes: d.notes.map((n) => ({ ...n })),
      added: d.added.map((a) => ({ ...a })),
      repairs: (d.repairs || []).map((x) => ({ ...x })),
    };
    paint();
  }
  // Light by default; the desk can switch to dark and it is remembered.
  const themeBtn = q("[data-theme-toggle]");
  const setTheme = (dark) => {
    document.documentElement.classList.toggle("dark", dark);
    themeBtn.textContent = dark ? "Light mode" : "Dark mode";
    try {
      localStorage.setItem("campus-stores.theme", dark ? "dark" : "light");
    } catch {}
  };
  themeBtn.addEventListener("click", () =>
    setTheme(!document.documentElement.classList.contains("dark")),
  );
  try {
    setTheme(localStorage.getItem("campus-stores.theme") === "dark");
  } catch {
    setTheme(false);
  }
  paint();
  try {
    restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    // Keep the fresh shift when storage is unavailable or the saved data is invalid.
  }
})();
