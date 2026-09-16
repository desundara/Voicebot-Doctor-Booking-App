// Translations for the voicebot: prompts, specialties, and weekday names.
// Language codes follow BCP-47 for use with SpeechRecognition / speechSynthesis.
const LANGUAGES = {
  en: { label: "English", speechCode: "en-US" },
  si: { label: "සිංහල (Sinhala)", speechCode: "si-LK" },
  fr: { label: "Français (French)", speechCode: "fr-FR" },
  zh: { label: "中文 (Chinese)", speechCode: "zh-CN" },
  el: { label: "Ελληνικά (Greek)", speechCode: "el-GR" },
  it: { label: "Italiano (Italian)", speechCode: "it-IT" },
};

const SPECIALTIES = {
  generalPhysician: { en: "General Physician", si: "සාමාන්‍ය වෛද්‍ය", fr: "Médecin généraliste", zh: "全科医生", el: "Γενικός Ιατρός", it: "Medico di base" },
  dentist: { en: "Dentist", si: "දන්ත වෛද්‍ය", fr: "Dentiste", zh: "牙医", el: "Οδοντίατρος", it: "Dentista" },
  cardiologist: { en: "Cardiologist", si: "හෘද රෝග විශේෂඥ", fr: "Cardiologue", zh: "心脏科医生", el: "Καρδιολόγος", it: "Cardiologo" },
  pediatrician: { en: "Pediatrician", si: "ළමා රෝග විශේෂඥ", fr: "Pédiatre", zh: "儿科医生", el: "Παιδίατρος", it: "Pediatra" },
  dermatologist: { en: "Dermatologist", si: "චර්ම රෝග විශේෂඥ", fr: "Dermatologue", zh: "皮肤科医生", el: "Δερματολόγος", it: "Dermatologo" },
};

const WEEKDAY_NAMES = {
  monday: { en: "Monday", si: "සඳුදා", fr: "Lundi", zh: "星期一", el: "Δευτέρα", it: "Lunedì" },
  tuesday: { en: "Tuesday", si: "අඟහරුවාදා", fr: "Mardi", zh: "星期二", el: "Τρίτη", it: "Martedì" },
  wednesday: { en: "Wednesday", si: "බදාදා", fr: "Mercredi", zh: "星期三", el: "Τετάρτη", it: "Mercoledì" },
  thursday: { en: "Thursday", si: "බ්‍රහස්පතින්දා", fr: "Jeudi", zh: "星期四", el: "Πέμπτη", it: "Giovedì" },
  friday: { en: "Friday", si: "සිකුරාදා", fr: "Vendredi", zh: "星期五", el: "Παρασκευή", it: "Venerdì" },
};

// Word forms of digits 1-6, used to parse spoken/typed answers to numbered menus.
const NUMBER_WORDS = {
  en: { "1": ["1", "one"], "2": ["2", "two"], "3": ["3", "three"], "4": ["4", "four"], "5": ["5", "five"], "6": ["6", "six"] },
  si: { "1": ["1", "එක", "එකක්"], "2": ["2", "දෙක"], "3": ["3", "තුන"], "4": ["4", "හතර"], "5": ["5", "පහ"], "6": ["6", "හය"] },
  fr: { "1": ["1", "un", "une"], "2": ["2", "deux"], "3": ["3", "trois"], "4": ["4", "quatre"], "5": ["5", "cinq"], "6": ["6", "six"] },
  zh: { "1": ["1", "一"], "2": ["2", "二", "两"], "3": ["3", "三"], "4": ["4", "四"], "5": ["5", "五"], "6": ["6", "六"] },
  el: { "1": ["1", "ένα", "ενα"], "2": ["2", "δύο", "δυο"], "3": ["3", "τρία", "τρια"], "4": ["4", "τέσσερα", "τεσσερα"], "5": ["5", "πέντε", "πεντε"], "6": ["6", "έξι", "εξι"] },
  it: { "1": ["1", "uno"], "2": ["2", "due"], "3": ["3", "tre"], "4": ["4", "quattro"], "5": ["5", "cinque"], "6": ["6", "sei"] },
};

const PROMPTS = {
  chooseLanguage: { en: "Please choose your language.", si: "කරුණාකර ඔබේ භාෂාව තෝරන්න.", fr: "Veuillez choisir votre langue.", zh: "请选择您的语言。", el: "Παρακαλώ επιλέξτε τη γλώσσα σας.", it: "Seleziona la tua lingua." },
  greeting: { en: "Hello! I can help you book an appointment with a doctor, Monday to Friday.", si: "ආයුබෝවන්! මට ඔබට සඳුදා සිට සිකුරාදා දක්වා වෛද්‍යවරයෙකු සමඟ appointment එකක් වෙන් කරගැනීමට උදව් කළ හැක.", fr: "Bonjour ! Je peux vous aider à prendre rendez-vous avec un médecin, du lundi au vendredi.", zh: "您好！我可以帮您预约医生，预约时间为周一至周五。", el: "Γειά σας! Μπορώ να σας βοηθήσω να κλείσετε ραντεβού με γιατρό, Δευτέρα έως Παρασκευή.", it: "Ciao! Posso aiutarti a prenotare un appuntamento con un medico, dal lunedì al venerdì." },
  askSpecialty: { en: "Which doctor would you like to see? Say or press the number.", si: "ඔබට කුමන වෛද්‍යවරයෙකු බලන්නද? අංකය කියන්න හෝ type කරන්න.", fr: "Quel médecin souhaitez-vous consulter ? Dites ou tapez le numéro.", zh: "您想看哪位医生？请说出或输入数字。", el: "Ποιον γιατρό θέλετε να επισκεφθείτε; Πείτε ή πληκτρολογήστε τον αριθμό.", it: "Quale medico vorresti vedere? Di' o digita il numero." },
  confirmDoctor: { en: "You selected {doctor}.", si: "ඔබ තෝරාගත්තේ {doctor}.", fr: "Vous avez choisi {doctor}.", zh: "您选择了 {doctor}。", el: "Επιλέξατε {doctor}.", it: "Hai selezionato {doctor}." },
  askDay: { en: "Please choose a weekday for your appointment. We only book Monday to Friday.", si: "Appointment එකට සතියේ දිනයක් තෝරන්න. අපි වෙන් කරන්නේ සඳුදා සිට සිකුරාදා දක්වා පමණි.", fr: "Veuillez choisir un jour de la semaine. Nous ne réservons que du lundi au vendredi.", zh: "请选择工作日进行预约。我们只接受周一至周五的预约。", el: "Παρακαλώ επιλέξτε καθημερινή. Κλείνουμε ραντεβού μόνο Δευτέρα έως Παρασκευή.", it: "Scegli un giorno feriale per il tuo appuntamento. Prenotiamo solo dal lunedì al venerdì." },
  noSlots: { en: "Sorry, there are no free slots for that doctor on that day. Please choose another day.", si: "සමාවෙන්න, එදින එම වෛද්‍යවරයාට ඉඩක් නැත. වෙනත් දිනයක් තෝරන්න.", fr: "Désolé, il n'y a plus de créneau ce jour-là pour ce médecin. Choisissez un autre jour.", zh: "抱歉，该医生当天没有空余时段，请选择其他日期。", el: "Λυπάμαι, δεν υπάρχουν διαθέσιμες ώρες για αυτόν τον γιατρό εκείνη την ημέρα. Επιλέξτε άλλη ημέρα.", it: "Spiacenti, non ci sono orari liberi per quel medico in quel giorno. Scegli un altro giorno." },
  askTime: { en: "Available times are shown below. Say or press the number.", si: "ලබාගත හැකි වේලාවන් පහත දැක්වේ. අංකය කියන්න හෝ type කරන්න.", fr: "Les horaires disponibles sont ci-dessous. Dites ou tapez le numéro.", zh: "可预约时间如下，请说出或输入数字。", el: "Οι διαθέσιμες ώρες φαίνονται παρακάτω. Πείτε ή πληκτρολογήστε τον αριθμό.", it: "Gli orari disponibili sono mostrati sotto. Di' o digita il numero." },
  askName: { en: "What is your name for the booking?", si: "Booking එක සඳහා ඔබේ නම කුමක්ද?", fr: "Quel est votre nom pour la réservation ?", zh: "请问预约人姓名是？", el: "Ποιο είναι το όνομά σας για την κράτηση;", it: "Qual è il tuo nome per la prenotazione?" },
  confirmBooking: { en: "Please confirm: appointment with {doctor} on {day} at {time} for {name}. Say or press 1 to confirm, 2 to cancel.", si: "තහවුරු කරන්න: {doctor} සමඟ {day} දින {time} ට {name} සඳහා appointment එක. තහවුරු කිරීමට 1 කියන්න, අවලංගු කිරීමට 2 කියන්න.", fr: "Veuillez confirmer : rendez-vous avec {doctor} le {day} à {time} pour {name}. Dites ou tapez 1 pour confirmer, 2 pour annuler.", zh: "请确认：{name} 与 {doctor} 的预约，时间为 {day} {time}。请说 1 确认，2 取消。", el: "Παρακαλώ επιβεβαιώστε: ραντεβού με τον/την {doctor} στις {day} στις {time} για τον/την {name}. Πείτε 1 για επιβεβαίωση, 2 για ακύρωση.", it: "Conferma: appuntamento con {doctor} il {day} alle {time} per {name}. Di' 1 per confermare, 2 per annullare." },
  bookingSuccess: { en: "Your appointment is booked. Confirmation number: {id}.", si: "ඔබේ appointment එක වෙන් කරන ලදී. ස්ථිර කිරීමේ අංකය: {id}.", fr: "Votre rendez-vous est réservé. Numéro de confirmation : {id}.", zh: "您的预约已成功。确认号码：{id}。", el: "Το ραντεβού σας έχει κλειστεί. Αριθμός επιβεβαίωσης: {id}.", it: "Il tuo appuntamento è confermato. Numero di conferma: {id}." },
  bookingCancelled: { en: "Booking cancelled. Let's start again — which doctor would you like?", si: "Booking එක අවලංගු කරන ලදී. නැවත පටන් ගනිමු — කුමන වෛද්‍යවරයෙකුද?", fr: "Réservation annulée. Recommençons — quel médecin souhaitez-vous ?", zh: "预约已取消，我们重新开始——您想看哪位医生？", el: "Η κράτηση ακυρώθηκε. Ας ξεκινήσουμε ξανά — ποιον γιατρό θέλετε;", it: "Prenotazione annullata. Ricominciamo — quale medico desideri?" },
  notUnderstood: { en: "Sorry, I didn't catch that. Please say or press a number from the options.", si: "සමාවෙන්න, මට තේරුණේ නැහැ. කරුණාකර options වලින් අංකයක් කියන්න.", fr: "Désolé, je n'ai pas compris. Veuillez dire ou taper un numéro parmi les options.", zh: "抱歉，我没有听懂，请从选项中说出或输入一个数字。", el: "Λυπάμαι, δεν κατάλαβα. Πείτε ή πληκτρολογήστε έναν αριθμό από τις επιλογές.", it: "Scusa, non ho capito. Di' o digita un numero tra le opzioni." },
  askNameEmpty: { en: "I need a name to complete the booking.", si: "Booking එක සම්පූර්ණ කිරීමට නමක් අවශ්‍යයි.", fr: "J'ai besoin d'un nom pour finaliser la réservation.", zh: "需要姓名才能完成预约。", el: "Χρειάζομαι ένα όνομα για να ολοκληρώσω την κράτηση.", it: "Ho bisogno di un nome per completare la prenotazione." },
  goodbye: { en: "Thank you for using our service. Goodbye!", si: "අපගේ සේවාව භාවිතා කිරීම ගැන ස්තූතියි. ආයුබෝවන්!", fr: "Merci d'avoir utilisé notre service. Au revoir !", zh: "感谢使用我们的服务，再见！", el: "Ευχαριστούμε που χρησιμοποιήσατε την υπηρεσία μας. Αντίο!", it: "Grazie per aver utilizzato il nostro servizio. Arrivederci!" },
  bookAnother: { en: "Say or press 1 to book another appointment, 2 to end.", si: "තවත් appointment එකක් වෙන් කිරීමට 1 කියන්න, අවසන් කිරීමට 2 කියන්න.", fr: "Dites 1 pour un autre rendez-vous, 2 pour terminer.", zh: "说 1 再预约一个，说 2 结束。", el: "Πείτε 1 για άλλο ραντεβού, 2 για τερματισμό.", it: "Di' 1 per un altro appuntamento, 2 per terminare." },
  listening: { en: "Listening…", si: "අහගෙන සිටියි…", fr: "Écoute…", zh: "正在聆听…", el: "Ακούω…", it: "In ascolto…" },
  micNotSupported: { en: "Voice recognition isn't supported in this browser for this language — please type your answer instead.", si: "මෙම browser එකේ මෙම භාෂාව සඳහා voice recognition සහාය නොදක්වයි — කරුණාකර type කරන්න.", fr: "La reconnaissance vocale n'est pas prise en charge pour cette langue ici — veuillez taper votre réponse.", zh: "此浏览器不支持该语言的语音识别，请改用输入。", el: "Η αναγνώριση φωνής δεν υποστηρίζεται για αυτή τη γλώσσα εδώ — παρακαλώ πληκτρολογήστε.", it: "Il riconoscimento vocale non è supportato per questa lingua qui — digita la risposta." },
  calendarGoogleNote: { en: "🌐 Opening Google Calendar in a new tab — click Save there to add the event.", si: "🌐 Google Calendar එක tab අලුතකින් open වෙනවා — එතන Save කරලා event එක add කරගන්න.", fr: "🌐 Ouverture de Google Agenda dans un nouvel onglet — cliquez sur Enregistrer pour ajouter l'événement.", zh: "🌐 正在新标签页中打开 Google 日历——点击“保存”即可添加该事件。", el: "🌐 Άνοιγμα του Google Ημερολογίου σε νέα καρτέλα — πατήστε Αποθήκευση εκεί για να προσθέσετε το συμβάν.", it: "🌐 Apertura di Google Calendar in una nuova scheda — clicca su Salva per aggiungere l'evento." },
  calendarDownloadedNote: { en: "📥 Calendar file downloaded. Open it from your Downloads folder to add this appointment to Outlook, Apple Calendar, or another calendar app.", si: "📥 Calendar file එක download උනා. Downloads folder එකෙන් open කරලා Outlook, Apple Calendar, හෝ වෙනත් calendar app එකකට මේ appointment එක add කරගන්න.", fr: "📥 Fichier calendrier téléchargé. Ouvrez-le depuis votre dossier Téléchargements pour l'ajouter à Outlook, Apple Calendar ou une autre application.", zh: "📥 日历文件已下载。请从下载文件夹中打开它，将此预约添加到 Outlook、Apple 日历或其他日历应用。", el: "📥 Το αρχείο ημερολογίου λήφθηκε. Ανοίξτε το από τον φάκελο Λήψεις για να το προσθέσετε στο Outlook, το Apple Calendar ή άλλη εφαρμογή.", it: "📥 File del calendario scaricato. Aprilo dalla cartella Download per aggiungerlo a Outlook, Apple Calendar o un'altra app." },
};

const STEP_LABELS = {
  1: { en: "Choose your language", si: "භාෂාව තෝරන්න", fr: "Choisissez votre langue", zh: "选择您的语言", el: "Επιλέξτε τη γλώσσα σας", it: "Scegli la tua lingua" },
  2: { en: "Choose your doctor", si: "වෛද්‍යවරයා තෝරන්න", fr: "Choisissez votre médecin", zh: "选择您的医生", el: "Επιλέξτε τον γιατρό σας", it: "Scegli il tuo medico" },
  3: { en: "Choose a weekday", si: "සතියේ දිනයක් තෝරන්න", fr: "Choisissez un jour", zh: "选择工作日", el: "Επιλέξτε ημέρα", it: "Scegli un giorno" },
  4: { en: "Choose a time", si: "වේලාව තෝරන්න", fr: "Choisissez une heure", zh: "选择时间", el: "Επιλέξτε ώρα", it: "Scegli un orario" },
  5: { en: "Your details", si: "ඔබේ විස්තර", fr: "Vos coordonnées", zh: "您的信息", el: "Τα στοιχεία σας", it: "I tuoi dati" },
  6: { en: "Confirm booking", si: "Booking එක තහවුරු කරන්න", fr: "Confirmez la réservation", zh: "确认预约", el: "Επιβεβαίωση κράτησης", it: "Conferma la prenotazione" },
};

function t(key, lang, vars) {
  let str = (PROMPTS[key] && (PROMPTS[key][lang] || PROMPTS[key].en)) || key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(`{${k}}`, vars[k]);
    });
  }
  return str;
}