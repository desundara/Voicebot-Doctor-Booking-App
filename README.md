# Doctor Booking Voicebot (Multilingual)

A web-based voicebot that lets a patient book an appointment with a doctor,
**Monday to Friday only**, in **English, Sinhala, French, Chinese, Greek, and Italian**.

## How it works

- **Frontend**: plain HTML/CSS/JS (`public/`). Uses the browser's built-in
  **Web Speech API** — `SpeechRecognition` for voice input (speech-to-text)
  and `speechSynthesis` for the bot's spoken replies (text-to-speech). No
  external speech vendor, no API key, works offline-ish once loaded (speech
  quality depends on the browser/OS voice packs installed).
- **Backend**: Node.js + Express (`server.js`). Stores doctors and slot data
  in `data/doctors.json`, appends confirmed bookings to `data/bookings.json`.
  All booking logic (weekday check, slot-availability check, clash check)
  lives server-side so it can't be bypassed by the client.
- **Conversation flow**: a simple finite-state machine
  (language → specialty → weekday → time slot → name → confirm → done),
  implemented in `public/app.js`.

## Why numbered menus instead of free-form NLU

Every step (choose doctor, choose day, choose time, confirm) is a **numbered
choice** that the bot reads aloud and also shows as tap-able buttons. The
user can say *or* type *or* tap the number. This is a deliberate design
choice, not a shortcut:

- Free-form natural-language understanding (e.g. "I want to see the heart
  doctor next Tuesday afternoon") would need a real NLU/intent model per
  language, and accuracy varies a lot language-to-language (especially for
  Sinhala and Greek, which have far less speech-model coverage than English).
- A numbered menu is 100% unambiguous in every language, degrades gracefully
  (buttons work even if the mic fails or the browser doesn't support speech
  recognition for that language), and is a pattern real IVR/telephony
  voicebots use for exactly this reason.
- The one genuinely free-text field — the patient's **name** — is taken as
  plain speech-to-text/typed text, since there's nothing to disambiguate.

This keeps the bot equally reliable across all six languages instead of
being great in English and shaky everywhere else.

## Weekday-only booking

Enforced in **two places**:
1. The UI only ever offers Monday–Friday as day options.
2. The server rejects (`400 invalid_day`) any booking request for
   Saturday/Sunday or an unrecognised day string, so the rule holds even if
   someone calls the API directly.

## Design system

Rebuilt with **Tailwind CSS** (CDN build, no bundler needed) using a custom
ocean-blue palette (`deep_twilight`, `bright_teal_blue`, `turquoise_surf`,
`frosted_blue`, `light_cyan`), Poppins for headings and Inter for body/UI
text. Visual features added on top of the original functional version:

- **Step progress bar** in the header (Step X of 6 — translated per language)
  so the patient always knows where they are in the flow.
- **Doctor cards** with a generated initials avatar (gradient per doctor),
  specialty icon, and a "Mon–Fri" availability badge, instead of plain buttons.
- **Typing indicator** (animated dots) before each bot message, so the bot
  feels conversational rather than instant/robotic.
- **Review card** before confirming, and a distinct **success card** with a
  ✅ icon and a **"Add to calendar" button that downloads a real `.ics` file**
  (generated client-side, works with Google/Outlook/Apple calendars — no
  external API needed).
- **Message timestamps**, animated gradient background, custom scrollbar,
  and visible focus states for keyboard/accessibility use.
- **Restart button** in the header to reset the whole flow at any point.
- Respects `prefers-reduced-motion` for anyone who has that OS setting on.

All of this is still plain HTML/CSS/JS — same "no build step" philosophy as
before, just styled through Tailwind's Play CDN instead of hand-written CSS.

## Known browser/language limitations

- Voice **input** (SpeechRecognition) is a Chrome/Edge (Chromium) feature;
  Safari/Firefox support is limited or absent. If the mic isn't available
  for a language, the bot shows a message and the visible text box + choice
  buttons still work fully.
- Voice **output** (speechSynthesis) quality/availability for Sinhala and
  Greek depends on voices installed on the OS — Windows/Chrome on desktop
  generally has the best multilingual voice coverage.
- Recommended for a live demo: **Google Chrome on desktop**, mic permission
  allowed.

## Running it

```bash
npm install
npm start
```

Then open **http://localhost:3000** in Chrome and allow microphone access
when prompted (or just use the text box / buttons — no mic needed).

## Project structure

```
voicebot-doctor-booking/
├── server.js              # Express API + static file server
├── data/
│   ├── doctors.json        # doctor list, specialties, time slots
│   └── bookings.json        # confirmed bookings (created/updated at runtime)
├── public/
│   ├── index.html
│   ├── style.css
│   ├── translations.js     # all 6-language prompt/specialty/weekday text
│   └── app.js               # state machine + speech recognition/synthesis
└── package.json
```

## Extending this

- Swap `data/*.json` for a real database (e.g. MSSQL/Postgres) without
  touching the frontend — only `server.js`'s data access needs to change.
- Add real NLU (e.g. a cloud NLU service) as an *additional* input path
  alongside the numbered menus, rather than replacing them, to keep the
  reliability fallback.
- Add SMS/email confirmation by hooking into the `POST /api/book` success
  path in `server.js`.
