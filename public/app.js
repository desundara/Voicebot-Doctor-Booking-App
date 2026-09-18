(function () {
  const chatPanel = document.getElementById("chatPanel");
  const choicesPanel = document.getElementById("choicesPanel");
  const micBtn = document.getElementById("micBtn");
  const textInput = document.getElementById("textInput");
  const sendBtn = document.getElementById("sendBtn");
  const statusBar = document.getElementById("statusBar");
  const restartBtn = document.getElementById("restartBtn");
  const stepLabelEl = document.getElementById("stepLabel");
  const stepFillEl = document.getElementById("stepFill");

  const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const SPECIALTY_ICON = {
    generalPhysician: "🩺",
    dentist: "🦷",
    cardiologist: "❤️",
    pediatrician: "👶",
    dermatologist: "🧴",
  };
  const AVATAR_GRADIENTS = [
    "from-deep_twilight-500 to-bright_teal_blue-500",
    "from-bright_teal_blue-500 to-turquoise_surf-500",
    "from-turquoise_surf-500 to-frosted_blue-400",
    "from-frosted_blue-400 to-deep_twilight-600",
    "from-deep_twilight-600 to-turquoise_surf-500",
  ];

  let state = {
    stage: "LANG_SELECT",
    lang: "en",
    doctors: [],
    selectedDoctor: null,
    selectedDay: null,
    freeSlots: [],
    selectedTime: null,
    patientName: null,
  };

  // ---------- small helpers ----------
  function initials(name) {
    return name
      .replace(/^Dr\.?\s*/i, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  }

  function timeNow() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // ---------- UI: bubbles ----------
  function bubbleShell(who) {
    const wrap = document.createElement("div");
    wrap.className = "msg-enter flex flex-col " + (who === "user" ? "items-end" : "items-start");
    return wrap;
  }

  function addBubble(text, who) {
    const wrap = bubbleShell(who);
    const bubble = document.createElement("div");
    bubble.className =
      "max-w-[80%] px-4 py-2.5 text-[0.92rem] leading-relaxed whitespace-pre-wrap " +
      (who === "user"
        ? "bg-gradient-to-br from-bright_teal_blue-500 to-deep_twilight-500 text-white rounded-2xl rounded-br-md shadow-sm"
        : "bg-white text-deep_twilight-500 rounded-2xl rounded-bl-md shadow-sm ring-1 ring-light_cyan-700");
    bubble.textContent = text;
    const time = document.createElement("span");
    time.className = "text-[10px] text-deep_twilight-400/50 mt-1 px-1";
    time.textContent = timeNow();
    wrap.appendChild(bubble);
    wrap.appendChild(time);
    chatPanel.appendChild(wrap);
    chatPanel.scrollTop = chatPanel.scrollHeight;
  }

  function systemNote(text) {
    const div = document.createElement("div");
    div.className = "msg-enter text-center text-[11px] italic text-deep_twilight-400/60 py-1";
    div.textContent = text;
    chatPanel.appendChild(div);
    chatPanel.scrollTop = chatPanel.scrollHeight;
  }

  function showTyping() {
    const wrap = bubbleShell("bot");
    wrap.id = "typingWrap";
    const bubble = document.createElement("div");
    bubble.className = "bg-white rounded-2xl rounded-bl-md shadow-sm ring-1 ring-light_cyan-700 px-4 py-2.5";
    bubble.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    wrap.appendChild(bubble);
    chatPanel.appendChild(wrap);
    chatPanel.scrollTop = chatPanel.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById("typingWrap");
    if (el) el.remove();
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = LANGUAGES[state.lang].speechCode;
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.warn("TTS failed:", e);
    }
  }

  // botSay: shows a short "typing…" animation, then the bubble, then speaks it, then fires cb.
  function botSay(text, cb) {
    showTyping();
    setTimeout(() => {
      hideTyping();
      addBubble(text, "bot");
      speak(text);
      if (cb) cb();
    }, 480);
  }

  function userSay(text) {
    addBubble(text, "user");
  }

  // ---------- Step progress bar ----------
  function updateStepBar(index, labelKey) {
    const label = STEP_LABELS[index] ? (STEP_LABELS[index][state.lang] || STEP_LABELS[index].en) : labelKey;
    stepLabelEl.textContent = `Step ${index} of 6 — ${label}`;
    stepFillEl.style.width = `${(index / 6) * 100}%`;
  }

  // ---------- Choice pills (generic) ----------
  function setChoices(options) {
    choicesPanel.innerHTML = "";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className =
        "choice-pill rounded-full px-4 py-2 text-sm font-medium border border-turquoise_surf-500 text-bright_teal_blue-500 bg-white hover:bg-turquoise_surf-900 active:scale-95 transition shadow-sm";
      btn.textContent = opt.icon ? `${opt.icon} ${opt.label}` : `${opt.number}. ${opt.label}`;
      btn.onclick = () => handleUserInput(String(opt.number), opt);
      choicesPanel.appendChild(btn);
    });
    state.currentOptions = options;
  }

  function clearChoices() {
    choicesPanel.innerHTML = "";
    state.currentOptions = null;
  }

  function setStatus(text) {
    statusBar.textContent = text || "";
  }

  // ---------- Doctor cards ----------
  function renderDoctorCards(doctors) {
    choicesPanel.innerHTML = "";
    choicesPanel.className = "px-4 pb-3 bg-light_cyan-900 grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0";
    doctors.forEach((d, idx) => {
      const specialtyLabel = (SPECIALTIES[d.specialtyKey] && SPECIALTIES[d.specialtyKey][state.lang]) || SPECIALTIES[d.specialtyKey].en;
      const card = document.createElement("button");
      card.className =
        "doctor-card text-left rounded-2xl bg-white ring-1 ring-light_cyan-700 hover:ring-turquoise_surf-500 hover:shadow-md active:scale-[0.98] transition p-3 flex items-center gap-3";
      card.innerHTML = `
        <span class="relative shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} text-white font-display font-semibold flex items-center justify-center text-sm">
          ${initials(d.name)}
          <span class="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-deep_twilight-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">${idx + 1}</span>
        </span>
        <span class="min-w-0">
          <span class="block font-display font-semibold text-deep_twilight-500 text-sm truncate">${d.name}</span>
          <span class="block text-xs text-deep_twilight-400/70 mt-0.5">${SPECIALTY_ICON[d.specialtyKey] || "🩺"} ${specialtyLabel}</span>
          <span class="inline-block mt-1 text-[10px] font-medium text-bright_teal_blue-500 bg-bright_teal_blue-900 rounded-full px-2 py-0.5">Mon–Fri</span>
        </span>
      `;
      card.onclick = () => handleUserInput(String(idx + 1), { number: idx + 1, value: d });
      choicesPanel.appendChild(card);
    });
    state.currentOptions = doctors.map((d, idx) => ({ number: idx + 1, value: d }));
  }

  function resetChoicesPanelLayout() {
    choicesPanel.className = "px-4 pb-3 bg-light_cyan-900 flex flex-wrap gap-2 shrink-0";
  }

  // ---------- Review card (confirm step) ----------
  function renderReviewCard() {
    choicesPanel.innerHTML = "";
    resetChoicesPanelLayout();
    const dayLabel = WEEKDAY_NAMES[state.selectedDay][state.lang] || WEEKDAY_NAMES[state.selectedDay].en;

    const card = document.createElement("div");
    card.className = "msg-enter w-full rounded-2xl bg-white ring-1 ring-light_cyan-700 shadow-sm p-4 mb-1";
    card.innerHTML = `
      <div class="font-display font-semibold text-deep_twilight-500 text-sm mb-2">Review your appointment</div>
      <div class="space-y-1.5 text-sm text-deep_twilight-500/90">
        <div class="flex justify-between"><span class="text-deep_twilight-400/60">🩺 Doctor</span><span class="font-medium">${state.selectedDoctor.name}</span></div>
        <div class="flex justify-between"><span class="text-deep_twilight-400/60">📅 Day</span><span class="font-medium">${dayLabel}</span></div>
        <div class="flex justify-between"><span class="text-deep_twilight-400/60">⏰ Time</span><span class="font-medium">${state.selectedTime}</span></div>
        <div class="flex justify-between"><span class="text-deep_twilight-400/60">🧑 Name</span><span class="font-medium">${state.patientName}</span></div>
      </div>
    `;
    choicesPanel.appendChild(card);

    const btnRow = document.createElement("div");
    btnRow.className = "w-full flex gap-2";
    btnRow.innerHTML = `
      <button id="confirmBtn" class="flex-1 rounded-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-bright_teal_blue-500 to-turquoise_surf-500 hover:from-bright_teal_blue-400 hover:to-turquoise_surf-400 active:scale-95 transition shadow-md">✅ Confirm</button>
      <button id="cancelBtn" class="flex-1 rounded-full py-2.5 text-sm font-semibold text-deep_twilight-500 border border-light_cyan-700 hover:bg-light_cyan-900 active:scale-95 transition">❌ Cancel</button>
    `;
    choicesPanel.appendChild(btnRow);
    document.getElementById("confirmBtn").onclick = () => handleUserInput("1", { number: 1, value: "confirm" });
    document.getElementById("cancelBtn").onclick = () => handleUserInput("2", { number: 2, value: "cancel" });
  }

  // ---------- Success card ----------
  function renderSuccessCard(booking) {
    const dayLabel = WEEKDAY_NAMES[state.selectedDay][state.lang] || WEEKDAY_NAMES[state.selectedDay].en;
    const wrap = document.createElement("div");
    wrap.className = "msg-enter w-full rounded-2xl bg-white ring-1 ring-turquoise_surf-500/40 shadow-md p-4";
    wrap.innerHTML = `
      <div class="flex items-center gap-3 mb-3">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-turquoise_surf-500 to-frosted_blue-400 text-white flex items-center justify-center text-lg">✓</div>
        <div>
          <div class="font-display font-semibold text-deep_twilight-500 text-sm">Appointment confirmed</div>
          <div class="text-[11px] text-deep_twilight-400/60">ID: <span class="font-mono">${booking.id}</span></div>
        </div>
      </div>
      <div class="space-y-1.5 text-sm text-deep_twilight-500/90 mb-3">
        <div class="flex justify-between"><span class="text-deep_twilight-400/60">🩺 Doctor</span><span class="font-medium">${state.selectedDoctor.name}</span></div>
        <div class="flex justify-between"><span class="text-deep_twilight-400/60">📅 Day</span><span class="font-medium">${dayLabel}</span></div>
        <div class="flex justify-between"><span class="text-deep_twilight-400/60">⏰ Time</span><span class="font-medium">${state.selectedTime}</span></div>
        <div class="flex justify-between"><span class="text-deep_twilight-400/60">🧑 Name</span><span class="font-medium">${state.patientName}</span></div>
      </div>
      <div class="flex flex-col gap-2">
        <button id="googleCalBtn" class="w-full rounded-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-bright_teal_blue-500 to-turquoise_surf-500 hover:from-bright_teal_blue-400 hover:to-turquoise_surf-400 active:scale-95 transition shadow-md">🌐 Open in Google Calendar</button>
      </div>
    `;
    chatPanel.appendChild(wrap);
    chatPanel.scrollTop = chatPanel.scrollHeight;

    document.getElementById("googleCalBtn").onclick = () => {
      const url = buildGoogleCalendarUrl(state.selectedDoctor.name, state.selectedDay, state.selectedTime, state.patientName, booking.id);
      window.open(url, "_blank", "noopener");
      systemNote(t("calendarGoogleNote", state.lang));
    };
    document.getElementById("icsBtn").onclick = () => {
      downloadICS(state.selectedDoctor.name, state.selectedDay, state.selectedTime, state.patientName, booking.id);
      systemNote(t("calendarDownloadedNote", state.lang));
    };
  }

  // ---------- Shared date math for calendar exports ----------
  function computeEventUTCRange(day, time) {
    const dayIndexMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5 };
    const targetDow = dayIndexMap[day];
    const date = new Date();
    let diff = (targetDow - date.getDay() + 7) % 7;
    if (diff === 0) diff = 7;
    date.setDate(date.getDate() + diff);
    const [hh, mm] = time.split(":").map(Number);
    date.setHours(hh, mm, 0, 0);
    const endDate = new Date(date.getTime() + 30 * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    return { startUTC: fmt(date), endUTC: fmt(endDate) };
  }

  // ---------- Option A: Google Calendar (opens in browser, no file/app association needed) ----------
  function buildGoogleCalendarUrl(doctorName, day, time, patientName, id) {
    const { startUTC, endUTC } = computeEventUTCRange(day, time);
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Appointment with ${doctorName}`,
      dates: `${startUTC}/${endUTC}`,
      details: `Booking for ${patientName}. Confirmation ID: ${id}`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  // ---------- Option B: .ics file download (for Outlook / Apple Calendar / etc.) ----------
  function downloadICS(doctorName, day, time, patientName, id) {
    const { startUTC, endUTC } = computeEventUTCRange(day, time);
    const fmtNow = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Voicebot Doctor Booking//EN",
      "BEGIN:VEVENT",
      `UID:${id}@voicebot-doctor-booking`,
      `DTSTAMP:${fmtNow(new Date())}`,
      `DTSTART:${startUTC}`,
      `DTEND:${endUTC}`,
      `SUMMARY:Appointment with ${doctorName}`,
      `DESCRIPTION:Booking for ${patientName}. Confirmation ID: ${id}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appointment-${id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---------- Speech recognition (STT) ----------
  let recognition = null;
  let recognizing = false;

  function getRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const rec = new SR();
    rec.lang = LANGUAGES[state.lang].speechCode;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    return rec;
  }

  micBtn.addEventListener("click", () => {
    if (recognizing) {
      if (recognition) recognition.stop();
      return;
    }
    recognition = getRecognition();
    if (!recognition) {
      systemNote(t("micNotSupported", state.lang));
      return;
    }
    recognizing = true;
    micBtn.classList.add("mic-listening");
    setStatus(t("listening", state.lang));

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      userSay(transcript);
      handleUserInput(transcript);
    };
    recognition.onerror = () => {
      systemNote(t("micNotSupported", state.lang));
    };
    recognition.onend = () => {
      recognizing = false;
      micBtn.classList.remove("mic-listening");
      setStatus("");
    };

    try {
      recognition.start();
    } catch (e) {
      recognizing = false;
      micBtn.classList.remove("mic-listening");
      systemNote(t("micNotSupported", state.lang));
    }
  });

  sendBtn.addEventListener("click", submitTextInput);
  textInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitTextInput();
  });

  function submitTextInput() {
    const val = textInput.value.trim();
    if (!val) return;
    userSay(val);
    textInput.value = "";
    handleUserInput(val);
  }

  // ---------- Number parsing across languages ----------
  function extractNumber(text, lang, maxN) {
    const lower = text.trim().toLowerCase();
    const map = NUMBER_WORDS[lang] || NUMBER_WORDS.en;
    for (let n = 1; n <= maxN; n++) {
      const words = map[String(n)] || [];
      if (words.some((w) => lower === w.toLowerCase() || lower.includes(w.toLowerCase()))) {
        return n;
      }
    }
    const digitMatch = lower.match(/[1-9]/);
    if (digitMatch) {
      const n = parseInt(digitMatch[0], 10);
      if (n >= 1 && n <= maxN) return n;
    }
    return null;
  }

  // ---------- Free-text understanding (chatbot layer) ----------
  // Word-boundary aware substring check: for plain a-z keywords this avoids
  // false positives like "fri" matching inside "friend". Non-Latin scripts
  // (Sinhala/Chinese/Greek) don't have the same word-boundary concept in
  // regex, so those fall back to a plain substring check.
  function textHasKeyword(lowerText, word) {
    const w = word.toLowerCase();
    if (/^[a-z0-9 ]+$/.test(w)) {
      return new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lowerText);
    }
    return lowerText.includes(w);
  }

  const SPECIALTY_KEYWORDS = {
    generalPhysician: ["general physician", "general practitioner", "gp", "physician", "checkup", "check up", "fever", "cold", "flu", "සාමාන්‍ය වෛද්‍ය", "සාමාන්‍ය", "උණ", "සෙම්ප්‍රතිශ්‍යාව", "médecin généraliste", "généraliste", "fièvre", "全科", "发烧", "感冒", "全科医生", "γενικός ιατρός", "γενικός", "πυρετ", "medico di base", "febbre", "influenza"],
    dentist: ["dentist", "tooth", "teeth", "dental", "toothache", "දන්ත", "දත්", "දත් කැක්කුම", "dentiste", "dent", "mal de dent", "牙医", "牙痛", "牙", "οδοντίατρος", "δόντι", "πονόδοντος", "dentista", "dente", "mal di denti"],
    cardiologist: ["cardiologist", "heart", "chest pain", "cardiac", "හෘද", "හදවත", "cardiologue", "cœur", "coeur", "douleur thoracique", "心脏", "心脏科", "καρδιολόγος", "καρδι", "πόνος στο στήθος", "cardiologo", "cuore", "dolore al petto"],
    pediatrician: ["pediatrician", "paediatrician", "child", "kids", "baby", "children", "ළමා", "බබා", "දරුවා", "pédiatre", "enfant", "bébé", "儿科", "孩子", "婴儿", "παιδίατρος", "παιδ", "μωρό", "pediatra", "bambino"],
    dermatologist: ["dermatologist", "skin", "rash", "acne", "dermatology", "චර්ම", "සම", "dermatologue", "peau", "éruption", "皮肤", "皮疹", "δερματολόγος", "δέρματ", "εξάνθημα", "dermatologo", "pelle", "eruzione"],
  };

  function matchSpecialtyFromText(text, doctors) {
    const lower = text.toLowerCase();
    // Full name match first ("Dr. Kasun Silva"), then fall back to a single
    // name token ("Silva") so "I want to see Dr. Silva" still resolves.
    const byName = doctors.find((d) => {
      const nameNoTitle = d.name.toLowerCase().replace(/^dr\.?\s*/, "");
      if (lower.includes(nameNoTitle)) return true;
      const tokens = nameNoTitle.split(" ").filter((w) => w.length > 2);
      return tokens.some((tok) => textHasKeyword(lower, tok));
    });
    if (byName) return byName;
    for (const [key, words] of Object.entries(SPECIALTY_KEYWORDS)) {
      if (words.some((w) => textHasKeyword(lower, w))) {
        const doc = doctors.find((d) => d.specialtyKey === key);
        if (doc) return doc;
      }
    }
    return null;
  }

  const WEEKDAY_ALIASES = {
    monday: ["mon"],
    tuesday: ["tue", "tues"],
    wednesday: ["wed"],
    thursday: ["thu", "thur", "thurs"],
    friday: ["fri"],
  };

  function matchWeekdayFromText(text) {
    const lower = text.toLowerCase();
    for (const day of WEEKDAYS) {
      const translations = Object.values(WEEKDAY_NAMES[day]).map((s) => s.toLowerCase());
      const aliases = WEEKDAY_ALIASES[day] || [];
      if ([...translations, ...aliases].some((w) => textHasKeyword(lower, w))) {
        return day;
      }
    }
    return null;
  }

  function matchTimeFromText(text, freeSlots) {
    if (!freeSlots || !freeSlots.length) return null;
    const lower = text.toLowerCase();

    let m = lower.match(/(\d{1,2})[:.](\d{2})/);
    if (m) {
      const candidate = `${m[1].padStart(2, "0")}:${m[2]}`;
      if (freeSlots.includes(candidate)) return candidate;
    }

    m = lower.match(/(\d{1,2})\s?(am|pm)/);
    if (m) {
      let hh = parseInt(m[1], 10);
      if (m[2] === "pm" && hh < 12) hh += 12;
      if (m[2] === "am" && hh === 12) hh = 0;
      const candidate = freeSlots.find((s) => s.startsWith(String(hh).padStart(2, "0") + ":"));
      if (candidate) return candidate;
    }

    m = lower.match(/\b(\d{1,2})\b/);
    if (m) {
      const candidate = freeSlots.find((s) => s.startsWith(m[1].padStart(2, "0") + ":"));
      if (candidate) return candidate;
    }
    return null;
  }

  const SMALL_TALK_KEYWORDS = {
    greeting: ["hello", "hi", "hey", "ආයුබෝවන්", "bonjour", "salut", "你好", "γεια", "ciao"],
    thanks: ["thank you", "thanks", "ස්තූතියි", "merci", "谢谢", "ευχαριστ", "grazie"],
    help: ["help", "what can you do", "options", "මොනවද", "aide", "帮助", "βοήθεια", "aiuto"],
  };

  function matchSmallTalk(text) {
    const lower = text.toLowerCase();
    for (const [type, words] of Object.entries(SMALL_TALK_KEYWORDS)) {
      if (words.some((w) => textHasKeyword(lower, w))) return type;
    }
    return null;
  }

  function respondSmallTalk(type) {
    const key = type === "greeting" ? "smallTalkGreetingReply" : type === "thanks" ? "smallTalkThanksReply" : "smallTalkHelpReply";
    botSay(t(key, state.lang), () => {
      if (state.stage === "SPECIALTY") askSpecialty();
      else if (state.stage === "DAY") askDay();
      else if (state.stage === "TIME") askTime();
      else if (state.stage === "CONFIRM") askConfirm();
      else if (state.stage === "BOOK_ANOTHER") askBookAnother();
    });
  }

  // ---------- API helpers ----------
  async function apiGet(url) {
    const res = await fetch(url);
    return res.json();
  }
  async function apiPost(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  // ---------- Flow control ----------
  function handleUserInput(raw, clickedOption) {
    if (!clickedOption && state.stage !== "NAME" && state.stage !== "LANG_SELECT") {
      const smallTalk = matchSmallTalk(raw);
      if (smallTalk) {
        respondSmallTalk(smallTalk);
        return;
      }
    }
    switch (state.stage) {
      case "SPECIALTY":
        return onSpecialtyAnswer(raw, clickedOption);
      case "DAY":
        return onDayAnswer(raw, clickedOption);
      case "TIME":
        return onTimeAnswer(raw, clickedOption);
      case "NAME":
        return onNameAnswer(raw);
      case "CONFIRM":
        return onConfirmAnswer(raw, clickedOption);
      case "BOOK_ANOTHER":
        return onBookAnotherAnswer(raw, clickedOption);
      default:
        return;
    }
  }

  async function startBooking() {
    state.doctors = await apiGet("/api/doctors");
    botSay(t("greeting", state.lang), () => askSpecialty());
  }

  function askSpecialty() {
    state.stage = "SPECIALTY";
    updateStepBar(2);
    botSay(t("askSpecialty", state.lang), () => renderDoctorCards(state.doctors));
  }

  function onSpecialtyAnswer(raw, clickedOption) {
    let doctor = clickedOption ? clickedOption.value : null;
    if (!doctor) {
      const n = extractNumber(raw, state.lang, state.doctors.length);
      if (n) doctor = state.doctors[n - 1];
    }
    if (!doctor) {
      doctor = matchSpecialtyFromText(raw, state.doctors);
    }
    if (!doctor) {
      botSay(t("notUnderstood", state.lang));
      return;
    }
    state.selectedDoctor = doctor;
    resetChoicesPanelLayout();
    clearChoices();

    // Bonus: "book me a dentist for Monday" — same message also names a day, so skip the day question.
    const impliedDay = clickedOption ? null : matchWeekdayFromText(raw);
    if (impliedDay) {
      botSay(t("confirmDoctor", state.lang, { doctor: doctor.name }), async () => {
        state.selectedDay = impliedDay;
        state.stage = "DAY";
        updateStepBar(3);
        const availability = await apiGet(`/api/availability?doctorId=${state.selectedDoctor.id}&day=${impliedDay}`);
        state.freeSlots = availability.freeSlots || [];
        if (state.freeSlots.length === 0) {
          botSay(t("noSlots", state.lang), () => askDay());
        } else {
          askTime();
        }
      });
      return;
    }

    botSay(t("confirmDoctor", state.lang, { doctor: doctor.name }), () => askDay());
  }

  function askDay() {
    state.stage = "DAY";
    updateStepBar(3);
    botSay(t("askDay", state.lang), () => {
      const options = WEEKDAYS.map((d, idx) => ({
        number: idx + 1,
        label: WEEKDAY_NAMES[d][state.lang] || WEEKDAY_NAMES[d].en,
        value: d,
        icon: "📅",
      }));
      setChoices(options);
    });
  }

  async function onDayAnswer(raw, clickedOption) {
    let day = clickedOption ? clickedOption.value : null;
    if (!day) {
      const n = extractNumber(raw, state.lang, WEEKDAYS.length);
      if (n) day = WEEKDAYS[n - 1];
    }
    if (!day) {
      day = matchWeekdayFromText(raw);
    }
    if (!day) {
      botSay(t("notUnderstood", state.lang));
      return;
    }
    state.selectedDay = day;
    clearChoices();

    const availability = await apiGet(`/api/availability?doctorId=${state.selectedDoctor.id}&day=${day}`);
    state.freeSlots = availability.freeSlots || [];

    if (state.freeSlots.length === 0) {
      botSay(t("noSlots", state.lang), () => askDay());
      return;
    }

    // Bonus: "Monday at 3pm" — same message also named a time, so skip the time question.
    const impliedTime = clickedOption ? null : matchTimeFromText(raw, state.freeSlots);
    if (impliedTime) {
      state.selectedTime = impliedTime;
      state.stage = "TIME";
      updateStepBar(4);
      clearChoices();
      askName();
      return;
    }

    askTime();
  }

  function askTime() {
    state.stage = "TIME";
    updateStepBar(4);
    botSay(t("askTime", state.lang), () => {
      const options = state.freeSlots.map((s, idx) => ({
        number: idx + 1,
        label: s,
        value: s,
        icon: "⏰",
      }));
      setChoices(options);
    });
  }

  function onTimeAnswer(raw, clickedOption) {
    let time = clickedOption ? clickedOption.value : null;
    if (!time) {
      const n = extractNumber(raw, state.lang, state.freeSlots.length);
      if (n) time = state.freeSlots[n - 1];
    }
    if (!time) {
      time = matchTimeFromText(raw, state.freeSlots);
    }
    if (!time) {
      botSay(t("notUnderstood", state.lang));
      return;
    }
    state.selectedTime = time;
    clearChoices();
    askName();
  }

  function askName() {
    state.stage = "NAME";
    updateStepBar(5);
    botSay(t("askName", state.lang));
  }

  function onNameAnswer(raw) {
    const name = raw.trim();
    if (!name) {
      botSay(t("askNameEmpty", state.lang));
      return;
    }
    state.patientName = name;
    askConfirm();
  }

  function askConfirm() {
    state.stage = "CONFIRM";
    updateStepBar(6);
    botSay(t("confirmBooking", state.lang, {
      doctor: state.selectedDoctor.name,
      day: WEEKDAY_NAMES[state.selectedDay][state.lang] || WEEKDAY_NAMES[state.selectedDay].en,
      time: state.selectedTime,
      name: state.patientName,
    }), () => renderReviewCard());
  }

  async function onConfirmAnswer(raw, clickedOption) {
    let choice = clickedOption ? clickedOption.value : null;
    if (!choice) {
      const n = extractNumber(raw, state.lang, 2);
      if (n === 1) choice = "confirm";
      if (n === 2) choice = "cancel";
    }
    if (choice === "confirm") {
      resetChoicesPanelLayout();
      clearChoices();
      const result = await apiPost("/api/book", {
        doctorId: state.selectedDoctor.id,
        day: state.selectedDay,
        time: state.selectedTime,
        patientName: state.patientName,
        language: state.lang,
      });
      if (result.success) {
        showTyping();
        setTimeout(() => {
          hideTyping();
          renderSuccessCard(result.booking);
          speak(t("bookingSuccess", state.lang, { id: result.booking.id }));
          setTimeout(askBookAnother, 500);
        }, 480);
      } else {
        botSay(result.message || t("notUnderstood", state.lang));
        setTimeout(askBookAnother, 500);
      }
    } else if (choice === "cancel") {
      resetChoicesPanelLayout();
      clearChoices();
      botSay(t("bookingCancelled", state.lang), () => askSpecialty());
    } else {
      botSay(t("notUnderstood", state.lang));
    }
  }

  function askBookAnother() {
    state.stage = "BOOK_ANOTHER";
    botSay(t("bookAnother", state.lang), () => {
      setChoices([
        { number: 1, label: "Book another", value: "again", icon: "🔁" },
        { number: 2, label: "End", value: "end", icon: "🛑" },
      ]);
    });
  }

  function onBookAnotherAnswer(raw, clickedOption) {
    let choice = clickedOption ? clickedOption.value : null;
    if (!choice) {
      const n = extractNumber(raw, state.lang, 2);
      if (n === 1) choice = "again";
      if (n === 2) choice = "end";
    }
    if (choice === "again") {
      state.selectedDoctor = null;
      state.selectedDay = null;
      state.selectedTime = null;
      state.patientName = null;
      clearChoices();
      askSpecialty();
    } else if (choice === "end") {
      clearChoices();
      botSay(t("goodbye", state.lang));
      state.stage = "DONE";
    } else {
      botSay(t("notUnderstood", state.lang));
    }
  }

  // ---------- Language selection (entry point) ----------
  function showLanguageSelect() {
    resetChoicesPanelLayout();
    chatPanel.innerHTML = "";
    updateStepBar(1);
    systemNote(t("chooseLanguage", "en"));
    const options = Object.keys(LANGUAGES).map((code, idx) => ({
      number: idx + 1,
      label: LANGUAGES[code].label,
      value: code,
      icon: "🌐",
    }));
    setChoices(options);
    state.stage = "LANG_SELECT";
  }

  const originalHandleUserInput = handleUserInput;
  handleUserInput = function (raw, clickedOption) {
    if (state.stage === "LANG_SELECT") {
      let lang = clickedOption ? clickedOption.value : null;
      if (!lang) {
        const codes = Object.keys(LANGUAGES);
        const n = extractNumber(raw, "en", codes.length);
        if (n) lang = codes[n - 1];
      }
      if (!lang || !LANGUAGES[lang]) {
        systemNote(t("notUnderstood", "en"));
        return;
      }
      state.lang = lang;
      clearChoices();
      startBooking();
      return;
    }
    return originalHandleUserInput(raw, clickedOption);
  };

  restartBtn.addEventListener("click", () => {
    state = {
      stage: "LANG_SELECT",
      lang: "en",
      doctors: [],
      selectedDoctor: null,
      selectedDay: null,
      freeSlots: [],
      selectedTime: null,
      patientName: null,
    };
    showLanguageSelect();
  });

  showLanguageSelect();
})();