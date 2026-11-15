(() => {
  "use strict";

  const pages = {
    home: { title: "Home", icon: "⌂", file: "index.html" },
    subjects: { title: "My Subjects", icon: "▤", file: "subjects.html" },
    topics: { title: "Topic Library", icon: "✦", file: "topics.html" },
    timetable: { title: "Weekly Timetable", icon: "▦", file: "timetable.html" },
    careers: { title: "Career Explorer", icon: "✧", file: "careers.html" },
    progress: { title: "My Progress", icon: "◔", file: "progress.html" },
    notes: { title: "My Notes", icon: "✎", file: "notes.html" },
    goals: { title: "Study Goals", icon: "◎", file: "goals.html" },
    about: { title: "About StudySpace", icon: "♡", file: "about.html" }
  };
  const colors = ["lav", "blue", "pink", "green"];
  const defaultState = {
    subjects: [
      { id: "math", name: "Mathematics", emoji: "📐", color: "lav", progress: 0, topics: 12 },
      { id: "biology", name: "Biology", emoji: "🌿", color: "green", progress: 0, topics: 8 },
      { id: "literature", name: "Literature", emoji: "📚", color: "pink", progress: 0, topics: 10 }
    ],
    sessions: [],
    weekStart: null,
    weekDate: null,
    timetableDayFilter: "all",
    goals: [],
    notes: [],
    savedCareers: [],
    careerCompareIds: [],
    careerPreferences: { area: "all", search: "", matchOnly: true, subjects: null },
    topicChecks: [],
    selectedSubjects: [
      { name: "Mathematics", level: "A Level" },
      { name: "Biology", level: "A Level" },
      { name: "Literature", level: "A Level" }
    ],
    selectedTopics: [],
    customSubjects: [],
    customTopics: [],
    favoriteSubjects: [],
    userName: "there"
  };

  const labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const shortLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const root = document.getElementById("app");
  const library = window.StudySpaceLibrary || { subjects: [], levels: {}, topicStyle: () => "Module" };
  const careerCatalog = window.StudySpaceCareerPathways || [];
  let state = loadState();
  let editingSessionId = null;
  let editingNoteId = null;
  const page = document.body.dataset.page || "home";

  function localDate(year, month, day) {
    const date = new Date(0);
    date.setFullYear(year, month, day);
    date.setHours(12, 0, 0, 0);
    return date;
  }
  function parseDate(value) {
    const match = /^(\d{4,})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match || Number(match[1]) < 0) return null;
    const date = localDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
  }
  function dateToISO(date) {
    return `${String(date.getFullYear()).padStart(4, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function startOfWeek(date) {
    const monday = localDate(date.getFullYear(), date.getMonth(), date.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return monday;
  }
  function addDays(date, count) {
    const result = localDate(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() + count);
    return result;
  }
  function parseClockMinutes(value) {
    const match = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(String(value || ""));
    if (!match) return 9 * 60;
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    if (minute > 59) return 9 * 60;
    if (match[3]) {
      if (hour < 1 || hour > 12) return 9 * 60;
      hour = hour % 12 + (match[3].toUpperCase() === "PM" ? 12 : 0);
    }
    return Math.max(0, Math.min(1439, hour * 60 + minute));
  }
  function normalizeState(value) {
    value.subjects = Array.isArray(value.subjects) ? value.subjects : [];
    value.selectedSubjects = Array.isArray(value.selectedSubjects) ? value.selectedSubjects : [];
    value.selectedTopics = Array.isArray(value.selectedTopics) ? value.selectedTopics : [];
    value.customSubjects = Array.isArray(value.customSubjects) ? value.customSubjects : [];
    value.customTopics = Array.isArray(value.customTopics) ? value.customTopics : [];
    value.savedCareers = Array.isArray(value.savedCareers) ? value.savedCareers : [];
    value.careerCompareIds = Array.isArray(value.careerCompareIds) ? value.careerCompareIds : [];
    const savedPreferences = value.careerPreferences && typeof value.careerPreferences === "object" ? value.careerPreferences : {};
    value.careerPreferences = Object.assign({ area: "all", search: "", matchOnly: true, subjects: null }, savedPreferences);
    const availableSubjects = [...new Set((value.selectedSubjects || [])
      .map(subject => String(subject.name || "").trim()).filter(Boolean))];
    value.careerPreferences.subjects = Array.isArray(value.careerPreferences.subjects)
      ? [...new Set(value.careerPreferences.subjects.map(name => String(name).trim()).filter(name => availableSubjects.includes(name)))]
      : availableSubjects;
    value.goals = (Array.isArray(value.goals) ? value.goals : []).filter(goal => goal && typeof goal === "object").map(goal =>
      Object.assign({ type: "weekly" }, goal)
    );
    value.notes = (Array.isArray(value.notes) ? value.notes : []).filter(note => note && typeof note === "object").map(note =>
      Object.assign({}, note, { id: note.id || id() })
    );
    const savedWeek = parseDate(value.weekStart);
    const weekDate = parseDate(value.weekDate) || savedWeek || new Date();
    const weekStart = startOfWeek(weekDate);
    value.weekStart = dateToISO(weekStart);
    value.weekDate = dateToISO(weekDate);
    value.sessions = (Array.isArray(value.sessions) ? value.sessions : []).map(session => {
      const oldDay = Number.isInteger(Number(session.day)) ? Math.max(0, Math.min(6, Number(session.day))) : 0;
      const sessionDate = parseDate(session.date) || addDays(weekStart, oldDay);
      const start = Number.isFinite(Number(session.startMinutes)) ? Math.max(0, Math.min(1439, Number(session.startMinutes))) : parseClockMinutes(session.startTime || session.time);
      const end = Number.isFinite(Number(session.endMinutes)) ? Math.max(start + 1, Math.min(1440, Number(session.endMinutes))) : Math.min(1440, start + 60);
      return Object.assign({}, session, {
        date: dateToISO(sessionDate),
        startMinutes: start,
        endMinutes: end,
        breakMinutes: Math.max(0, Number(session.breakMinutes) || 0),
        description: String(session.description || "")
      });
    });
    return value;
  }
  function loadState() {
    try {
      const saved = localStorage.getItem("studyspace-v1");
      if (!saved) return normalizeState(structuredCloneSafe(defaultState));
      const parsed = JSON.parse(saved);
      const merged = Object.assign(structuredCloneSafe(defaultState), parsed);
      if (!Array.isArray(parsed.selectedSubjects)) {
        merged.selectedSubjects = (merged.subjects || []).map(subject => {
          const definition = findLibrarySubject(subject.name);
          return { name: subject.name, level: preferredLevel(definition) };
        });
      }
      return normalizeState(merged);
    } catch (error) {
      console.error("StudySpace could not load saved data.", error);
      return normalizeState(structuredCloneSafe(defaultState));
    }
  }
  function structuredCloneSafe(value) { return JSON.parse(JSON.stringify(value)); }
  function persist() {
    try {
      localStorage.setItem("studyspace-v1", JSON.stringify(state));
      return true;
    } catch (error) {
      console.error("StudySpace could not save your changes.", error);
      toast("Couldn't save changes. Check your browser storage settings.");
      return false;
    }
  }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }
  function todayString() {
    return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date());
  }
  function formatDate(date, options) {
    return new Intl.DateTimeFormat("en-GB", options).format(date);
  }
  function formatClock(minutes) {
    const safeMinutes = Math.max(0, Math.min(1440, Number(minutes) || 0));
    if (safeMinutes === 1440) return "12:00 AM";
    const hour24 = Math.floor(safeMinutes / 60);
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${String(safeMinutes % 60).padStart(2, "0")} ${hour24 < 12 ? "AM" : "PM"}`;
  }
  function formatTimeInput(minutes) {
    const safeMinutes = Math.max(0, Math.min(1440, Number(minutes) || 0)) % 1440;
    return `${String(Math.floor(safeMinutes / 60)).padStart(2, "0")}:${String(safeMinutes % 60).padStart(2, "0")}`;
  }
  function parseTimeInput(value, endTime) {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || ""));
    if (!match) return null;
    const minutes = Number(match[1]) * 60 + Number(match[2]);
    return endTime && minutes === 0 ? 1440 : minutes;
  }
  function sessionStart(session) { return Number.isFinite(Number(session.startMinutes)) ? Number(session.startMinutes) : parseClockMinutes(session.startTime || session.time); }
  function sessionEnd(session) { return Number.isFinite(Number(session.endMinutes)) ? Number(session.endMinutes) : Math.min(1440, sessionStart(session) + 60); }
  function sessionRange(session) { return `${formatClock(sessionStart(session))} – ${formatClock(sessionEnd(session))}`; }
  function durationLabel(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return `${remainder} min`;
    return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
  }
  function completedSessionCount() {
    return state.sessions.filter(session => session && session.done === true).length;
  }
  function completedTopicCount() {
    return state.selectedTopics.filter(topic => topic && topic.completed === true).length;
  }
  function subjectTaskProgress(subjectName) {
    const topics = state.selectedTopics.filter(topic => topic && topic.subject === subjectName);
    const sessions = state.sessions.filter(session => session && session.subject === subjectName);
    const total = topics.length + sessions.length;
    if (!total) return 0;
    const completed = topics.filter(topic => topic.completed === true).length +
      sessions.filter(session => session.done === true).length;
    return Math.round(completed / total * 100);
  }
  function averageTaskProgress() {
    const topics = state.selectedTopics.filter(topic => topic);
    const sessions = state.sessions.filter(session => session);
    const total = topics.length + sessions.length;
    if (!total) return 0;
    const completed = topics.filter(topic => topic.completed === true).length +
      sessions.filter(session => session.done === true).length;
    return Math.round(completed / total * 100);
  }
  function currentWeekSessions() {
    const monday = startOfWeek(new Date());
    const sunday = dateToISO(addDays(monday, 6));
    const mondayISO = dateToISO(monday);
    return state.sessions.filter(session => session && session.date >= mondayISO && session.date <= sunday);
  }
  function currentWeekCompletedSessions() {
    const weekStart = startOfWeek(new Date());
    const monday = dateToISO(weekStart);
    const sunday = dateToISO(addDays(weekStart, 6));
    return state.sessions.filter(session => session && session.done === true &&
      parseDate(session.completedAt) && session.completedAt >= monday && session.completedAt <= sunday);
  }
  function completedStudyDates() {
    return new Set([
      ...state.sessions.filter(session => session && session.done === true && parseDate(session.completedAt)).map(session => session.completedAt),
      ...state.selectedTopics.filter(topic => topic && topic.completed === true && parseDate(topic.completedAt)).map(topic => topic.completedAt)
    ]);
  }
  function currentStudyStreak() {
    const dates = completedStudyDates();
    let cursor = localDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    if (!dates.has(dateToISO(cursor))) cursor = addDays(cursor, -1);
    let streak = 0;
    while (dates.has(dateToISO(cursor))) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }
  function goalIsComplete(goal) {
    if (goal.type === "topic" && goal.topicKey) {
      return state.selectedTopics.some(topic => topicKey(topic.subject, topic.level, topic.title) === goal.topicKey && topic.completed === true);
    }
    if (goal.type === "daily" || goal.type === "weekly") {
      const completedAt = parseDate(goal.completedAt);
      if (!completedAt) return false;
      if (goal.type === "daily") return goal.completedAt === dateToISO(new Date());
      const monday = dateToISO(startOfWeek(new Date()));
      const sunday = dateToISO(addDays(startOfWeek(new Date()), 6));
      return goal.completedAt >= monday && goal.completedAt <= sunday;
    }
    return goal.done === true;
  }
  function selectedSubjectNames() {
    return [...new Set((state.selectedSubjects || [])
      .map(subject => String(subject && subject.name || "").trim()).filter(Boolean))];
  }
  function syncCareerPreferencesSubjects() {
    const names = selectedSubjectNames();
    state.careerPreferences.subjects = names;
    return names;
  }
  function currentCareerMatchSubjects() {
    if (Array.isArray(state.careerPreferences.subjects)) {
      return state.careerPreferences.subjects;
    }
    return selectedSubjectNames();
  }
  const careerSubjectAliasGroups = [
    ["mathematics", "math", "maths", "further mathematics", "further maths", "applied mathematics"],
    ["biology", "biological science", "biological sciences", "life science", "life sciences"],
    ["chemistry", "chemical science", "chemical sciences"],
    ["physics", "physical science", "physical sciences"],
    ["computer science", "computing", "computer studies", "information technology", "it"],
    ["english", "english language", "english literature", "literature", "literary studies"],
    ["business", "business studies", "business administration"],
    ["political science", "politics"],
    ["history", "world history"],
    ["geography", "geographical studies"],
    ["statistics", "stats"],
    ["law", "legal studies"],
    ["art", "visual arts"],
    ["design technology", "design and technology"],
    ["media studies", "media"],
    ["communication studies", "communications"],
    ["languages", "modern languages", "foreign languages"],
    ["psychology", "behavioural science", "behavioral science"]
  ];
  function normalizeCareerSubject(value) {
    return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  }
  function pathwaySubjectMatchDetails(pathway, names) {
    const selectedNames = [];
    const normalizedNames = new Set();
    (names || []).forEach(name => {
      const value = String(name).trim();
      const normalized = normalizeCareerSubject(value);
      if (normalized && !normalizedNames.has(normalized)) {
        selectedNames.push(value);
        normalizedNames.add(normalized);
      }
    });
    const listedSubjects = pathway.subjects || [];
    const usedSubjects = new Set();
    const matches = selectedNames.flatMap(name => {
      const subjectIndex = listedSubjects.findIndex((subject, index) =>
        !usedSubjects.has(index) && normalizeCareerSubject(subject) === normalizeCareerSubject(name)
      );
      if (subjectIndex < 0) return [];
      usedSubjects.add(subjectIndex);
      return [{ name, subject: listedSubjects[subjectIndex], strength: 3 }];
    });
    return {
      matches,
      unmatched: selectedNames.filter(name => !matches.some(match => match.name === name)),
      score: matches.reduce((total, match) => total + match.strength, 0)
    };
  }
  function pathwaySubjectMatches(pathway, names) {
    return pathwaySubjectMatchDetails(pathway, names).matches.length;
  }
  function pathwayMatchReason(pathway) {
    const names = currentCareerMatchSubjects();
    const result = pathwaySubjectMatchDetails(pathway, names);
    const connections = result.matches.map(match =>
      match.subject === "pathway details" ? `${match.name} (mentioned in the pathway)` : `${match.name} (listed as ${match.subject})`
    );
    if (result.unmatched.length) {
      return `Partial connection: ${connections.join("; ") || "no direct subject link"}. Not directly represented: ${result.unmatched.join(", ")}. Check the course prerequisites before considering this option.`;
    }
    return `Connects all selected subjects: ${connections.join("; ")}.`;
  }
  function findLibrarySubject(name) {
    return library.subjects.find(subject => subject.name.toLowerCase() === String(name).toLowerCase());
  }
  function preferredLevel(subject) {
    if (!subject) return "A Level";
    return subject.levels.includes("A Level") ? "A Level" : subject.levels[0];
  }
  function allLibrarySubjects() {
    const subjects = library.subjects.slice();
    state.customSubjects.forEach(subject => {
      if (!subjects.some(item => item.name.toLowerCase() === subject.name.toLowerCase())) subjects.push(subject);
    });
    state.subjects.forEach(subject => {
      if (!subjects.some(item => item.name.toLowerCase() === subject.name.toLowerCase())) {
        subjects.push({ name: subject.name, emoji: subject.emoji || "📖", category: "custom", levels: ["O Level", "IGCSE", "AS Level", "A Level", "University", "Postgraduate", "PhD / Research"], topics: ["Foundations and key concepts", "Core terminology and methods", "Guided practice and application", "Evidence, analysis and reflection", "Independent project"] });
      }
    });
    return subjects;
  }
  function selectedSubject(name) {
    return state.selectedSubjects.find(subject => subject.name.toLowerCase() === name.toLowerCase());
  }
  function levelTopics(subject, level) {
    if (level === "PhD / Research") {
      return [
        "Research area: literature mapping and open questions",
        "Research area: paradigms, methods and study design",
        "Research area: evidence, data and reproducibility",
        "Research area: current debates and interdisciplinary links",
        "Research area: ethics, impact and responsible practice",
        "Research area: critical synthesis and dissemination"
      ];
    }
    if (level === "University" || level === "Postgraduate") {
      return subject.topics.map(topic => `${library.topicStyle(level)}: ${topic}`);
    }
    return subject.topics.slice();
  }
  function topicKey(subject, level, title) {
    return `${subject.toLowerCase()}|${level}|${title.toLowerCase()}`;
  }
  function topicCompletionKey(topic) { return topicKey(topic.subject, topic.level, topic.title); }
  function topicSelected(topic) {
    const key = topicKey(topic.subject, topic.level, topic.title);
    return state.selectedTopics.some(item => topicKey(item.subject, item.level, item.title) === key);
  }
  function topicCompleted(topic) {
    const key = topicCompletionKey(topic);
    return state.selectedTopics.some(item => topicKey(item.subject, item.level, item.title) === key && item.completed);
  }
  function illustration(subject, index) {
    const colors = [["#eeeaff", "#b8aaf3", "#7767ce"], ["#e8f5ff", "#a9d8f2", "#639fc2"], ["#fff0f6", "#f0bed5", "#bf7e9c"], ["#edf8ef", "#b5dcbf", "#679975"]];
    const palette = colors[index % colors.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 150"><rect width="240" height="150" rx="22" fill="${palette[0]}"/><circle cx="192" cy="33" r="20" fill="#fff" opacity=".58"/><circle cx="34" cy="116" r="12" fill="${palette[1]}" opacity=".35"/><path d="M25 35c14-13 30-12 40 1M178 108c13-12 27-12 39-2" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".72"/><rect x="61" y="28" width="118" height="96" rx="23" fill="#fff" opacity=".77"/><circle cx="120" cy="75" r="38" fill="${palette[1]}" opacity=".48"/><text x="120" y="91" text-anchor="middle" font-size="46" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${subject.emoji}</text><path d="M74 116h92" stroke="${palette[2]}" stroke-width="3" stroke-linecap="round" opacity=".36"/></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  function header() {
    const nav = Object.keys(pages).map(key => `<a class="nav-link ${key === page ? "active" : ""}" href="${pages[key].file}" ${key === page ? 'aria-current="page"' : ""}><span class="nav-icon">${pages[key].icon}</span>${pages[key].title}</a>`).join("");
    return `<div class="app-shell">
      <aside class="sidebar" aria-label="Main navigation">
        <a class="brand" href="index.html"><span class="brand-mark">✿</span><span><span class="brand-name">StudySpace</span><span class="brand-tag">a little room to bloom</span></span></a>
        <div class="nav-label">Your study space</div><nav class="nav-list">${nav}</nav>
        <div class="side-bottom"><div class="focus-card"><span class="focus-emoji">🌼</span><h3>One step at a time</h3><p>Little by little, a little becomes a lot.</p><a class="button small soft" href="goals.html">See my goals <span aria-hidden="true">→</span></a></div><div class="side-footer">Made with care for curious minds ✨</div></div>
      </aside>
      <button class="overlay" type="button" aria-label="Close menu"></button>
      <div class="main-area">
        <header class="topbar"><div class="top-left"><button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false">☰</button><a class="mobile-brand" href="index.html"><span class="brand-mark">✿</span>StudySpace</a><div class="crumb">StudySpace&nbsp; / &nbsp;<strong>${pages[page].title}</strong></div></div><div class="top-actions"><span class="date-pill">☀ &nbsp;${todayString()}</span><div class="avatar" title="Your study space">S</div></div></header>
        <main class="content" id="main-content">${pageContent()}</main>
        <footer class="footer"><span>© ${new Date().getFullYear()} StudySpace · A little room to bloom.</span><a href="about.html">Made for curious minds ♡</a></footer>
      </div>
    </div>`;
  }
  function pageContent() {
    const renderers = { home: homePage, subjects: subjectsPage, topics: topicsPage, timetable: timetablePage, careers: careersPage, progress: progressPage, notes: notesPage, goals: goalsPage, about: aboutPage };
    return (renderers[page] || homePage)();
  }
  function heading(kicker, title, description, action) {
    return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="subheading">${description}</p></div>${action || ""}</div>`;
  }
  function subjectOptions() {
    const list = state.selectedSubjects.map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("");
    return list || `<option value="Personal study">Personal study</option>`;
  }
  function timetableTopicOptions(subjectName) {
    const topics = state.selectedTopics.filter(topic => topic.subject === subjectName);
    const choices = topics.map(topic => `<option value="${esc(topicKey(topic.subject, topic.level, topic.title))}">${esc(topic.title)}${topic.completed ? " · completed" : ""}</option>`).join("");
    return `<option value="">Choose a selected topic…</option>${choices}<option value="__custom__">Write a different topic…</option>`;
  }
  function progressBar(subject, index) {
    const progress = subjectTaskProgress(subject.name);
    return `<div class="subject-row"><div class="row-between"><strong>${esc(subject.emoji)} &nbsp;${esc(subject.name)}</strong><span>${progress}%</span></div><div class="progress-track"><div class="progress-fill ${colors[index % colors.length]}" style="width:${progress}%"></div></div></div>`;
  }
  function sessionMarkup(session, showDay) {
    const date = parseDate(session.date);
    const day = date ? formatDate(date, { weekday: "short" }) : shortLabels[session.day || 0];
    return `<div class="session"><div class="session-time">${showDay ? `${day} · ` : ""}${esc(sessionRange(session))}</div><div><h3>${esc(session.subject)}</h3><p>${esc(session.topic)}</p></div><button class="session-mark ${session.done ? "done" : ""}" type="button" data-action="toggle-session" data-id="${esc(session.id)}" aria-label="${session.done ? "Mark as planned" : "Mark session complete"}" title="${session.done ? "Completed — click to undo" : "Click when complete"}"></button></div>`;
  }
  function homePage() {
    const completed = completedSessionCount();
    const subjects = state.subjects.slice(0, 3).map(progressBar).join("");
    const today = dateToISO(new Date());
    const todayMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const todaySessions = state.sessions.filter(s => s.date === today).sort((a, b) => sessionStart(a) - sessionStart(b));
    const sessions = state.sessions.filter(s => s.date > today || (s.date === today && sessionStart(s) > todayMinutes))
      .slice().sort((a, b) => a.date.localeCompare(b.date) || sessionStart(a) - sessionStart(b)).slice(0, 3);
    const avg = averageTaskProgress();
    return `<section class="hero"><div class="hero-copy"><div class="eyebrow">YOUR LITTLE CORNER OF CALM</div><h1>A fresh page, a <span>bright start.</span></h1><p>Welcome back, ${esc(state.userName)}! Make a little space for your big ideas. You've got this.</p><div class="button-row"><a class="button" href="timetable.html">✦ &nbsp;Start planning</a><a class="button secondary" href="subjects.html">Explore subjects</a></div></div><div class="hero-art" aria-label="Illustration of colorful books and a growing plant"><div class="art-sun"></div><span class="spark one">✦</span><span class="spark two">✳</span><div class="book-stack"><div class="book book-one"><span class="book-label"></span></div><div class="book book-two"><span class="book-label"></span></div><div class="book book-three"><span class="book-label"></span></div></div><span class="plant">🌱</span></div></section>
      <div class="grid four" style="margin-top:19px"><div class="card stat-card"><span class="stat-icon lav">📚</span><div><div class="stat-number">${state.subjects.length}</div><div class="stat-label">Subjects in bloom</div></div></div><div class="card stat-card"><span class="stat-icon blue">⏰</span><div><div class="stat-number">${state.sessions.filter(s => !s.done).length}</div><div class="stat-label">Planned sessions</div></div></div><div class="card stat-card"><span class="stat-icon pink">🌱</span><div><div class="stat-number">${avg}%</div><div class="stat-label">Average task completion</div></div></div><div class="card stat-card"><span class="stat-icon cream">✨</span><div><div class="stat-number">${completed}</div><div class="stat-label">Sessions completed</div></div></div></div>
      <div class="dashboard-grid"><section class="card"><div class="card-title"><h2>Today's study overview</h2><a href="timetable.html">Full timetable →</a></div><div class="session-list">${todaySessions.length ? todaySessions.map(s => sessionMarkup(s, false)).join("") : emptyState("☀️", "A little breathing room today. Add a session whenever you're ready.")}</div></section>
      <section class="card"><div class="card-title"><h2>Your progress</h2><a href="progress.html">See all →</a></div>${subjects || emptyState("📚", "Add a subject to start tracking your progress.")}<div class="week-summary" style="margin-top:17px"><div class="ring" style="--value:${avg}%"><span>${avg}%</span></div><div class="week-copy"><strong>Every little bit counts.</strong><p>Your average subject progress. Keep showing up for yourself!</p></div></div></section></div>
      <section class="card" style="margin-top:19px"><div class="card-title"><h2>Coming up in your week</h2><a href="timetable.html">Full timetable →</a></div><div class="session-list">${sessions.length ? sessions.map(s => sessionMarkup(s, true)).join("") : emptyState("📆", "Your schedule is open. Add a study session to get started.")}</div></section>
      <div class="section-head"><div><h2>Your space, your way</h2><p>Everything you need for a lovely study session.</p></div></div><div class="quick-grid">${quickLink("📅", "Plan your week", "Build a gentle routine", "timetable.html")}${quickLink("📝", "Capture a thought", "Keep notes in one place", "notes.html")}${quickLink("🎯", "Set an intention", "Small goals, big wins", "goals.html")}${quickLink("✨", "Dream a little", "Explore future paths", "careers.html")}</div>`;
  }
  function quickLink(icon, title, desc, href) { return `<a class="quick-link" href="${href}"><span class="quick-emoji">${icon}</span><strong>${title}</strong><small>${desc}</small></a>`; }
  function emptyState(icon, text) { return `<div class="empty-state"><span>${icon}</span>${esc(text)}</div>`; }

  function subjectsPage() {
    const subjects = allLibrarySubjects();
    const categories = [...new Set(subjects.map(subject => subject.category))];
    const categoryOptions = ["All subjects", ...categories].map(category => `<option value="${esc(category)}">${category === "All subjects" ? category : esc(category.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()))}</option>`).join("");
    const cards = subjects.map((subject, index) => {
      const selected = selectedSubject(subject.name);
      const favorite = state.favoriteSubjects.includes(subject.name);
      return `<article class="card subject-card" data-subject-card data-name="${esc(subject.name.toLowerCase())}" data-category="${esc(subject.category)}"><img class="subject-illustration" src="${illustration(subject, index)}" alt="${esc(subject.name)} illustration"><button class="favorite-button ${favorite ? "saved" : ""}" type="button" data-action="favorite-subject" data-name="${esc(subject.name)}" aria-label="${favorite ? "Remove" : "Add"} ${esc(subject.name)} ${favorite ? "from" : "to"} favorites">${favorite ? "♥" : "♡"}</button><div class="subject-card-copy"><span class="tag ${index % 3 === 1 ? "blue" : index % 3 === 2 ? "pink" : ""}">${esc(subject.category.replace(/([A-Z])/g, " $1"))}</span><h3>${esc(subject.name)}</h3><p>${subject.topics.length} starter topics · ${subject.levels.length} academic levels</p><button class="button small ${selected ? "soft" : "secondary"}" type="button" data-action="select-subject" data-name="${esc(subject.name)}">${selected ? "✓ Added to my subjects" : "＋ Select subject"}</button></div></article>`;
    }).join("");
    const selectedCards = state.selectedSubjects.map((subject, index) => {
      const definition = subjects.find(item => item.name === subject.name);
      const options = (definition ? definition.levels : levelsFallback()).map(level => `<option value="${esc(level)}" ${level === subject.level ? "selected" : ""}>${esc(level)}</option>`).join("");
      return `<div class="selected-subject-row"><span class="stat-icon ${colors[index % colors.length]}">${definition ? definition.emoji : "📘"}</span><strong>${esc(subject.name)}</strong><select class="select selected-level" data-action="subject-level" data-name="${esc(subject.name)}" aria-label="Academic level for ${esc(subject.name)}">${options}</select><button class="button small danger" type="button" data-action="remove-subject" data-name="${esc(subject.name)}">Remove</button></div>`;
    }).join("");
    return `${heading("A LITTLE OF EVERYTHING", "My Subjects", "Choose what you're learning, pick an academic level, and keep your favorite subjects close.")}
      <section class="card selected-subjects"><div class="card-title"><div><h2>My selected subjects</h2><p class="subheading">Your levels shape the topics in your library.</p></div><span class="tag">${state.selectedSubjects.length} selected</span></div><div class="selected-subject-list">${selectedCards || emptyState("📚", "Choose a subject below to get started.")}</div></section>
      <div class="section-head"><div><h2>Explore the subject library</h2><p>${subjects.length} subjects to choose from, with room for your own.</p></div></div>
      <div class="library-tools"><input class="input search-input" id="subject-search" type="search" placeholder="⌕  Search subjects..." aria-label="Search subjects"><select class="select" id="subject-category" aria-label="Filter subjects by category">${categoryOptions}</select></div>
      <div class="grid three subject-library-grid" id="subject-grid">${cards}</div><div class="empty-state" id="subject-empty" hidden><span>🔎</span>No subjects match your search. Try another word or category.</div>
      <div class="section-head" id="add-subject"><div><h2>Make room for your own subject</h2><p>Add a class, hobby, or research area to your library.</p></div></div>
      <form class="card form-grid" data-form="library-subject"><label class="field">Subject name<input class="input" name="name" required maxlength="55" placeholder="e.g. Robotics"></label><label class="field">Illustration emoji<input class="input" name="emoji" maxlength="4" placeholder="🤖" value="📖"></label><div class="field full"><button class="button" type="submit">Add my subject ✨</button></div></form>`;
  }
  function topicsPage() {
    const selected = state.selectedSubjects;
    const subjectOptions = [`<option value="__all__">All my subjects</option>`, ...selected.map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`)].join("");
    const allLevels = [...new Set(selected.flatMap(s => {
      const definition = allLibrarySubjects().find(item => item.name === s.name);
      return definition ? definition.levels : [];
    }))];
    const levelOptions = [`<option value="__mine__">My subject levels</option>`, ...allLevels.map(level => `<option value="${esc(level)}">${esc(level)}</option>`)].join("");
    const cards = renderTopicCards(selected);
    const chosen = state.selectedTopics.map(topic => `<div class="selected-topic-row ${topic.completed ? "completed" : ""}"><span class="topic-status-dot">${topic.completed ? "✓" : "•"}</span><div class="selected-topic-copy"><strong>${esc(topic.title)}</strong><span>${esc(topic.subject)} · ${esc(topic.level)}</span></div><button class="button small soft" type="button" data-action="topic-status" data-id="${esc(topicKey(topic.subject, topic.level, topic.title))}">${topic.completed ? "Mark pending" : "Mark completed"}</button><button class="button small danger" type="button" data-action="remove-topic" data-id="${esc(topicKey(topic.subject, topic.level, topic.title))}" aria-label="Remove topic">×</button></div>`).join("");
    const topicLevels = selected.length ? selected.map(s => {
      const def = allLibrarySubjects().find(item => item.name === s.name);
      return def ? `${esc(s.name)} (${esc(s.level)})` : esc(s.name);
    }).join(", ") : "No subjects selected";
    return `${heading("A WORLD OF WONDER", "Topic Library", "Explore level-aware topics, pick more than one, and keep your next learning steps together.")}
      <div class="card topic-library-intro"><span class="stat-icon lav">✦</span><div><strong>Topics for your study plan</strong><p>Showing topics for ${topicLevels}. University modules and PhD research areas are starting points to adapt to your own programme.</p></div><a class="button small soft" href="subjects.html">Choose subjects →</a></div>
      <div class="topic-tools"><input class="input search-input" id="topic-search" type="search" placeholder="⌕  Search subjects or topics..." aria-label="Search subjects or topics"><select class="select" id="topic-filter" aria-label="Filter by subject">${subjectOptions}</select><select class="select" id="topic-level-filter" aria-label="Filter by academic level">${levelOptions}</select></div>
      <div class="topic-section-heading"><h2>Explore topics</h2><span class="tag">${cards.length} available</span></div><div class="grid three" id="topic-grid">${cards.join("")}</div><div class="empty-state" id="topic-empty" ${cards.length ? "hidden" : ""}><span>🔎</span>${selected.length ? "No topics match. Try another subject or level." : "Select subjects first to fill your topic library."} <a class="button small soft" href="subjects.html">Browse subjects</a></div>
      <section class="card selected-topics-section"><div class="card-title"><div><h2>My selected topics</h2><p class="subheading">These are ready to add to your weekly timetable.</p></div><span class="tag">${state.selectedTopics.length} selected</span></div><div class="selected-topic-list">${chosen || emptyState("🪴", "Select topics above and they will be collected here.")}</div></section>
      <div class="section-head" id="add-topic"><div><h2>Add a custom topic</h2><p>Make a topic of your own and add it straight to your selection.</p></div></div>
      <form class="card form-grid" data-form="library-topic"><label class="field">Subject<select class="select" name="subject" required>${selected.map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("")}</select></label><label class="field">Topic title<input class="input" name="title" required maxlength="90" placeholder="e.g. A question I want to explore"></label><div class="field full"><button class="button" type="submit" ${selected.length ? "" : "disabled"}>Add custom topic ✨</button></div></form>`;
  }
  function levelsFallback() {
    return ["O Level", "IGCSE", "AS Level", "A Level", "University", "Postgraduate", "PhD / Research"];
  }
  function renderTopicCards(selected, subjectFilter, levelFilter, search) {
    const catalog = allLibrarySubjects();
    const subjects = subjectFilter && subjectFilter !== "__all__" ? selected.filter(s => s.name === subjectFilter) : selected;
    const allTopics = subjects.flatMap(selection => {
      const subject = catalog.find(item => item.name === selection.name);
      if (!subject) return [];
      const level = levelFilter && levelFilter !== "__mine__" ? levelFilter : selection.level;
      if (!subject.levels.includes(level)) return [];
      return levelTopics(subject, level).map(title => ({ subject: subject.name, level, title }));
    });
    const additional = state.customTopics.filter(topic => {
      const selection = selectedSubject(topic.subject);
      if (!selection || (subjectFilter && subjectFilter !== "__all__" && subjectFilter !== topic.subject)) return false;
      return !levelFilter || levelFilter === "__mine__" ? topic.level === selection.level : topic.level === levelFilter;
    });
    const uniqueTopics = allTopics.concat(additional).filter((topic, index, list) =>
      list.findIndex(other => topicKey(other.subject, other.level, other.title) === topicKey(topic.subject, topic.level, topic.title)) === index
    );
    return uniqueTopics.filter(topic => !search || `${topic.subject} ${topic.title}`.toLowerCase().includes(search)).map((topic, index) => {
      const chosen = topicSelected(topic);
      const done = topicCompleted(topic);
      const subject = catalog.find(item => item.name === topic.subject);
      return `<article class="card topic-card library-topic-card" data-topic-card><div class="topic-card-top"><span class="topic-icon">${subject ? subject.emoji : "📘"}</span><span class="tag ${index % 3 === 1 ? "blue" : index % 3 === 2 ? "pink" : ""}">${esc(topic.level)}</span></div><span class="topic-subject">${esc(topic.subject)}</span><h3>${esc(topic.title)}</h3><p>${topic.level === "PhD / Research" ? "A flexible research-area starting point; tailor it to your project and supervisor." : topic.level === "University" || topic.level === "Postgraduate" ? "A module-sized starting point to adapt to your programme." : "A starter topic to explore at your own pace."}</p><button class="button small ${chosen ? "soft" : "secondary"}" data-action="toggle-topic" data-subject="${esc(topic.subject)}" data-level="${esc(topic.level)}" data-title="${esc(topic.title)}" type="button">${chosen ? (done ? "✓ Selected · completed" : "✓ Selected") : "＋ Select topic"}</button></article>`;
    });
  }
  function refreshTopicLibrary() {
    const search = (document.getElementById("topic-search")?.value || "").trim().toLowerCase();
    const subject = document.getElementById("topic-filter")?.value || "__all__";
    const level = document.getElementById("topic-level-filter")?.value || "__mine__";
    const cards = renderTopicCards(state.selectedSubjects, subject, level, search);
    const grid = document.getElementById("topic-grid");
    if (grid) grid.innerHTML = cards.join("");
    const empty = document.getElementById("topic-empty");
    if (empty) {
      empty.hidden = cards.length > 0;
      if (!state.selectedSubjects.length) empty.innerHTML = `<span>📚</span>Select subjects first to fill your topic library. <a class="button small soft" href="subjects.html">Browse subjects</a>`;
      else empty.innerHTML = `<span>🔎</span>No topics match. Try another subject or level.`;
    }
    const count = document.querySelector(".topic-section-heading .tag");
    if (count) count.textContent = `${cards.length} available`;
  }
  function filterSubjects() {
    const search = (document.getElementById("subject-search")?.value || "").trim().toLowerCase();
    const category = document.getElementById("subject-category")?.value || "All subjects";
    let visible = 0;
    document.querySelectorAll("[data-subject-card]").forEach(card => {
      const show = card.dataset.name.includes(search) && (category === "All subjects" || card.dataset.category === category);
      card.hidden = !show;
      if (show) visible++;
    });
    const empty = document.getElementById("subject-empty");
    if (empty) empty.hidden = visible > 0;
  }
  function timetablePage() {
    const monday = parseDate(state.weekStart) || startOfWeek(new Date());
    const selectedDate = parseDate(state.weekDate) || monday;
    const weekDates = labels.map((_, index) => addDays(monday, index));
    const weekSessions = state.sessions.filter(session => session.date >= dateToISO(monday) && session.date <= dateToISO(weekDates[6]))
      .sort((a, b) => a.date.localeCompare(b.date) || sessionStart(a) - sessionStart(b));
    const completed = weekSessions.filter(session => session.done).length;
    const studyMinutes = weekSessions.reduce((total, session) => total + Math.max(0, sessionEnd(session) - sessionStart(session) - session.breakMinutes), 0);
    const today = dateToISO(new Date());
    const dayFilter = state.timetableDayFilter || "all";
    const selectedDay = dayFilter === "all" || weekDates.some(date => dateToISO(date) === dayFilter) ? dayFilter : "all";
    const monthOptions = Array.from({ length: 12 }, (_, month) => `<option value="${month}" ${month === selectedDate.getMonth() ? "selected" : ""}>${formatDate(localDate(2020, month, 1), { month: "long" })}</option>`).join("");
    const filterOptions = [`<option value="all" ${selectedDay === "all" ? "selected" : ""}>Whole week</option>`, ...weekDates.map((date, index) => `<option value="${dateToISO(date)}" ${selectedDay === dateToISO(date) ? "selected" : ""}>${labels[index]}</option>`)].join("");
    const dayCards = weekDates.map((date, index) => {
      const iso = dateToISO(date);
      if (selectedDay !== "all" && selectedDay !== iso) return "";
      const sessions = weekSessions.filter(session => session.date === iso);
      const sessionCards = sessions.map(session => {
        const palette = colors[Math.max(0, state.subjects.findIndex(subject => subject.name === session.subject)) % colors.length];
        const duration = sessionEnd(session) - sessionStart(session);
        return `<article class="planned-session ${palette} ${session.done ? "is-complete" : ""}"><div class="planned-session-time">${esc(sessionRange(session))}</div><h4>${esc(session.subject)}</h4><p class="planned-session-topic">${esc(session.topic)}</p>${session.description ? `<p class="planned-session-description">${esc(session.description)}</p>` : ""}<div class="session-meta">${session.breakMinutes ? `<span class="break-indicator">☕ Break · ${session.breakMinutes} min</span>` : ""}<span>${durationLabel(duration)} session</span></div><div class="session-controls"><button class="button small ${session.done ? "soft" : "secondary"}" type="button" data-action="toggle-session" data-id="${esc(session.id)}">${session.done ? "Mark pending" : "Mark completed"}</button><button class="button small secondary" type="button" data-action="edit-session" data-id="${esc(session.id)}" aria-label="Edit ${esc(session.topic)}">Edit</button><button class="button small danger" type="button" data-action="delete-session" data-id="${esc(session.id)}" aria-label="Delete ${esc(session.topic)}">Delete</button></div></article>`;
      }).join("");
      return `<section class="day-card day-tone-${index % 4} ${sessions.length ? "has-sessions" : "no-sessions"} ${iso === today ? "is-today" : ""} ${iso === dateToISO(selectedDate) ? "is-selected" : ""}"><header class="day-card-heading"><div><h3>${labels[index]}</h3><p>${formatDate(date, { day: "numeric", month: "long", year: "numeric" })}</p></div><div class="day-card-badges">${iso === today ? `<span class="today-badge">Today</span>` : ""}${iso === dateToISO(selectedDate) ? `<span class="selected-day-badge">Selected</span>` : ""}</div></header>${sessions.length ? `<p class="day-session-count">${sessions.length} session${sessions.length === 1 ? "" : "s"}</p>` : ""}<div class="day-session-list">${sessionCards || `<div class="day-empty">A little breathing room 🌱</div>`}</div></section>`;
    }).join("");
    const initialDate = dateToISO(selectedDate);
    const currentDayIndex = Math.max(0, weekDates.findIndex(date => dateToISO(date) === initialDate));
    const subjectSelect = subjectOptions();
    const firstSubject = state.selectedSubjects[0]?.name || "Personal study";
    const timeInput = (name, label, value) => `<label class="field">${label}<input class="input" type="time" name="${name}" value="${formatTimeInput(value)}" step="60" required></label>`;
    return `${heading("MAKE SPACE FOR YOU", "Weekly Timetable", "A flexible little plan can make your week feel lighter.", `<a href="#add-session" class="button">＋ Add a session</a>`)}
      <section class="card week-navigator"><div class="week-navigation-buttons"><button class="button secondary" type="button" data-action="week-step" data-step="-1" aria-label="Previous week">← Previous</button><button class="button soft" type="button" data-action="current-week">Current week</button><button class="button secondary" type="button" data-action="week-step" data-step="1" aria-label="Next week">Next →</button></div><div class="calendar-pickers"><label class="field">Date in selected week<input class="input" type="date" id="week-start-date" value="${initialDate}" aria-label="Choose a date in the week"></label><label class="field">Month<select class="select" id="week-month" aria-label="Choose month">${monthOptions}</select></label><label class="field">Year<input class="input" type="number" id="week-year" min="1" max="9999" step="1" value="${selectedDate.getFullYear()}" aria-label="Choose year"></label></div><p class="week-range-label">Selected week: ${formatDate(monday, { day: "numeric", month: "long", year: "numeric" })} – ${formatDate(weekDates[6], { day: "numeric", month: "long", year: "numeric" })}</p></section>
      <div class="grid four week-summary-grid"><div class="card stat-card"><span class="stat-icon lav">📚</span><div><div class="stat-number">${weekSessions.length}</div><div class="stat-label">Planned sessions</div></div></div><div class="card stat-card"><span class="stat-icon blue">⏳</span><div><div class="stat-number">${durationLabel(studyMinutes)}</div><div class="stat-label">Study hours</div></div></div><div class="card stat-card"><span class="stat-icon blue">✓</span><div><div class="stat-number">${completed}</div><div class="stat-label">Completed</div></div></div><div class="card stat-card"><span class="stat-icon pink">🌱</span><div><div class="stat-number">${weekSessions.length - completed}</div><div class="stat-label">Remaining</div></div></div></div>
      <div class="week-view-toolbar"><div><h2>Your week at a glance</h2><p>Give every little session its own space.</p></div><label class="day-filter-label">View<select class="select" id="week-day-filter" aria-label="View timetable by day">${filterOptions}</select></label></div>
      ${weekSessions.length ? "" : `<div class="empty-state week-empty-state"><span>☁️</span>Your week is open and full of possibility. Plan your first session below.</div>`}
      <div class="week-days">${dayCards}</div>
      <section class="card session-editor" id="add-session"><div class="card-title"><div><h2 id="session-form-heading">${editingSessionId ? "Edit your study session" : "Plan a study session"}</h2><p class="subheading">${editingSessionId ? "Review your changes in the preview before saving." : "Plan a session and check how it will appear before saving."}</p></div><span>🌷</span></div><form class="form-grid" data-form="session">
        <label class="field">Day<select class="select" name="day" id="session-day" required>${labels.map((day, index) => `<option value="${index}" ${index === currentDayIndex ? "selected" : ""}>${day}</option>`).join("")}</select></label>
        <label class="field">Date<input class="input" name="date" type="date" id="session-date" value="${initialDate}" required></label>
        <label class="field">Subject<select name="subject" class="select" id="session-subject" required>${subjectSelect}</select></label>
        <label class="field">Topic<select class="select" name="topicChoice" id="session-topic" required>${timetableTopicOptions(firstSubject)}</select><span class="field-hint">Choose a saved topic or write a custom one. <a href="topics.html">Browse Topic Library →</a></span></label>
        <label class="field full" id="custom-topic-field" hidden>Custom topic<input class="input" name="customTopic" maxlength="70" placeholder="What would you like to learn?"></label>
        ${timeInput("startMinutes", "Starting time", 9 * 60)}${timeInput("endMinutes", "Ending time", 10 * 60)}
        <label class="field">Break duration <span class="optional-label">Optional</span><select class="select" name="breakMinutes"><option value="0">No break</option>${[5, 10, 15, 20, 30, 45].map(minutes => `<option value="${minutes}">${minutes} minutes</option>`).join("")}</select></label>
        <label class="field full">Short description <span class="optional-label">Optional</span><textarea class="textarea session-description" name="description" maxlength="180" placeholder="A small note to help you get started..."></textarea></label>
        <div class="field full session-preview" id="session-preview" aria-live="polite"><h3>Session preview</h3><p class="session-preview-title" id="session-preview-title"></p><p id="session-preview-details"></p><p id="session-preview-break"></p><p id="session-preview-description" hidden></p><p class="field-hint">After saving, find this session under “Your week at a glance” above. Open Weekly Timetable from the navigation to view it later; your plan is saved in this browser.</p></div>
        <div class="field full session-form-actions"><button class="button" type="submit" id="save-session-button">${editingSessionId ? "Save Changes" : "Save Study Session"}</button><button class="button secondary" type="button" data-action="cancel-session-edit" id="cancel-session-edit" hidden>Cancel edit</button></div>
      </form></section>`;
  }
  function updateSessionPreview() {
    const form = document.querySelector('form[data-form="session"]');
    if (!form) return;
    const subjectField = form.elements.namedItem("subject");
    const topicChoice = String(form.elements.namedItem("topicChoice").value || "");
    const customTopic = String(form.elements.namedItem("customTopic").value || "").trim();
    const selectedTopic = state.selectedTopics.find(topic =>
      topicKey(topic.subject, topic.level, topic.title) === topicChoice
    );
    const topic = topicChoice === "__custom__"
      ? customTopic || "Enter a custom topic"
      : selectedTopic?.title || (topicChoice ? topicChoice : "Choose a topic");
    const date = parseDate(form.elements.namedItem("date").value);
    const startMinutes = parseTimeInput(form.elements.namedItem("startMinutes").value, false);
    const endMinutes = parseTimeInput(form.elements.namedItem("endMinutes").value, true);
    const breakMinutes = Number(form.elements.namedItem("breakMinutes").value) || 0;
    const description = String(form.elements.namedItem("description").value || "").trim();
    const title = document.getElementById("session-preview-title");
    const details = document.getElementById("session-preview-details");
    const breakLabel = document.getElementById("session-preview-break");
    const descriptionLabel = document.getElementById("session-preview-description");
    if (title) title.textContent = `${subjectField.value || "Choose a subject"} · ${topic}`;
    if (details) {
      const dateLabel = date ? formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Choose a valid date";
      const timeLabel = Number.isFinite(startMinutes) && Number.isFinite(endMinutes) && endMinutes > startMinutes
        ? `${formatClock(startMinutes)} – ${formatClock(endMinutes)} · ${durationLabel(endMinutes - startMinutes)}`
        : "Choose an end time after the start time";
      details.textContent = `${dateLabel} · ${timeLabel}`;
    }
    if (breakLabel) breakLabel.textContent = breakMinutes ? `Break: ${breakMinutes} minutes` : "Break: none";
    if (descriptionLabel) {
      descriptionLabel.hidden = !description;
      descriptionLabel.textContent = description ? `Note: ${description}` : "";
    }
  }
  function careersPage() {
    const params = new URLSearchParams(window.location.search);
    const pathwayId = params.get("pathway");
    const selectedPathway = careerCatalog.find(pathway => pathway.id === pathwayId);
    if (selectedPathway) return careerDetailPage(selectedPathway);
    if (params.get("compare") === "1") return careerComparePage();

    const preferences = state.careerPreferences;
    const selectedNames = currentCareerMatchSubjects();
    preferences.subjects = selectedNames;
    const areas = [...new Set(careerCatalog.map(pathway => pathway.area))].sort();
    const areaOptions = [`<option value="all">All career areas</option>`, ...areas.map(area =>
      `<option value="${esc(area)}" ${preferences.area === area ? "selected" : ""}>${esc(area)}</option>`
    )].join("");
    const subjectChecks = state.selectedSubjects.map((subject, index) =>
      `<label class="career-subject-option"><input type="checkbox" data-career-subject value="${esc(subject.name)}" ${preferences.subjects.includes(subject.name) ? "checked" : ""}><span class="career-subject-dot career-tone-${index % 5}"></span>${esc(subject.name)}</label>`
    ).join("");
    const cards = careerCatalog.map((pathway, index) => careerCard(pathway, index)).join("");
    const results = careerPathwayResults();
    const matchingCount = results.direct.length + results.related.length;
    const comparisonCount = state.careerCompareIds.length;
    return `${heading("YOUR FUTURE IS YOURS", "Career Explorer", "Explore subject combinations, possible courses, and the many directions your interests could take.")}<section class="career-hero"><div><div class="eyebrow">A MAP OF POSSIBILITIES</div><h2>Let your subjects open doors. 🌈</h2><p>Browse ${careerCatalog.length} curated combinations, save pathways that interest you, or compare a few side by side.</p></div><div class="career-hero-art" aria-hidden="true"><span>🧭</span><i>✦</i><b>✧</b></div></section>
      <div class="career-disclaimer"><span aria-hidden="true">ⓘ</span><p>These are ideas to explore, not guarantees of admission or a specific career. Course prerequisites, selection processes, and professional qualifications vary between universities and countries; always check official requirements.</p></div>
      <section class="card career-match-panel"><div class="card-title"><div><h2>Find pathways from My Subjects</h2><p class="subheading">Choose the subjects you want to use as a guide.</p></div><a class="button small soft" href="subjects.html">Edit My Subjects →</a></div>
        ${state.selectedSubjects.length ? `<div class="career-subject-options">${subjectChecks}</div>` : `<div class="career-no-subjects">Add subjects to My Subjects to see related combinations. <a href="subjects.html">Choose subjects →</a></div>`}
        <div class="button-row" style="margin-top:12px"><button class="button small secondary" type="button" data-action="include-my-subjects" ${state.selectedSubjects.length ? "" : "disabled"}>Include My Selected Subjects</button><button class="button small soft" type="button" data-action="show-combination" ${selectedNames.length ? "" : "disabled"}>Show Combination</button></div>
        <label class="career-match-toggle"><input type="checkbox" id="career-match-only" ${preferences.matchOnly ? "checked" : ""}><span>Show only combinations connected to my selected subjects</span></label>
      </section>
      <div class="career-tools"><label class="career-search-label">Search pathways<input class="input" type="search" id="career-search" placeholder="Search title, subject, course, or career..." value="${esc(preferences.search)}"></label><label class="career-area-label">Career area<select class="select" id="career-area">${areaOptions}</select></label></div>
      <div class="career-results-bar"><p class="career-match-count">${preferences.matchOnly ? `${matchingCount} pathways match your subjects` : `${results.direct.length} pathways to explore`}</p><p>${state.savedCareers.length} favourite${state.savedCareers.length === 1 ? "" : "s"} saved</p></div>
      <div class="career-compare-bar ${comparisonCount ? "" : "is-empty"}"><span>${comparisonCount ? `${comparisonCount} of 3 pathways selected` : "Choose up to 3 pathways to compare."}</span><div><button class="button small secondary" type="button" data-action="clear-career-compare" ${comparisonCount ? "" : "disabled"}>Clear</button>${comparisonCount >= 2 ? `<a class="button small" href="careers.html?compare=1">Compare pathways (${comparisonCount})</a>` : `<button class="button small" type="button" disabled>Compare pathways${comparisonCount ? ` (${comparisonCount})` : ""}</button>`}</div></div>
      <div class="grid three career-pathway-grid" id="career-pathways"><div class="career-related-heading" id="career-related-heading" hidden><h3>Broader connections</h3><p>These options share some, but not all, of your subjects. Check each pathway's requirements.</p></div>${cards}</div><div class="empty-state career-empty" ${matchingCount ? "hidden" : ""} aria-live="polite"><span>🔎</span>No catalog pathways match these subjects and filters. Try a different subject combination or career area.</div>`;
  }
  function careerToneClass(index) { return `career-tone-${index % 5}`; }
  function pathwayMatchesFilters(pathway) {
    const preferences = state.careerPreferences;
    if (preferences.area !== "all" && pathway.area !== preferences.area) return false;
    const query = String(preferences.search || "").trim().toLowerCase();
    if (query && !pathwayMatchesSearch(pathway, query)) return false;
    return true;
  }
  function pathwayMatchesSearch(pathway, query) {
    const corpus = normalizeCareerSubject([
      pathway.title, pathway.area, ...(pathway.subjects || []), ...(pathway.courses || []),
      ...(pathway.careers || []), pathway.explanation, ...(pathway.skills || []), ...(pathway.furtherStudy || [])
    ].join(" "));
    const normalizedQuery = normalizeCareerSubject(query);
    if (!normalizedQuery) return true;
    if (/^(phd|doctorate|doctoral|doctor of philosophy)$/.test(normalizedQuery)) {
      const researchCorpus = normalizeCareerSubject([
        pathway.title, ...(pathway.courses || []), ...(pathway.furtherStudy || [])
      ].join(" "));
      return /\b(phd|doctoral|doctorate|doctor of philosophy)\b|\bpostgraduate research\b/.test(researchCorpus);
    }
    const aliases = careerSubjectAliasGroups.find(group => group.includes(normalizedQuery));
    const variants = aliases
      ? aliases.filter(variant => normalizedQuery.length > 2 || variant !== normalizedQuery)
      : [normalizedQuery];
    const corpusWords = [...new Set(corpus.split(" "))];
    return variants.some(variant => normalizeCareerSubject(variant).split(" ").every(word =>
      corpusWords.some(corpusWord => word.length >= 3 ? corpusWord.startsWith(word) : corpusWord === word)
    ));
  }
  function careerPathwayResults() {
    const preferences = state.careerPreferences;
    const selectedNames = currentCareerMatchSubjects();
    const inScope = careerCatalog.filter(pathwayMatchesFilters);
    if (!preferences.matchOnly) return { direct: inScope, related: [] };
    if (!selectedNames.length) return { direct: [], related: [] };
    const scored = inScope.map(pathway => ({ pathway, details: pathwaySubjectMatchDetails(pathway, selectedNames) }))
      .filter(result => result.details.matches.length)
      .sort((a, b) => b.details.matches.length - a.details.matches.length || b.details.score - a.details.score || a.pathway.title.localeCompare(b.pathway.title));
    const direct = scored.filter(result => result.details.matches.length === selectedNames.length);
    const relatedCandidates = scored.filter(result => result.details.matches.length < selectedNames.length);
    const related = String(preferences.search || "").trim()
      ? relatedCandidates
      : relatedCandidates.slice(0, Math.max(0, 5 - direct.length));
    return { direct: direct.map(result => result.pathway), related: related.map(result => result.pathway) };
  }
  function careerCard(pathway, index) {
    const saved = state.savedCareers.includes(pathway.id);
    const compared = state.careerCompareIds.includes(pathway.id);
    return `<article class="card career-card ${careerToneClass(index)}" data-career-card data-id="${esc(pathway.id)}" hidden>
      <div class="career-art" aria-hidden="true"><span class="career-art-orbit"></span><span class="career-art-icon">${pathway.icon}</span><span class="career-art-spark">✦</span></div>
      <button class="save-career ${saved ? "saved" : ""}" type="button" data-action="save-career" data-id="${esc(pathway.id)}" aria-label="${saved ? "Remove" : "Save"} ${esc(pathway.title)} ${saved ? "from" : "to"} favourites">${saved ? "♥" : "♡"}</button>
      <span class="tag">${esc(pathway.area)}</span><span class="tag career-fit-tag" data-career-fit hidden></span><h2>${esc(pathway.title)}</h2><p class="career-card-explanation">${esc(pathway.explanation)}</p>
      <div class="career-card-subjects"><strong>Relevant subjects</strong><div>${pathway.subjects.map(subject => `<span class="tag ${index % 2 ? "blue" : "pink"}">${esc(subject)}</span>`).join("")}</div></div>
      <p class="career-match-note" data-career-match-note hidden></p>
      <div class="career-card-actions"><a class="button small soft" href="careers.html?pathway=${encodeURIComponent(pathway.id)}">Explore details →</a><button class="button small ${compared ? "soft" : "secondary"}" type="button" data-action="toggle-career-compare" data-id="${esc(pathway.id)}">${compared ? "✓ Added to compare" : "＋ Compare"}</button></div>
    </article>`;
  }
  function careerDetailPage(pathway) {
    const index = careerCatalog.indexOf(pathway);
    const related = careerCatalog.filter(item => item.id !== pathway.id)
      .map(item => ({ item, count: pathwaySubjectMatches(item, pathway.subjects) }))
      .filter(result => result.count > 0)
      .sort((a, b) => b.count - a.count || a.item.title.localeCompare(b.item.title))
      .slice(0, 3);
    const saved = state.savedCareers.includes(pathway.id);
    const compared = state.careerCompareIds.includes(pathway.id);
    return `${heading("A PATHWAY TO EXPLORE", pathway.title, pathway.explanation, `<a class="button secondary" href="careers.html">← Back to pathways</a>`)}
      <div class="career-detail-hero ${careerToneClass(index)}"><div class="career-art career-art-large" aria-hidden="true"><span class="career-art-orbit"></span><span class="career-art-icon">${pathway.icon}</span><span class="career-art-spark">✦</span></div><div><span class="tag">${esc(pathway.area)}</span><h2>${esc(pathway.title)}</h2><p>${esc(pathway.explanation)}</p><div class="career-detail-actions"><button class="button ${saved ? "soft" : ""}" type="button" data-action="save-career" data-id="${esc(pathway.id)}">${saved ? "♥ Saved to favourites" : "♡ Save favourite"}</button><button class="button secondary" type="button" data-action="toggle-career-compare" data-id="${esc(pathway.id)}">${compared ? "✓ Added to compare" : "＋ Add to compare"}</button></div></div></div>
      <div class="career-disclaimer"><span aria-hidden="true">ⓘ</span><p>This is a starting point for exploration, not a promise of admission or employment. Universities and countries have different course prerequisites, selection processes, and professional qualifications. Check the official requirements for your intended institution and location.</p></div>
      <div class="career-detail-grid"><section class="card"><h2>Relevant subjects</h2><p class="subheading">A useful combination to explore</p><div class="career-detail-tags">${pathway.subjects.map(subject => `<span class="tag">${esc(subject)}</span>`).join("")}</div></section>
        ${careerDetailList("Possible university courses", pathway.courses, "🎓")}
        ${careerDetailList("Possible career paths", pathway.careers, "🌱")}
        ${careerDetailList("Useful additional skills", pathway.skills, "✨")}
        ${careerDetailList("Further study ideas", pathway.furtherStudy, "📚")}
      </div>
      <section class="section-head career-related-heading"><div><h2>Related subject combinations</h2><p>Other pathways that share subjects with this one.</p></div></section>
      <div class="grid three career-pathway-grid">${related.map(result => `<article class="card career-related-card"><span class="tag">${esc(result.item.area)}</span><h3>${esc(result.item.title)}</h3><p>${esc(result.item.subjects.join(" · "))}</p><span class="career-related-match">${result.count} shared subject${result.count === 1 ? "" : "s"}</span><a class="button small soft" href="careers.html?pathway=${encodeURIComponent(result.item.id)}">Explore pathway →</a></article>`).join("") || emptyState("🌱", "Explore the full library for more combinations.")}</div>`;
  }
  function careerDetailList(title, items, icon) {
    return `<section class="card career-detail-list"><h2><span aria-hidden="true">${icon}</span> ${title}</h2><ul>${items.map(item => `<li>${esc(item)}</li>`).join("")}</ul></section>`;
  }
  function careerComparePage() {
    const paths = state.careerCompareIds.map(id => careerCatalog.find(pathway => pathway.id === id)).filter(Boolean);
    if (paths.length < 2) return `${heading("SIDE BY SIDE", "Compare pathways", "Choose at least two pathways to compare.")}<div class="empty-state"><span>⚖️</span>Add two or more combinations from the Career Explorer first. <a class="button small soft" href="careers.html">Browse pathways →</a></div>`;
    const rows = [
      ["Career area", pathway => pathway.area],
      ["Relevant subjects", pathway => pathway.subjects.join(" · ")],
      ["Possible university courses", pathway => pathway.courses.join(" · ")],
      ["Possible career paths", pathway => pathway.careers.join(" · ")],
      ["Pathway overview", pathway => pathway.explanation],
      ["Useful additional skills", pathway => pathway.skills.join(" · ")],
      ["Further study ideas", pathway => pathway.furtherStudy.join(" · ")]
    ];
    return `${heading("SIDE BY SIDE", "Compare pathways", "Notice the shared subjects, different courses, and skills each route may involve.", `<a class="button secondary" href="careers.html">← Back to pathways</a>`)}
      <div class="career-disclaimer"><span aria-hidden="true">ⓘ</span><p>These comparisons are for exploration only. Admissions and professional requirements differ between institutions and countries.</p></div>
      <div class="career-compare-wrap"><table class="career-compare-table"><thead><tr><th scope="col">Explore</th>${paths.map(pathway => `<th scope="col"><div class="career-compare-title"><span>${pathway.icon}</span><strong>${esc(pathway.title)}</strong><a href="careers.html?pathway=${encodeURIComponent(pathway.id)}">Open details →</a><button class="button small danger" type="button" data-action="toggle-career-compare" data-id="${esc(pathway.id)}">Remove</button></div></th>`).join("")}</tr></thead><tbody>${rows.map(([label, getter]) => `<tr><th scope="row">${label}</th>${paths.map(pathway => `<td>${esc(getter(pathway))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function refreshCareerCards() {
    const preferences = state.careerPreferences;
    const selectedNames = currentCareerMatchSubjects();
    const results = careerPathwayResults();
    const directIds = new Set(results.direct.map(pathway => pathway.id));
    const relatedIds = new Set(results.related.map(pathway => pathway.id));
    const grid = document.getElementById("career-pathways");
    const relatedHeading = document.getElementById("career-related-heading");
    const cards = [...document.querySelectorAll("[data-career-card]")];
    const cardsById = new Map(cards.map(card => [card.dataset.id, card]));
    const configure = (pathway, isRelated) => {
      const card = cardsById.get(pathway.id);
      if (!card) return;
      card.hidden = false;
      const details = pathwaySubjectMatchDetails(pathway, selectedNames);
      const fit = card.querySelector("[data-career-fit]");
      const note = card.querySelector("[data-career-match-note]");
      fit.hidden = !preferences.matchOnly || !selectedNames.length;
      fit.textContent = isRelated ? "Broader option" : `${details.matches.length}/${selectedNames.length} subjects`;
      note.hidden = !preferences.matchOnly || !selectedNames.length;
      note.textContent = pathwayMatchReason(pathway);
      if (grid) grid.appendChild(card);
    };
    results.direct.forEach(pathway => configure(pathway, false));
    if (relatedHeading) {
      relatedHeading.hidden = !results.related.length;
      if (grid && results.related.length) grid.appendChild(relatedHeading);
    }
    results.related.forEach(pathway => configure(pathway, true));
    cards.forEach(card => {
      if (directIds.has(card.dataset.id) || relatedIds.has(card.dataset.id)) return;
      card.hidden = true;
      if (grid) grid.appendChild(card);
    });
    const count = document.querySelector(".career-match-count");
    if (count) {
      count.textContent = !preferences.matchOnly
        ? `${results.direct.length} pathways to explore`
        : !selectedNames.length
          ? "Choose subjects to find matching pathways"
        : results.related.length
          ? `${results.direct.length} stronger matches · ${results.related.length} broader connections`
          : `${results.direct.length} pathways match your subjects`;
    }
    const empty = document.querySelector(".career-empty");
    if (empty) {
      empty.hidden = results.direct.length + results.related.length > 0;
      if (!empty.hidden) {
        const message = !preferences.matchOnly
          ? preferences.search
            ? "No pathways match this search. Try another term or clear the search."
            : `No pathways are listed in ${preferences.area}. Try All career areas.`
          : !selectedNames.length
            ? "Choose at least one subject, or turn off subject matching to explore All Career Areas."
          : preferences.area !== "all"
            ? `No pathways in ${preferences.area} meet the selected-subject match threshold. Try All career areas.`
            : preferences.search
              ? "No pathways for these subjects match this search. Try another term or clear the search."
              : "No catalog pathways connect to these selected subjects yet. Try another combination or add a subject used by a listed pathway.";
        const icon = empty.querySelector("span");
        empty.replaceChildren(icon, document.createTextNode(message));
      }
    }
  }
  function progressPage() {
    const avg = averageTaskProgress();
    const suggestion = smartStudySuggestion();
    const doneSessions = completedSessionCount();
    const doneGoals = state.goals.filter(goalIsComplete).length;
    const completedTopics = completedTopicCount();
    const pendingTopics = Math.max(0, state.selectedTopics.length - completedTopics);
    const today = dateToISO(new Date());
    const todayPlanned = state.sessions.filter(session => session && session.date === today).length;
    const weeklySessions = currentWeekSessions();
    const weeklyCompleted = currentWeekCompletedSessions().length;
    const streak = currentStudyStreak();
    const completedTasks = doneSessions + completedTopics;
    const subjectCards = state.subjects.map((subject, index) => `<div class="card">${progressBar(subject, index)}<p class="subheading" style="font-size:11px;margin-top:12px">${subjectTaskProgress(subject.name) ? "Completion is based on your saved sessions and topic statuses." : "Complete a study session or selected topic to start tracking this subject."}</p></div>`).join("");
    const achievements = [
      { title: "First study task", detail: "Complete one study session or topic.", unlocked: completedTasks >= 1 },
      { title: "Five study tasks", detail: "Complete five sessions or topics.", unlocked: completedTasks >= 5 },
      { title: "Three-day rhythm", detail: "Complete study tasks on three consecutive days.", unlocked: streak >= 3 }
    ].map(achievement => `<article class="card achievement-card ${achievement.unlocked ? "is-unlocked" : ""}"><span aria-hidden="true">${achievement.unlocked ? "🏅" : "🔒"}</span><div><h3>${esc(achievement.title)}</h3><p>${esc(achievement.detail)}</p><strong>${achievement.unlocked ? "Unlocked" : "Not yet earned"}</strong></div></article>`).join("");
    return `${heading("LOOK HOW FAR YOU'VE COME", "My Progress", "Progress isn't always a straight line. Every page turned and problem tried counts.")}
      <div class="grid three">
        <div class="card stat-card"><span class="stat-icon lav">🌷</span><div><div class="stat-number">${avg}%</div><div class="stat-label">Average task completion</div></div></div>
        <div class="card stat-card"><span class="stat-icon blue">☑</span><div><div class="stat-number">${doneSessions}</div><div class="stat-label">Sessions completed</div></div></div>
        <div class="card stat-card"><span class="stat-icon pink">🎯</span><div><div class="stat-number">${doneGoals} / ${state.goals.length}</div><div class="stat-label">Goals checked off</div></div></div>
      </div>
      <div class="grid three" style="margin-top:18px">
        <div class="card stat-card"><span class="stat-icon green">🧠</span><div><div class="stat-number">${completedTopics}</div><div class="stat-label">Topics completed</div></div></div>
        <div class="card stat-card"><span class="stat-icon cream">📌</span><div><div class="stat-number">${pendingTopics}</div><div class="stat-label">Topics pending</div></div></div>
        <div class="card stat-card"><span class="stat-icon lavender">📆</span><div><div class="stat-number">${todayPlanned}</div><div class="stat-label">Sessions scheduled today</div></div></div>
      </div>
      <div class="grid three" style="margin-top:18px"><div class="card stat-card"><span class="stat-icon blue">🗓️</span><div><div class="stat-number">${weeklySessions.length}</div><div class="stat-label">Sessions scheduled this week</div></div></div><div class="card stat-card"><span class="stat-icon pink">✓</span><div><div class="stat-number">${weeklyCompleted}</div><div class="stat-label">Sessions completed this week</div></div></div><div class="card stat-card"><span class="stat-icon lav">🔥</span><div><div class="stat-number">${streak}</div><div class="stat-label">Current study streak (days)</div></div></div></div>
      <div class="section-head"><div><h2>Your subjects, in bloom</h2><p>Each little step is worth celebrating.</p></div></div>
      <div class="grid three">${subjectCards || emptyState("🌱", "Your progress story starts when you add a subject.")}</div>
      <div class="section-head"><div><h2>Achievements</h2><p>Milestones unlock only from completed study activity.</p></div></div><div class="grid three">${achievements}</div>
      <div class="dashboard-grid"><section class="card"><div class="card-title"><h2>Your study rhythm</h2><span>✨</span></div><div class="week-summary"><div class="ring" style="--value:${avg}%"><span>${avg}%</span></div><div class="week-copy"><strong>${completedTasks ? "You're making lovely progress." : "Your progress starts when you complete a task."}</strong><p>${doneSessions} study session${doneSessions === 1 ? "" : "s"} and ${completedTopics} topic${completedTopics === 1 ? "" : "s"} completed so far. Remember to take breaks and celebrate your effort.</p></div></div></section><section class="card"><div class="card-title"><h2>A note to remember</h2></div><p class="subheading">Your progress is personal. A small, consistent effort is more powerful than a perfect plan. Be kind to yourself along the way. 💜</p><p class="subheading"><strong>Smart next step:</strong> ${esc(suggestion.message)}</p><div class="button-row"><a class="button small soft" href="${suggestion.href}">${esc(suggestion.action)} →</a><a class="button small secondary" href="goals.html">Visit my goals →</a></div></section></div>`;
  }
  function notesPage() {
    const cards = state.notes.slice().reverse().map(note => `<article class="card note-card" data-note-card data-id="${esc(note.id)}" data-search="${esc([note.title, note.subject, note.body, note.date].join(" ").toLowerCase())}"><div class="row-between"><span class="tag">${esc(note.subject)}</span><div class="row-actions"><button type="button" class="button small secondary" data-action="edit-note" data-id="${esc(note.id)}">Edit</button><button type="button" class="button small danger" data-action="delete-note" data-id="${esc(note.id)}">Delete</button></div></div><h2 style="margin-top:13px">${esc(note.title)}</h2><p>${esc(note.body)}</p><span class="note-date">${esc(note.date)}</span></article>`).join("");
    return `${heading("THOUGHTS, TIDIED UP", "My Notes", "A soft landing place for bright ideas, reminders, and things you want to remember.", `<a href="#new-note" class="button">＋ New note</a>`)}<section class="card" id="new-note" style="margin-bottom:20px"><div class="card-title"><h2 id="note-form-heading">${editingNoteId ? "Edit your note" : "Catch a thought"}</h2><span>📝</span></div><form class="form-grid" data-form="note"><label class="field">Note title<input class="input" name="title" required maxlength="70" placeholder="A thought worth keeping..."></label><label class="field">Subject<select class="select" name="subject">${subjectOptions()}</select></label><label class="field full">Your note<textarea class="textarea" name="body" required maxlength="2000" placeholder="Write it down, future you will be glad..."></textarea></label><div class="field full session-form-actions"><button class="button" type="submit" id="save-note-button">${editingNoteId ? "Save Changes" : "Save Note"}</button><button class="button secondary" type="button" data-action="cancel-note-edit" id="cancel-note-edit" ${editingNoteId ? "" : "hidden"}>Cancel edit</button></div></form></section><div class="section-head"><div><h2>Your notebook</h2><p id="notes-count">${state.notes.length} note${state.notes.length === 1 ? "" : "s"} saved on this device.</p></div></div><label class="career-search-label note-search-label">Search notes<input class="input" type="search" id="note-search" placeholder="Search title, subject, or note text..." aria-label="Search notes"></label><div class="grid three" id="notes-grid">${cards || `<div class="empty-state" id="notes-empty-state"><span>📒</span>Your notebook is open. Add a note whenever inspiration strikes.</div>`}</div><div class="empty-state" id="notes-no-results" hidden><span>🔎</span>No notes match your search.</div>`;
  }
  function refreshNotes() {
    const query = String(document.getElementById("note-search")?.value || "").trim().toLowerCase();
    const cards = [...document.querySelectorAll("[data-note-card]")];
    let visible = 0;
    cards.forEach(card => {
      const show = !query || String(card.dataset.search || "").includes(query);
      card.hidden = !show;
      if (show) visible++;
    });
    const count = document.getElementById("notes-count");
    if (count) count.textContent = query
      ? `${visible} of ${cards.length} note${cards.length === 1 ? "" : "s"} shown.`
      : `${cards.length} note${cards.length === 1 ? "" : "s"} saved on this device.`;
    const noResults = document.getElementById("notes-no-results");
    if (noResults) noResults.hidden = !query || visible > 0;
    const emptyState = document.getElementById("notes-empty-state");
    if (emptyState) emptyState.hidden = Boolean(query);
  }
  function beginNoteEdit(noteId) {
    const note = state.notes.find(item => item.id === noteId);
    const form = document.querySelector('form[data-form="note"]');
    if (!note || !form) return;
    editingNoteId = noteId;
    const subjectField = form.elements.namedItem("subject");
    if (![...subjectField.options].some(option => option.value === note.subject)) {
      const option = document.createElement("option");
      option.value = note.subject;
      option.textContent = note.subject;
      subjectField.add(option);
    }
    form.elements.namedItem("title").value = note.title;
    subjectField.value = note.subject;
    form.elements.namedItem("body").value = note.body;
    document.getElementById("note-form-heading").textContent = "Edit your note";
    document.getElementById("save-note-button").textContent = "Save Changes";
    document.getElementById("cancel-note-edit").hidden = false;
    document.getElementById("new-note").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function smartStudySuggestion() {
    const nextTopic = state.selectedTopics.find(topic => topic && topic.completed !== true);
    if (nextTopic) {
      return {
        message: `A gentle next step: ${nextTopic.title} in ${nextTopic.subject}.`,
        href: "topics.html",
        action: "Open Topic Library"
      };
    }
    const nextSession = state.sessions.filter(session => session && session.done !== true)
      .slice().sort((a, b) => a.date.localeCompare(b.date) || sessionStart(a) - sessionStart(b))[0];
    if (nextSession) {
      return {
        message: `Your next planned session is ${nextSession.subject}: ${nextSession.topic}.`,
        href: "timetable.html",
        action: "Open Timetable"
      };
    }
    const trackedTasks = state.selectedTopics.length + state.sessions.length;
    const completedTasks = completedTopicCount() + completedSessionCount();
    return {
      message: trackedTasks > 0 && completedTasks === trackedTasks
        ? "You've completed every selected study task. Add another topic whenever you're ready."
        : state.selectedSubjects.length
          ? "Choose a topic to find a comfortable next step."
          : "Choose a subject and topic to find a comfortable next step.",
      href: state.selectedSubjects.length ? "topics.html" : "subjects.html",
      action: state.selectedSubjects.length ? "Explore Topics" : "Choose Subjects"
    };
  }
  function goalsPage() {
    const goals = state.goals.map(goal => {
      const done = goalIsComplete(goal);
      const kind = { daily: "Daily", weekly: "Weekly", subject: "Subject", topic: "Topic completion" }[goal.type] || "Weekly";
      const goalDetail = goal.type === "subject" && goal.subject ? `${goal.subject}${goal.detail ? ` · ${goal.detail}` : ""}` : goal.detail;
      return `<div class="check-item ${done ? "done" : ""}"><input type="checkbox" id="goal-${esc(goal.id)}" data-action="toggle-goal" data-id="${esc(goal.id)}" ${done ? "checked" : ""} ${goal.type === "topic" ? "disabled" : ""}><label for="goal-${esc(goal.id)}">${esc(goal.title)}</label><small><span class="tag">${kind}</span> ${esc(goalDetail || "")}</small>${goal.type === "topic" ? `<small>${esc(state.selectedTopics.find(topic => topicKey(topic.subject, topic.level, topic.title) === goal.topicKey)?.title || "Linked topic no longer selected")}</small>` : ""}<button class="button small danger" type="button" data-action="delete-goal" data-id="${esc(goal.id)}" aria-label="Remove goal">×</button></div>`;
    }).join("");
    const complete = state.goals.filter(goalIsComplete).length;
    const goalSubjects = [`<option value="">Choose a subject…</option>`, ...state.selectedSubjects.map(subject =>
      `<option value="${esc(subject.name)}">${esc(subject.name)}</option>`
    )].join("");
    const goalTopics = [`<option value="">Choose a selected topic…</option>`, ...state.selectedTopics.map(topic =>
      `<option value="${esc(topicKey(topic.subject, topic.level, topic.title))}">${esc(topic.title)} · ${esc(topic.subject)}</option>`
    )].join("");
    return `${heading("SMALL STEPS, SO MUCH GROWTH", "Study Goals", "Set gentle intentions for your learning, and give yourself credit for every one.")}<div class="dashboard-grid"><section class="card"><div class="card-title"><h2>Your intentions</h2><span class="tag">${complete} of ${state.goals.length} complete</span></div><div class="progress-track" style="margin-bottom:17px"><div class="progress-fill" style="width:${state.goals.length ? complete / state.goals.length * 100 : 0}%"></div></div><div class="check-list">${goals || emptyState("🎯", "No goals just yet. Start with one thing you would love to do.")}</div></section><section class="card"><div class="card-title"><h2>Choose your next little win</h2><span>🌱</span></div><form class="form-grid" data-form="goal"><label class="field full">My intention<input class="input" name="title" required maxlength="90" placeholder="e.g. Read one chapter"></label><label class="field full">Goal type<select class="select" name="type" id="goal-type"><option value="weekly">Weekly goal</option><option value="daily">Daily goal</option><option value="subject">Subject goal</option><option value="topic">Topic completion goal</option></select></label><label class="field full" id="goal-subject-field" hidden>Subject<select class="select" name="subject">${goalSubjects}</select></label><label class="field full" id="goal-topic-field" hidden>Selected topic<select class="select" name="topicKey">${goalTopics}</select><span class="field-hint">This goal completes when you mark the linked topic complete in Topic Library.</span></label><label class="field full">A little detail<input class="input" name="detail" maxlength="50" placeholder="e.g. 20 minutes"></label><div class="field full"><button class="button" type="submit">Add my goal ✨</button></div></form><div style="margin-top:22px;padding:15px;border-radius:15px;background:#fff7eb"><strong>🌼 A gentle reminder</strong><p class="subheading" style="font-size:12px;margin:6px 0 0">Goals are here to support you, not pressure you. It's okay to adjust your plans.</p></div></section></div>`;
  }
  function aboutPage() {
    return `${heading("A SPACE TO GROW", "About StudySpace", "A calmer, kinder way to make room for learning.")}<section class="about-hero"><div class="eyebrow">HELLO, CURIOUS MIND</div><h2 style="font-size:clamp(1.5rem,3vw,2rem)">Learning looks good on you. 💜</h2><p>StudySpace is your personal corner for planning study sessions, organizing what you're learning, and keeping track of the progress you're making. It's designed to make studying feel a little more joyful and a lot more yours.</p><p style="margin-bottom:0">No pressure to be perfect. Just a gentle place to begin again, whenever you're ready.</p></section><div class="section-head"><div><h2>Made for the way you learn</h2><p>Everything has a little room to grow.</p></div></div><div class="grid three"><article class="card value-card"><div class="topic-icon">🌱</div><h2>Grow at your pace</h2><p class="subheading">Your goals, your rhythm, your own definition of progress.</p></article><article class="card value-card"><div class="topic-icon" style="background:#e8f5ff">🧺</div><h2>Find your focus</h2><p class="subheading">Keep your subjects, schedule, notes, and ideas together.</p></article><article class="card value-card"><div class="topic-icon" style="background:#fff0f6">✨</div><h2>Dream out loud</h2><p class="subheading">Explore new interests and imagine all the places they can take you.</p></article></div><div class="card" style="margin-top:19px"><h2>Your privacy matters</h2><p class="subheading">StudySpace saves your information in this browser on this device. Your notes, subjects, and plans stay in your browser's Local Storage; they are not sent to a server. Clearing browser data will remove saved information.</p><a class="button small soft" href="index.html">Back to my study space →</a></div>`;
  }

  function toast(message) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.textContent = message;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 2800);
  }
  function rerender() {
    const saved = persist();
    const main = document.getElementById("main-content");
    if (main) {
      main.innerHTML = pageContent();
      if (page === "careers") refreshCareerCards();
      if (page === "notes") refreshNotes();
      updateSessionPreview();
      main.classList.remove("page-refresh");
      void main.offsetWidth;
      main.classList.add("page-refresh");
    }
    return saved;
  }
  function id() { return `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

  root.innerHTML = header();
  if (page === "careers") refreshCareerCards();
  if (page === "notes") refreshNotes();
  updateSessionPreview();
  document.addEventListener("click", event => {
    const menuButton = event.target.closest(".menu-toggle");
    if (menuButton) {
      document.body.classList.toggle("menu-open");
      menuButton.setAttribute("aria-expanded", document.body.classList.contains("menu-open"));
      return;
    }
    if (event.target.closest(".overlay")) {
      document.body.classList.remove("menu-open");
      const toggle = document.querySelector(".menu-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      return;
    }
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const itemId = button.dataset.id;
    if (action === "subject-progress") {
      const subject = state.subjects.find(s => s.id === itemId);
      if (subject) { subject.progress = Math.min(100, subject.progress + 5); rerender(); toast(`${subject.name} progress updated! 🌱`); }
    } else if (action === "select-subject") {
      const name = button.dataset.name;
      const definition = allLibrarySubjects().find(subject => subject.name === name);
      if (definition && !selectedSubject(name)) {
        state.selectedSubjects.push({ name, level: preferredLevel(definition) });
        if (!state.subjects.some(subject => subject.name.toLowerCase() === name.toLowerCase())) {
          state.subjects.push({ id: id(), name, emoji: definition.emoji, color: colors[state.subjects.length % colors.length], progress: 0, topics: definition.topics.length });
        }
        syncCareerPreferencesSubjects();
        rerender(); toast(`${name} added to your subjects! 📚`);
      }
    } else if (action === "remove-subject") {
      const name = button.dataset.name;
      state.selectedSubjects = state.selectedSubjects.filter(subject => subject.name !== name);
      state.selectedTopics = state.selectedTopics.filter(topic => topic.subject !== name);
      state.subjects = state.subjects.filter(subject => subject.name !== name);
      syncCareerPreferencesSubjects();
      rerender(); toast(`${name} removed from your selected subjects.`);
    } else if (action === "favorite-subject") {
      const name = button.dataset.name;
      state.favoriteSubjects = state.favoriteSubjects.includes(name)
        ? state.favoriteSubjects.filter(subject => subject !== name)
        : state.favoriteSubjects.concat(name);
      rerender();
    } else if (action === "toggle-topic") {
      const topic = { subject: button.dataset.subject, level: button.dataset.level, title: button.dataset.title };
      const key = topicKey(topic.subject, topic.level, topic.title);
      if (topicSelected(topic)) {
        state.selectedTopics = state.selectedTopics.filter(item => topicKey(item.subject, item.level, item.title) !== key);
        toast("Topic removed from your selection.");
      } else {
        state.selectedTopics.push(Object.assign(topic, { completed: false }));
        toast("Topic added to your study list! ✨");
      }
      rerender();
    } else if (action === "topic-status") {
      const topic = state.selectedTopics.find(item => topicKey(item.subject, item.level, item.title) === itemId);
      if (topic) {
        topic.completed = !topic.completed;
        if (topic.completed) topic.completedAt = dateToISO(new Date());
        else delete topic.completedAt;
      }
      rerender();
      if (topic && topic.completed) toast("Topic complete—wonderful work! 🎉");
    } else if (action === "remove-topic") {
      state.selectedTopics = state.selectedTopics.filter(topic => topicKey(topic.subject, topic.level, topic.title) !== itemId);
      rerender(); toast("Topic removed from your selection.");
    } else if (action === "toggle-session") {
      const session = state.sessions.find(s => s.id === itemId);
      if (session) {
        session.done = !session.done;
        if (session.done) session.completedAt = dateToISO(new Date());
        else delete session.completedAt;
        rerender();
        if (session.done) toast("Session complete—lovely work! 🎉");
      }
    } else if (action === "week-step") {
      const current = parseDate(state.weekDate) || parseDate(state.weekStart) || startOfWeek(new Date());
      const selectedDate = addDays(current, Number(button.dataset.step) * 7);
      state.weekDate = dateToISO(selectedDate);
      state.weekStart = dateToISO(startOfWeek(selectedDate));
      state.timetableDayFilter = "all";
      editingSessionId = null;
      rerender();
    } else if (action === "current-week") {
      state.weekDate = dateToISO(new Date());
      state.weekStart = dateToISO(startOfWeek(new Date()));
      state.timetableDayFilter = "all";
      editingSessionId = null;
      rerender();
    } else if (action === "edit-session") {
      beginSessionEdit(itemId);
    } else if (action === "delete-session") {
      state.sessions = state.sessions.filter(session => session.id !== itemId);
      if (editingSessionId === itemId) editingSessionId = null;
      rerender(); toast("Study session deleted.");
    } else if (action === "cancel-session-edit") {
      editingSessionId = null;
      rerender(); toast("Edit cancelled.");
    } else if (action === "delete-subject") {
      const subject = state.subjects.find(s => s.id === itemId);
      if (subject && window.confirm(`Remove ${subject.name} from your subjects?`)) { state.subjects = state.subjects.filter(s => s.id !== itemId); rerender(); toast("Subject removed."); }
    } else if (action === "save-career") {
      state.savedCareers = state.savedCareers.includes(itemId) ? state.savedCareers.filter(x => x !== itemId) : state.savedCareers.concat(itemId);
      rerender();
    } else if (action === "toggle-career-compare") {
      if (state.careerCompareIds.includes(itemId)) {
        state.careerCompareIds = state.careerCompareIds.filter(id => id !== itemId);
      } else if (state.careerCompareIds.length >= 3) {
        toast("Compare up to three pathways at a time. Remove one to add another.");
        return;
      } else {
        state.careerCompareIds.push(itemId);
      }
      rerender();
    } else if (action === "clear-career-compare") {
      state.careerCompareIds = [];
      rerender();
    } else if (action === "include-my-subjects") {
      state.careerPreferences.subjects = selectedSubjectNames();
      state.careerPreferences.matchOnly = true;
      rerender();
    } else if (action === "show-combination") {
      state.careerPreferences.matchOnly = true;
      rerender();
    } else if (action === "toggle-goal") {
      const goal = state.goals.find(g => g.id === itemId);
      if (goal) {
        goal.done = button.checked;
        if (goal.done) goal.completedAt = dateToISO(new Date());
        else delete goal.completedAt;
        rerender();
        if (goal.done) toast("One little win, celebrated! 🎉");
      }
    } else if (action === "delete-goal") {
      state.goals = state.goals.filter(g => g.id !== itemId); rerender(); toast("Goal removed.");
    } else if (action === "delete-note") {
      state.notes = state.notes.filter(n => n.id !== itemId);
      if (editingNoteId === itemId) editingNoteId = null;
      rerender(); toast("Note deleted.");
    } else if (action === "edit-note") {
      beginNoteEdit(itemId);
    } else if (action === "cancel-note-edit") {
      editingNoteId = null;
      rerender(); toast("Note edit cancelled.");
    }
  });
  document.addEventListener("submit", event => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    if (form.dataset.form === "subject") {
      const name = String(data.get("name") || "").trim();
      if (!name) return;
      if (state.subjects.some(s => s.name.toLowerCase() === name.toLowerCase())) { toast("That subject is already on your shelf."); return; }
      const emoji = String(data.get("emoji") || "📖").trim() || "📖";
      const custom = { name, emoji, category: "custom", levels: levelsFallback(), topics: ["Foundations and key concepts", "Core terminology and methods", "Guided practice and application", "Evidence, analysis and reflection", "Independent project"] };
      state.customSubjects.push(custom);
      state.selectedSubjects.push({ name, level: "A Level" });
      state.subjects.push({ id: id(), name, emoji, color: colors[state.subjects.length % colors.length], progress: 0, topics: 0 });
      syncCareerPreferencesSubjects();
      rerender(); toast("A new subject is on your shelf! 📚");
    } else if (form.dataset.form === "library-subject") {
      const name = String(data.get("name") || "").trim();
      const emoji = String(data.get("emoji") || "📖").trim() || "📖";
      if (!name) return;
      if (allLibrarySubjects().some(subject => subject.name.toLowerCase() === name.toLowerCase())) {
        toast("A subject with that name is already in your library."); return;
      }
      const custom = { name, emoji, category: "custom", levels: levelsFallback(), topics: ["Foundations and key concepts", "Core terminology and methods", "Guided practice and application", "Evidence, analysis and reflection", "Independent project"] };
      state.customSubjects.push(custom);
      state.selectedSubjects.push({ name, level: "A Level" });
      state.subjects.push({ id: id(), name, emoji, color: colors[state.subjects.length % colors.length], progress: 0, topics: custom.topics.length });
      syncCareerPreferencesSubjects();
      rerender(); toast("Your subject is in the library and selected! 📚");
    } else if (form.dataset.form === "library-topic") {
      const subject = String(data.get("subject") || "");
      const title = String(data.get("title") || "").trim();
      const selection = selectedSubject(subject);
      if (!selection || !title) return;
      const duplicate = state.customTopics.some(topic => topic.subject === subject && topic.level === selection.level && topic.title.toLowerCase() === title.toLowerCase());
      if (duplicate) { toast("That custom topic is already in your library."); return; }
      const topic = { id: id(), subject, level: selection.level, title };
      state.customTopics.push(topic);
      state.selectedTopics.push(Object.assign({}, topic, { completed: false }));
      rerender(); toast("Your custom topic was added to the study list! ✨");
    } else if (form.dataset.form === "session") {
      const subject = String(data.get("subject"));
      const topicChoice = String(data.get("topicChoice") || "");
      const topic = topicChoice === "__custom__"
        ? String(data.get("customTopic") || "").trim()
        : state.selectedTopics.find(item => topicKey(item.subject, item.level, item.title) === topicChoice)?.title || "";
      const date = parseDate(String(data.get("date") || ""));
      const startMinutes = parseTimeInput(data.get("startMinutes"), false);
      const endMinutes = parseTimeInput(data.get("endMinutes"), true);
      const breakMinutes = Number(data.get("breakMinutes")) || 0;
      const description = String(data.get("description") || "").trim();
      if (!date || !subject || !topic) { toast("Choose a date, subject, and selected topic (or write a custom one)."); return; }
      if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
        toast("Choose an end time after the start time."); return;
      }
      if (breakMinutes >= endMinutes - startMinutes) { toast("Your break needs to be shorter than the session."); return; }
      const conflicting = state.sessions.find(session => session.id !== editingSessionId && session.date === dateToISO(date) &&
        startMinutes < sessionEnd(session) && endMinutes > sessionStart(session));
      if (conflicting) { toast(`That time overlaps your ${conflicting.subject} session.`); return; }
      const existing = state.sessions.find(session => session.id === editingSessionId);
      const session = {
        id: editingSessionId || id(),
        date: dateToISO(date),
        day: (date.getDay() + 6) % 7,
        startMinutes,
        endMinutes,
        breakMinutes,
        subject,
        topic,
        description,
        done: existing ? existing.done : false,
        ...(existing && existing.completedAt ? { completedAt: existing.completedAt } : {})
      };
      if (existing) state.sessions = state.sessions.map(item => item.id === existing.id ? session : item);
      else state.sessions.push(session);
      state.weekStart = dateToISO(startOfWeek(date));
      state.weekDate = dateToISO(date);
      state.timetableDayFilter = "all";
      editingSessionId = null;
      const saved = rerender();
      if (saved) toast(existing ? "Changes saved. Your updated session is in Your week at a glance." : "Study session saved. Find it in Your week at a glance.");
    } else if (form.dataset.form === "goal") {
      const type = String(data.get("type") || "weekly");
      const goal = {
        id: id(),
        title: String(data.get("title") || "").trim(),
        detail: String(data.get("detail") || "").trim(),
        done: false,
        type
      };
      if (type === "subject") {
        goal.subject = String(data.get("subject") || "");
        if (!goal.subject) { toast("Choose a subject for this goal."); return; }
      } else if (type === "topic") {
        goal.topicKey = String(data.get("topicKey") || "");
        if (!state.selectedTopics.some(topic => topicKey(topic.subject, topic.level, topic.title) === goal.topicKey)) {
          toast("Choose a selected topic for this completion goal."); return;
        }
      }
      state.goals.push(goal);
      const saved = rerender();
      if (saved) toast("A new intention, just for you. 🌱");
    } else if (form.dataset.form === "note") {
      const note = {
        id: editingNoteId || id(),
        title: String(data.get("title") || "").trim(),
        subject: String(data.get("subject") || ""),
        body: String(data.get("body") || "").trim(),
        date: todayString()
      };
      if (editingNoteId) {
        const existing = state.notes.find(item => item.id === editingNoteId);
        if (!existing) { toast("This note could not be found. Please reopen it and try again."); return; }
        state.notes = state.notes.map(item => item.id === editingNoteId ? note : item);
      } else state.notes.push(note);
      editingNoteId = null;
      const saved = rerender();
      if (saved) toast("Your note was saved. 📝");
    }
  });
  document.addEventListener("input", event => {
    if (event.target.id === "subject-search") filterSubjects();
    if (event.target.id === "topic-search") refreshTopicLibrary();
    if (event.target.id === "note-search") refreshNotes();
    if (event.target.id === "career-search") {
      state.careerPreferences.search = event.target.value;
      persist();
      refreshCareerCards();
    }
    if (event.target.closest('form[data-form="session"]')) updateSessionPreview();
  });
  document.addEventListener("change", event => {
    if (event.target.id === "subject-category") filterSubjects();
    if (event.target.id === "topic-filter" || event.target.id === "topic-level-filter") refreshTopicLibrary();
    if (event.target.id === "career-area") {
      state.careerPreferences.area = event.target.value;
      persist();
      refreshCareerCards();
    }
    if (event.target.id === "career-match-only") {
      state.careerPreferences.matchOnly = event.target.checked;
      persist();
      refreshCareerCards();
    }
    if (event.target.matches("[data-career-subject]")) {
      const selected = new Set(state.careerPreferences.subjects);
      if (event.target.checked) selected.add(event.target.value);
      else selected.delete(event.target.value);
      state.careerPreferences.subjects = [...selected];
      persist();
      refreshCareerCards();
    }
    if (event.target.dataset.action === "subject-level") {
      const name = event.target.dataset.name;
      const subject = selectedSubject(name);
      if (subject && subject.level !== event.target.value) {
        subject.level = event.target.value;
        state.selectedTopics = state.selectedTopics.filter(topic => topic.subject !== name);
        rerender(); toast("Academic level updated. Choose topics for your new level.");
      }
    }
    if (event.target.id === "session-subject") updateTimetableTopics(event.target.value);
    if (event.target.id === "goal-type") {
      const type = event.target.value;
      const subjectField = document.getElementById("goal-subject-field");
      const subjectSelect = subjectField?.querySelector("select");
      const topicField = document.getElementById("goal-topic-field");
      const topicSelect = topicField?.querySelector("select");
      if (subjectField) subjectField.hidden = type !== "subject";
      if (subjectSelect) subjectSelect.required = type === "subject";
      if (topicField) topicField.hidden = type !== "topic";
      if (topicSelect) topicSelect.required = type === "topic";
    }
    if (event.target.id === "week-start-date") {
      const date = parseDate(event.target.value);
      if (date) {
        state.weekDate = dateToISO(date);
        state.weekStart = dateToISO(startOfWeek(date));
        state.timetableDayFilter = "all";
        editingSessionId = null;
        rerender();
      }
    }
    if (event.target.id === "week-month" || event.target.id === "week-year") {
      const current = parseDate(state.weekDate) || parseDate(state.weekStart) || startOfWeek(new Date());
      const month = Number(document.getElementById("week-month")?.value ?? current.getMonth());
      const year = Number(document.getElementById("week-year")?.value ?? current.getFullYear());
      if (!Number.isInteger(year) || year < 1 || year > 9999) {
        toast("Choose a year from 1 to 9999.");
        event.target.value = String(current.getFullYear());
        return;
      }
      const day = Math.min(current.getDate(), localDate(year, month + 1, 0).getDate());
      const date = localDate(year, month, day);
      state.weekDate = dateToISO(date);
      state.weekStart = dateToISO(startOfWeek(date));
      state.timetableDayFilter = "all";
      editingSessionId = null;
      rerender();
    }
    if (event.target.id === "week-day-filter") {
      state.timetableDayFilter = event.target.value;
      rerender();
    }
    if (event.target.id === "session-day") {
      const monday = parseDate(state.weekStart) || startOfWeek(new Date());
      const dateField = document.getElementById("session-date");
      if (dateField) dateField.value = dateToISO(addDays(monday, Number(event.target.value)));
    }
    if (event.target.id === "session-date") {
      const date = parseDate(event.target.value);
      const dayField = document.getElementById("session-day");
      if (date && dayField) dayField.value = String((date.getDay() + 6) % 7);
    }
    if (event.target.id === "session-topic") {
      const customField = document.getElementById("custom-topic-field");
      const customInput = customField?.querySelector("input");
      if (customField) customField.hidden = event.target.value !== "__custom__";
      if (customInput) customInput.required = event.target.value === "__custom__";
    }
    if (event.target.closest('form[data-form="session"]')) updateSessionPreview();
  });
  function updateTimetableTopics(subject) {
    const select = document.getElementById("session-topic");
    const customField = document.getElementById("custom-topic-field");
    if (!select) return;
    select.innerHTML = timetableTopicOptions(subject);
    if (customField) customField.hidden = true;
    if (customField) customField.querySelector("input").required = false;
  }
  function beginSessionEdit(sessionId) {
    const session = state.sessions.find(item => item.id === sessionId);
    const form = document.querySelector('form[data-form="session"]');
    if (!session || !form) return;
    editingSessionId = sessionId;
    const subjectField = form.elements.namedItem("subject");
    if (![...subjectField.options].some(option => option.value === session.subject)) {
      const option = document.createElement("option");
      option.value = session.subject;
      option.textContent = session.subject;
      subjectField.add(option);
    }
    subjectField.value = session.subject;
    updateTimetableTopics(session.subject);
    const topicChoice = form.elements.namedItem("topicChoice");
    const topic = state.selectedTopics.find(item => item.subject === session.subject && item.title === session.topic);
    if (topic) topicChoice.value = topicKey(topic.subject, topic.level, topic.title);
    else {
      topicChoice.value = "__custom__";
      const customField = document.getElementById("custom-topic-field");
      if (customField) {
        customField.hidden = false;
        customField.querySelector("input").required = true;
      }
      form.elements.namedItem("customTopic").value = session.topic;
    }
    form.elements.namedItem("date").value = session.date;
    form.elements.namedItem("day").value = String((parseDate(session.date).getDay() + 6) % 7);
    form.elements.namedItem("startMinutes").value = formatTimeInput(sessionStart(session));
    form.elements.namedItem("endMinutes").value = formatTimeInput(sessionEnd(session));
    form.elements.namedItem("breakMinutes").value = String(session.breakMinutes);
    form.elements.namedItem("description").value = session.description || "";
    document.getElementById("session-form-heading").textContent = "Edit your study session";
    document.getElementById("save-session-button").textContent = "Save Changes";
    document.getElementById("cancel-session-edit").hidden = false;
    updateSessionPreview();
    document.getElementById("add-session").scrollIntoView({ behavior: "smooth", block: "start" });
  }
})();
