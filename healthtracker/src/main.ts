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
let viewEntriesModalEl: HTMLElement | null;
let entriesListEl: HTMLElement | null;
let entriesDateHeadingEl: HTMLElement | null;
let addEntryForDateBtn: HTMLElement | null;
let closeEntriesBtn: HTMLElement | null;

let currentDate = new Date();

// Show name input section
function showNameSection() {
  if (nameSectionEl && helloGreetingSectionEl) {
    nameSectionEl.style.display = "block";
    helloGreetingSectionEl.style.display = "none";
  }
}

// Show hello section with user's name
function showHelloSection(name: string) {
  if (nameSectionEl && helloGreetingSectionEl && userNameEl) {
    nameSectionEl.style.display = "none";
    helloGreetingSectionEl.style.display = "block";
    userNameEl.textContent = name;
  }
}

// Render the calendar for the current month
async function renderCalendar(): Promise<void> {
  if (!calendarBody || !currentMonthYearEl) return;

  calendarBody.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDateNum = today.getDate();

  currentMonthYearEl.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Load entries (calories + sleep) so calendar can be marked for any type
  const calorieEntries = await getCalorieEntries();
  const sleepEntries = await getSleepEntries();
  const entries = [
    ...calorieEntries.map((e: any) => ({ ...e, _type: 'calorie' })),
    ...sleepEntries.map((e: any) => ({ ...e, _type: 'sleep' })),
  ];

  // Create the calendar cells
  let date = 1;
  // Maximum 6 weeks in a month view
  for (let i = 0; i < 6; i++) {
    const row = document.createElement('tr');
    for (let j = 0; j < 7; j++) {
      const cell = document.createElement('td');
      if (i === 0 && j < firstDayOfMonth) {
        cell.textContent = '';
      } else if (date > daysInMonth) {
        cell.textContent = '';
      } else {
        cell.textContent = date.toString();

        const cellDate = new Date(year, month, date);
        const cellDateStr = cellDate.toISOString().slice(0, 10); // YYYY-MM-DD
        cell.setAttribute('data-date', cellDateStr);

        // mark cell if entries exist for that date
        const matching = entries.filter((e: any) => (e.timestamp || '').startsWith(cellDateStr));
        if (matching.length > 0) {
          cell.classList.add('has-entry');
          cell.setAttribute('data-count', String(matching.length));
        }

        if (year === todayYear && month === todayMonth && date === todayDateNum) {
          cell.classList.add('today');
          cell.setAttribute('aria-current', 'date');
        }

        // clicking a date opens the view modal
        cell.addEventListener('click', () => {
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

// Get calorie entries from native backend or localStorage
async function getCalorieEntries(): Promise<any[]> {
  // Try native backend first
  try {
    const native = await invoke('get_calories');
    if (Array.isArray(native)) return native;
  } catch (err) {
    // ignore - fallback to localStorage
  }

  const raw = localStorage.getItem('calorie-entries');
  return raw ? JSON.parse(raw) : [];
}

// Get sleep entries from native backend or localStorage
async function getSleepEntries(): Promise<any[]> {
  try {
    const native = await invoke('get_sleep');
    if (Array.isArray(native)) return native;
  } catch (err) {
    // ignore - fallback to localStorage
  }

  const raw = localStorage.getItem('sleep-entries');
  return raw ? JSON.parse(raw) : [];
}

// Format ISO date (YYYY-MM-DD) to readable display
function formatDateDisplay(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// Open the view entries modal for a specific date
async function openViewModal(dateStr: string) {
  if (!viewEntriesModalEl || !entriesListEl || !entriesDateHeadingEl || !calorieDateInput) return;
  entriesDateHeadingEl.textContent = `Entries for ${formatDateDisplay(dateStr)}`;

  // load both nutrition and sleep entries for the date and render grouped
  const calorieEntries = await getCalorieEntries();
  const sleepEntries = await getSleepEntries();

  const dayCalories = calorieEntries.filter((e: any) => (e.timestamp || '').startsWith(dateStr));
  const daySleep = sleepEntries.filter((e: any) => (e.timestamp || '').startsWith(dateStr));

  // build content
  const container = document.createElement('div');

  // Nutrition section
  const nutHeading = document.createElement('h4');
  nutHeading.textContent = 'Nutrition';
  container.appendChild(nutHeading);
  if (dayCalories.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No nutrition entries for this date.';
    container.appendChild(p);
  } else {
    const list = document.createElement('ul');
    for (const e of dayCalories) {
      const li = document.createElement('li');
      const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      li.textContent = `${time} — ${e.food} (${e.calories} cal)`;
      list.appendChild(li);
    }
    container.appendChild(list);
  }

  // Sleep section
  const sleepHeading = document.createElement('h4');
  sleepHeading.textContent = 'Sleep';
  container.appendChild(sleepHeading);
  if (daySleep.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No sleep entries for this date.';
    container.appendChild(p);
  } else {
    const list = document.createElement('ul');
    for (const e of daySleep) {
      const li = document.createElement('li');
      const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      li.textContent = `${time} — ${e.hours} hours slept`;
      list.appendChild(li);
    }
    container.appendChild(list);
  }

  entriesListEl.innerHTML = '';
  entriesListEl.appendChild(container);

  // set hidden date input so adding an entry will default to this date
  calorieDateInput.value = dateStr;

  viewEntriesModalEl.classList.add('active');
  viewEntriesModalEl.setAttribute('aria-hidden', 'false');
}

// Close the view entries modal
function closeViewModal() {
  if (!viewEntriesModalEl) return;
  viewEntriesModalEl.classList.remove('active');
  viewEntriesModalEl.setAttribute('aria-hidden', 'true');
}

// Update the Today date element
function updateTodayDate(): void {
  if (!todayDateEl) return;
  const today = new Date();
  // Format like: Weekday, Month Day, Year
  todayDateEl.textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Initialize after DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  nameInputEl = document.querySelector("#name-input");
  nameFormEl = document.querySelector("#name-form");
  nameSectionEl = document.querySelector("#name-section");
  helloGreetingSectionEl = document.querySelector("#hello-section");
  userNameEl = document.querySelector("#user-name");
  // Assign DOM elements to the outer variables so other functions can use them
  currentMonthYearEl = document.querySelector("#month-year");
  calendarBody = document.querySelector("#calendar-body");
  prevMonthButton = document.querySelector("#prev-month");
  nextMonthButton = document.querySelector("#next-month");
  todayDateEl = document.querySelector("#today-date");
  calorieModalEl = document.querySelector("#calorie-modal");
  calorieFormEl = document.querySelector("#calorie-form");
  calorieCancelBtn = document.querySelector("#calorie-cancel");
  calorieFeedbackEl = document.querySelector("#calorie-feedback");
  calorieDateInput = document.querySelector('#calorie-date');
  sleepModalEl = document.querySelector("#sleep-modal");
  sleepFormEl = document.querySelector("#sleep-form");
  sleepCancelBtn = document.querySelector("#sleep-cancel");
  sleepFeedbackEl = document.querySelector("#sleep-feedback");
  sleepDateInput = document.querySelector('#sleep-date');
  viewEntriesModalEl = document.querySelector('#view-entries-modal');
  entriesListEl = document.querySelector('#entries-list');
  entriesDateHeadingEl = document.querySelector('#entries-date-heading');
  addEntryForDateBtn = document.querySelector('#add-entry-for-date');
  closeEntriesBtn = document.querySelector('#close-entries');
  const storedName = localStorage.getItem("user-name");
  const logNutritionButton = document.querySelector("#log-nutrition");
  const logSleepButton = document.querySelector("#log-sleep");


  if (storedName) {
    showHelloSection(storedName);
    // render calendar when the hello section is shown
    renderCalendar();
    // populate the Today date element
    updateTodayDate();
  } else {
    showNameSection();
  }

  if (prevMonthButton) {
    prevMonthButton.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextMonthButton) {
    nextMonthButton.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });
  }

  nameFormEl?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (nameInputEl && nameInputEl.value.trim()) {
      localStorage.setItem("user-name", nameInputEl.value.trim());
      showHelloSection(nameInputEl.value.trim());
    }
  });

  logNutritionButton?.addEventListener("click", () => {
    if (calorieModalEl) {
      // clear any previously-set date when opened from the main button
      if (calorieDateInput) calorieDateInput.value = '';
      calorieModalEl.classList.add("active");
    }
  });

  calorieCancelBtn?.addEventListener("click", () => {
    if (calorieModalEl) {
      calorieModalEl.classList.remove("active");
    }
  });

  // -------------------------------------------------------------------------------

  logSleepButton?.addEventListener("click", () => {
    if (sleepModalEl) {
      // clear any previously-set date when opened from the main button
      if (sleepDateInput) sleepDateInput.value = '';
      sleepModalEl.classList.add("active");
    }
  });

  sleepCancelBtn?.addEventListener("click", () => {
    if (sleepModalEl) {
      sleepModalEl.classList.remove("active");
    }
  });


  closeEntriesBtn?.addEventListener('click', () => closeViewModal());

  addEntryForDateBtn?.addEventListener('click', () => {
    // open calorie modal and keep the date pre-filled
    if (viewEntriesModalEl) closeViewModal();
    if (calorieModalEl) calorieModalEl.classList.add('active');
    const foodEl = document.querySelector<HTMLInputElement>('#calorie-food');
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

    // First try to invoke the Tauri command (works inside the Tauri app). If that fails
    // (e.g. when running in the browser), fall back to saving to localStorage.
    let savedToNative = false;
    try {
      // invoke returns any; we don't need the returned entries here
      // include optional date if present
      const dateVal = (document.querySelector('#calorie-date') as HTMLInputElement | null)?.value;
      const payload: any = { food, calories };
      if (dateVal) payload.date = dateVal; // native side may accept a date field
      await invoke("log_calories", payload);
      savedToNative = true;
      if (calorieFeedbackEl) calorieFeedbackEl.textContent = `Saved ${calories} cal to app storage.`;
    } catch (err) {
      // not running inside Tauri or command failed
      savedToNative = false;
    }

    if (!savedToNative) {
      const key = "calorie-entries";
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      // if a date was provided (from view modal), use that date at noon to preserve day
      const dateVal = (document.querySelector('#calorie-date') as HTMLInputElement | null)?.value;
      const timestamp = dateVal ? new Date(dateVal + 'T12:00:00').toISOString() : new Date().toISOString();
      existing.push({ food, calories, timestamp });
      localStorage.setItem(key, JSON.stringify(existing));
      if (calorieFeedbackEl) calorieFeedbackEl.textContent = "Saved locally (app backend unavailable).";
    }

    // clear form and close modal after a moment
    calorieFormEl?.reset();
    // make sure hidden date is cleared after submitting (so main button is unaffected)
    if (calorieDateInput) calorieDateInput.value = '';
    // refresh calendar markers
    await renderCalendar();
    setTimeout(() => { if (calorieModalEl) calorieModalEl.classList.remove("active"); }, 700);
  });

  sleepFormEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sleepHoursEl = document.querySelector<HTMLInputElement>("#sleep-hours");
    if(!sleepHoursEl) return;
    const sleepHours = Number(sleepHoursEl.value);
    if( isNaN(sleepHours) || sleepHours <= 0 ) {
      if(sleepFeedbackEl) sleepFeedbackEl.textContent = "Please enter a valid number of hours slept.";
      return;
    }

    // For simplicity, we'll just log sleep data to localStorage
    let savedToNative = false;
    try {
      const dateVal = (document.querySelector('#sleep-date') as HTMLInputElement | null)?.value;
      const payload: any = { hours: sleepHours };
      if (dateVal) payload.date = dateVal;
      await invoke("log_sleep", payload);
      savedToNative = true;
      if (sleepFeedbackEl) sleepFeedbackEl.textContent = `Saved ${sleepHours} hours to app storage.`;
    } catch (err) {
      savedToNative = false;
    }

    if(!savedToNative) {
      const key = "sleep-entries";
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const dateVal = (document.querySelector('#sleep-date') as HTMLInputElement | null)?.value;
      const timestamp = dateVal ? new Date(dateVal + 'T12:00:00').toISOString() : new Date().toISOString();
      existing.push({ hours: sleepHours, timestamp });
      localStorage.setItem(key, JSON.stringify(existing));
      if(sleepFeedbackEl) sleepFeedbackEl.textContent = "Saved locally (app backend unavailable).";
    }

    sleepFormEl?.reset();
    if (sleepDateInput) sleepDateInput.value = '';
    await renderCalendar();
    setTimeout(() => { if (sleepModalEl) sleepModalEl.classList.remove("active"); }, 700);
  });
});