import { invoke } from "@tauri-apps/api/core";

let nameInputEl: HTMLInputElement | null;
let nameFormEl: HTMLFormElement | null;
let nameSectionEl: HTMLElement | null;
let userNameEl: HTMLElement | null;
let helloGreetingSectionEl: HTMLElement | null; // change to log section
let currentMonthYearEl: HTMLElement | null;
let calendarBody: HTMLElement | null;
let prevMonthButton: HTMLElement | null;
let nextMonthButton: HTMLElement | null;
let todayDateEl: HTMLElement | null;
let weeklySummaryEl: HTMLElement | null;
let monthlySummaryEl: HTMLElement | null;
let calorieModalEl: HTMLElement | null;
let sleepModalEl: HTMLElement | null;
let sleepFormEl: HTMLFormElement | null;
let sleepCancelBtn: HTMLElement | null;
let sleepFeedbackEl: HTMLElement | null;
let sleepDateInput: HTMLInputElement | null;
let calorieFormEl: HTMLFormElement | null;
let calorieCancelBtn: HTMLElement | null;
let calorieFeedbackEl: HTMLElement | null;
let calorieDateInput: HTMLInputElement | null;
let workoutModalEl: HTMLElement | null;
let workoutFormEl: HTMLFormElement | null;
let workoutCancelBtn: HTMLElement | null;
let workoutDateInput: HTMLInputElement | null;
let workoutFeedbackEl: HTMLElement | null;
let viewEntriesModalEl: HTMLElement | null;
let entriesListEl: HTMLElement | null;
let entriesDateHeadingEl: HTMLElement | null;
let addEntryForDateBtn: HTMLElement | null;
let closeEntriesBtn: HTMLElement | null;

let currentDate = new Date();

// show name input section
function showNameSection() {
  if (nameSectionEl && helloGreetingSectionEl) {
    nameSectionEl.style.display = "block";
    helloGreetingSectionEl.style.display = "none";
  }
}

// show hello section with user's name
function showHelloSection(name: string) {
  if (nameSectionEl && helloGreetingSectionEl && userNameEl) {
    nameSectionEl.style.display = "none";
    helloGreetingSectionEl.style.display = "block";
    userNameEl.textContent = name;
  }
}

// iso week key, matches python side: YYYY-Www
function getWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tmp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

function getMonthKey(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${m.toString().padStart(2, "0")}`; // YYYY-MM
}

function getWeekRange(d: Date): { start: Date; end: Date } {
  const start = new Date(d);
  // sunday of this week
  start.setDate(d.getDate() - d.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // saturday
  return { start, end };
}


// render the calendar for the current month
async function renderCalendar(): Promise<void> {
  if (!calendarBody || !currentMonthYearEl) return;

  calendarBody.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDateNum = today.getDate();

  currentMonthYearEl.textContent = `${new Date(year, month).toLocaleString("default", { month: "long" })} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // load entries (calories + sleep + workouts) so calendar can be marked for any type
  const calorieEntries = await getCalorieEntries();
  const sleepEntries = await getSleepEntries();
  const workoutEntries = await getWorkoutEntries();
  const entries = [
    ...calorieEntries.map((e: any) => ({ ...e, _type: "calorie" })),
    ...sleepEntries.map((e: any) => ({ ...e, _type: "sleep" })),
    ...workoutEntries.map((e: any) => ({ ...e, _type: "workout" })),
  ];

  let date = 1;
  for (let i = 0; i < 6; i++) {
    const row = document.createElement("tr");
    for (let j = 0; j < 7; j++) {
      const cell = document.createElement("td");
      if (i === 0 && j < firstDayOfMonth) {
        cell.textContent = "";
      } else if (date > daysInMonth) {
        cell.textContent = "";
      } else {
        cell.textContent = date.toString();

        const cellDate = new Date(year, month, date);
        const cellDateStr = cellDate.toISOString().slice(0, 10); // YYYY-MM-DD
        cell.setAttribute("data-date", cellDateStr);

        const matching = entries.filter((e: any) => (e.timestamp || "").startsWith(cellDateStr));
        if (matching.length > 0) {
          cell.classList.add("has-entry");
          cell.setAttribute("data-count", String(matching.length));
        }

        if (year === todayYear && month === todayMonth && date === todayDateNum) {
          cell.classList.add("today");
          cell.setAttribute("aria-current", "date");
        }

        cell.addEventListener("click", () => {
          openViewModal(cellDateStr);
        });

        date++;
      }
      row.appendChild(cell);
    }
    calendarBody.appendChild(row);
    if (date > daysInMonth) break;
  }
}

// helper: compute weekly/monthly averages from entries in JS
function calculateAveragesForEntries(entries: any[], valueKey: string) {
  const dailyTotals = new Map<string, number>();

  for (const e of entries) {
    const ts = e.timestamp;
    if (!ts) continue;
    const d = ts.slice(0, 10); // YYYY-MM-DD
    const val = Number(e[valueKey] ?? 0);
    if (Number.isNaN(val)) continue;
    dailyTotals.set(d, (dailyTotals.get(d) ?? 0) + val);
  }

  const weeklyRaw = new Map<string, { sum: number; days: number }>();
  const monthlyRaw = new Map<string, { sum: number; days: number }>();

  for (const [dayStr, total] of dailyTotals.entries()) {
    const dt = new Date(dayStr + "T00:00:00");
    const weekKey = getWeekKey(dt);
    const monthKey = getMonthKey(dt);

    const w = weeklyRaw.get(weekKey) ?? { sum: 0, days: 0 };
    w.sum += total;
    w.days += 1;
    weeklyRaw.set(weekKey, w);

    const m = monthlyRaw.get(monthKey) ?? { sum: 0, days: 0 };
    m.sum += total;
    m.days += 1;
    monthlyRaw.set(monthKey, m);
  }

  const weekly: Record<string, number> = {};
  weeklyRaw.forEach((v, k) => {
    if (v.days > 0) weekly[k] = v.sum / v.days;
  });

  const monthly: Record<string, number> = {};
  monthlyRaw.forEach((v, k) => {
    if (v.days > 0) monthly[k] = v.sum / v.days;
  });

  return { weekly, monthly };
}

async function updateAverages(): Promise<void> {
  if (!weeklySummaryEl || !monthlySummaryEl) return;

  let calAvgs: any;
  let sleepAvgs: any;
  let workoutAvgs: any;

  // try backend first; if not available, compute in js
  try {
    [calAvgs, sleepAvgs, workoutAvgs] = await Promise.all([
      invoke<any>("get_calorie_averages"),
      invoke<any>("get_sleep_averages"),
      invoke<any>("get_workout_averages"),
    ]);
  } catch {
    const [calEntries, sleepEntries, workoutEntries] = await Promise.all([
      getCalorieEntries(),
      getSleepEntries(),
      getWorkoutEntries(),
    ]);

    calAvgs = calculateAveragesForEntries(calEntries, "calories");
    sleepAvgs = calculateAveragesForEntries(sleepEntries, "hours");
    workoutAvgs = calculateAveragesForEntries(workoutEntries, "duration");
  }

  const weekKey = getWeekKey(currentDate);
  const monthKey = getMonthKey(currentDate);

  const weekCal = calAvgs?.weekly?.[weekKey] ?? 0;
  const weekSleep = sleepAvgs?.weekly?.[weekKey] ?? 0;
  const weekWorkout = workoutAvgs?.weekly?.[weekKey] ?? 0;

  const monthCal = calAvgs?.monthly?.[monthKey] ?? 0;
  const monthSleep = sleepAvgs?.monthly?.[monthKey] ?? 0;
  const monthWorkout = workoutAvgs?.monthly?.[monthKey] ?? 0;

  // build labels
  const { start, end } = getWeekRange(currentDate);
  const weekStartMonth = start.toLocaleString("default", { month: "short" });
  const weekEndMonth = end.toLocaleString("default", { month: "short" });

  let weekLabel: string;

  // if the week stays in the same month:
  if (weekStartMonth === weekEndMonth) {
    weekLabel = `Week of ${weekStartMonth} ${start.getDate()}–${end.getDate()}:`;
  } else {
    // if the week spans two months:
    weekLabel = `Week of ${weekStartMonth} ${start.getDate()}–${weekEndMonth} ${end.getDate()}:`;
  }


  const monthLabel = `${currentDate.toLocaleString("default", {
    month: "long",
  })} ${currentDate.getFullYear()}:`;

  weeklySummaryEl.textContent =
    `${weekLabel} ` +
    `avg calories/day ${weekCal.toFixed(0)}, ` +
    `avg sleep ${weekSleep.toFixed(1)} hrs/day, ` +
    `avg workout ${weekWorkout.toFixed(1)} min/day`;

  monthlySummaryEl.textContent =
    `${monthLabel} ` +
    `avg calories/day ${monthCal.toFixed(0)}, ` +
    `avg sleep ${monthSleep.toFixed(1)} hrs/day, ` +
    `avg workout ${monthWorkout.toFixed(1)} min/day`;
}



// get calorie entries from native backend or localstorage
async function getCalorieEntries(): Promise<any[]> {
  try {
    const native = await invoke<any>("get_calories");
    if (Array.isArray(native)) return native;
  } catch (err) {
    // ignore - fallback to localstorage
  }

  const raw = localStorage.getItem("calorie-entries");
  return raw ? JSON.parse(raw) : [];
}

// get sleep entries from native backend or localstorage
async function getSleepEntries(): Promise<any[]> {
  try {
    const native = await invoke<any>("get_sleep");
    if (Array.isArray(native)) return native;
  } catch (err) {
    // ignore - fallback to localstorage
  }

  const raw = localStorage.getItem("sleep-entries");
  return raw ? JSON.parse(raw) : [];
}

// get workout entries from native backend or localstorage
async function getWorkoutEntries(): Promise<any[]> {
  try {
    const native = await invoke<any>("get_workouts");
    if (Array.isArray(native)) return native;
  } catch (err) {
    // ignore - fallback to localstorage
  }
  const raw = localStorage.getItem("workout-entries");
  return raw ? JSON.parse(raw) : [];
}

// format iso date (YYYY-MM-DD) to readable display
function formatDateDisplay(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// open the view entries modal for a specific date
async function openViewModal(dateStr: string) {
  if (!viewEntriesModalEl || !entriesListEl || !entriesDateHeadingEl || !calorieDateInput) return;
  entriesDateHeadingEl.textContent = `Entries for ${formatDateDisplay(dateStr)}`;

  const calorieEntries = await getCalorieEntries();
  const sleepEntries = await getSleepEntries();
  const workoutEntries = await getWorkoutEntries();

  const dayCalories = calorieEntries.filter((e: any) => (e.timestamp || "").startsWith(dateStr));
  const daySleep = sleepEntries.filter((e: any) => (e.timestamp || "").startsWith(dateStr));
  const dayWorkouts = workoutEntries.filter((e: any) => (e.timestamp || "").startsWith(dateStr));

  const container = document.createElement("div");

  // nutrition section
  const nutHeading = document.createElement("h4");
  nutHeading.textContent = "Nutrition";
  container.appendChild(nutHeading);
  if (dayCalories.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No nutrition entries for this date.";
    container.appendChild(p);
  } else {
    const list = document.createElement("ul");
    for (const e of dayCalories) {
      const li = document.createElement("li");
      const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      li.textContent = `${time} — ${e.food} (${e.calories} cal)`;
      list.appendChild(li);
    }
    container.appendChild(list);
  }

  // sleep section
  const sleepHeading = document.createElement("h4");
  sleepHeading.textContent = "Sleep";
  container.appendChild(sleepHeading);
  if (daySleep.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No sleep entries for this date.";
    container.appendChild(p);
  } else {
    const list = document.createElement("ul");
    for (const e of daySleep) {
      const li = document.createElement("li");
      const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      li.textContent = `${time} — ${e.hours} hours slept`;
      list.appendChild(li);
    }
    container.appendChild(list);
  }

  // workout section
  const workoutHeading = document.createElement("h4");
  workoutHeading.textContent = "Workouts";
  container.appendChild(workoutHeading);
  if (dayWorkouts.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No workout entries for this date.";
    container.appendChild(p);
  } else {
    const list = document.createElement("ul");
    for (const e of dayWorkouts) {
      const li = document.createElement("li");
      const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      const label = e.type ?? e.exercise ?? "Workout";
      li.textContent = `${time} — ${label} (${e.duration} minutes)`;
      list.appendChild(li);
    }
    container.appendChild(list);
  }

  entriesListEl.innerHTML = "";
  entriesListEl.appendChild(container);

  // set hidden date input so adding an entry will default to this date
  calorieDateInput.value = dateStr;

  viewEntriesModalEl.classList.add("active");
  viewEntriesModalEl.setAttribute("aria-hidden", "false");
}

// close the view entries modal
function closeViewModal() {
  if (!viewEntriesModalEl) return;
  viewEntriesModalEl.classList.remove("active");
  viewEntriesModalEl.setAttribute("aria-hidden", "true");
}

// update the today date element
function updateTodayDate(): void {
  if (!todayDateEl) return;
  const today = new Date();
  todayDateEl.textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// initialize after dom is loaded
window.addEventListener("DOMContentLoaded", () => {
  nameInputEl = document.querySelector("#name-input");
  nameFormEl = document.querySelector("#name-form");
  nameSectionEl = document.querySelector("#name-section");
  helloGreetingSectionEl = document.querySelector("#hello-section");
  userNameEl = document.querySelector("#user-name");
  currentMonthYearEl = document.querySelector("#month-year");
  calendarBody = document.querySelector("#calendar-body");
  prevMonthButton = document.querySelector("#prev-month");
  nextMonthButton = document.querySelector("#next-month");
  todayDateEl = document.querySelector("#today-date");
  weeklySummaryEl = document.querySelector("#weekly-summary");
  monthlySummaryEl = document.querySelector("#monthly-summary");
  calorieModalEl = document.querySelector("#calorie-modal");
  calorieFormEl = document.querySelector("#calorie-form");
  calorieCancelBtn = document.querySelector("#calorie-cancel");
  calorieFeedbackEl = document.querySelector("#calorie-feedback");
  calorieDateInput = document.querySelector("#calorie-date");
  sleepModalEl = document.querySelector("#sleep-modal");
  sleepFormEl = document.querySelector("#sleep-form");
  sleepCancelBtn = document.querySelector("#sleep-cancel");
  sleepFeedbackEl = document.querySelector("#sleep-feedback");
  sleepDateInput = document.querySelector("#sleep-date");
  workoutModalEl = document.querySelector("#workout-modal");
  workoutFormEl = document.querySelector("#workout-form");
  workoutCancelBtn = document.querySelector("#workout-cancel");
  workoutFeedbackEl = document.querySelector("#workout-feedback");
  workoutDateInput = document.querySelector("#workout-date");
  viewEntriesModalEl = document.querySelector("#view-entries-modal");
  entriesListEl = document.querySelector("#entries-list");
  entriesDateHeadingEl = document.querySelector("#entries-date-heading");
  addEntryForDateBtn = document.querySelector("#add-entry-for-date");
  closeEntriesBtn = document.querySelector("#close-entries");
  const storedName = localStorage.getItem("user-name");
  const logNutritionButton = document.querySelector("#log-nutrition");
  const logSleepButton = document.querySelector("#log-sleep");
  const logWorkoutButton = document.querySelector("#log-exercise");

  if (storedName) {
    showHelloSection(storedName);
    renderCalendar();
    updateAverages();
    updateTodayDate();
  } else {
    showNameSection();
  }

  if (prevMonthButton) {
    prevMonthButton.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
      updateAverages();
    });
  }

  if (nextMonthButton) {
    nextMonthButton.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
      updateAverages();
    });
  }

  nameFormEl?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (nameInputEl && nameInputEl.value.trim()) {
      localStorage.setItem("user-name", nameInputEl.value.trim());
      showHelloSection(nameInputEl.value.trim());
      renderCalendar();
      updateAverages();
      updateTodayDate();
    }
  });

  logNutritionButton?.addEventListener("click", () => {
    if (calorieModalEl) {
      if (calorieDateInput) calorieDateInput.value = "";
      calorieModalEl.classList.add("active");
    }
  });

  calorieCancelBtn?.addEventListener("click", () => {
    if (calorieModalEl) {
      calorieModalEl.classList.remove("active");
    }
  });

  logSleepButton?.addEventListener("click", () => {
    if (sleepModalEl) {
      if (sleepDateInput) sleepDateInput.value = "";
      sleepModalEl.classList.add("active");
    }
  });

  sleepCancelBtn?.addEventListener("click", () => {
    if (sleepModalEl) {
      sleepModalEl.classList.remove("active");
    }
  });

  logWorkoutButton?.addEventListener("click", () => {
    if (workoutModalEl) {
      if (workoutDateInput) workoutDateInput.value = "";
      workoutModalEl.classList.add("active");
    }
  });

  workoutCancelBtn?.addEventListener("click", () => {
    if (workoutModalEl) {
      workoutModalEl.classList.remove("active");
    }
  });

  closeEntriesBtn?.addEventListener("click", () => closeViewModal());

  addEntryForDateBtn?.addEventListener("click", () => {
    if (viewEntriesModalEl) closeViewModal();
    if (calorieModalEl) calorieModalEl.classList.add("active");
    const foodEl = document.querySelector<HTMLInputElement>("#calorie-food");
    foodEl?.focus();
  });

  calorieFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const foodEl = document.querySelector<HTMLInputElement>("#calorie-food");
    const calsEl = document.querySelector<HTMLInputElement>("#calorie-calories");
    if (!foodEl || !calsEl) return;
    const food = foodEl.value.trim();
    const calories = Number(calsEl.value);
    if (!food || Number.isNaN(calories)) {
      if (calorieFeedbackEl) calorieFeedbackEl.textContent = "Please enter a food and a valid calorie amount.";
      return;
    }

    let savedToNative = false;
    try {
      const dateVal = (document.querySelector("#calorie-date") as HTMLInputElement | null)?.value;
      const payload: any = { food, calories };
      if (dateVal) payload.date = dateVal;
      await invoke("log_calories", payload);
      savedToNative = true;
      if (calorieFeedbackEl) calorieFeedbackEl.textContent = `Saved ${calories} cal to app storage.`;
    } catch (err) {
      savedToNative = false;
    }

    if (!savedToNative) {
      const key = "calorie-entries";
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const dateVal = (document.querySelector("#calorie-date") as HTMLInputElement | null)?.value;
      const timestamp = dateVal ? new Date(dateVal + "T12:00:00").toISOString() : new Date().toISOString();
      existing.push({ food, calories, timestamp });
      localStorage.setItem(key, JSON.stringify(existing));
      if (calorieFeedbackEl) calorieFeedbackEl.textContent = "Saved locally (app backend unavailable).";
    }

    calorieFormEl?.reset();
    if (calorieDateInput) calorieDateInput.value = "";
    await renderCalendar();
    await updateAverages();
    setTimeout(() => {
      if (calorieModalEl) calorieModalEl.classList.remove("active");
    }, 700);
  });

  sleepFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sleepHoursEl = document.querySelector<HTMLInputElement>("#sleep-hours");
    if (!sleepHoursEl) return;
    const sleepHours = Number(sleepHoursEl.value);
    if (isNaN(sleepHours) || sleepHours <= 0) {
      if (sleepFeedbackEl) sleepFeedbackEl.textContent = "Please enter a valid number of hours slept.";
      return;
    }

    let savedToNative = false;
    try {
      const dateVal = (document.querySelector("#sleep-date") as HTMLInputElement | null)?.value;
      const payload: any = { hours: sleepHours };
      if (dateVal) payload.date = dateVal;
      await invoke("log_sleep", payload);
      savedToNative = true;
      if (sleepFeedbackEl) sleepFeedbackEl.textContent = `Saved ${sleepHours} hours to app storage.`;
    } catch (err) {
      savedToNative = false;
    }

    if (!savedToNative) {
      const key = "sleep-entries";
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const dateVal = (document.querySelector("#sleep-date") as HTMLInputElement | null)?.value;
      const timestamp = dateVal ? new Date(dateVal + "T12:00:00").toISOString() : new Date().toISOString();
      existing.push({ hours: sleepHours, timestamp });
      localStorage.setItem(key, JSON.stringify(existing));
      if (sleepFeedbackEl) sleepFeedbackEl.textContent = "Saved locally (app backend unavailable).";
    }

    sleepFormEl?.reset();
    if (sleepDateInput) sleepDateInput.value = "";
    await renderCalendar();
    await updateAverages();
    setTimeout(() => {
      if (sleepModalEl) sleepModalEl.classList.remove("active");
    }, 700);
  });

  workoutFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const workoutTypeEl = document.querySelector<HTMLInputElement>("#workout-type");
    const workoutDurationEl = document.querySelector<HTMLInputElement>("#workout-duration");

    if (!workoutTypeEl || !workoutDurationEl) return;
    const workoutType = workoutTypeEl.value.trim();
    const workoutDuration = Number(workoutDurationEl.value);
    if (!workoutType || Number.isNaN(workoutDuration)) {
      if (workoutFeedbackEl) workoutFeedbackEl.textContent = "Please enter a workout type and a valid duration.";
      return;
    }

    let savedToNative = false;
    try {
      const dateVal = (document.querySelector("#workout-date") as HTMLInputElement | null)?.value;
      const payload: any = { type: workoutType, duration: workoutDuration };
      if (dateVal) payload.date = dateVal;
      await invoke("log_workout", payload);
      savedToNative = true;
      if (workoutFeedbackEl) workoutFeedbackEl.textContent = `Saved ${workoutType} workout to app storage.`;
    } catch (err) {
      savedToNative = false;
    }

    if (!savedToNative) {
      const key = "workout-entries";
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const dateVal = (document.querySelector("#workout-date") as HTMLInputElement | null)?.value;
      const timestamp = dateVal ? new Date(dateVal + "T12:00:00").toISOString() : new Date().toISOString();
      existing.push({ type: workoutType, duration: workoutDuration, timestamp });
      localStorage.setItem(key, JSON.stringify(existing));
      if (workoutFeedbackEl) workoutFeedbackEl.textContent = "Saved locally (app backend unavailable).";
    }

    workoutFormEl?.reset();
    if (workoutDateInput) workoutDateInput.value = "";
    await renderCalendar();
    await updateAverages();
    setTimeout(() => {
      if (workoutModalEl) workoutModalEl.classList.remove("active");
    }, 700);
  });
});
