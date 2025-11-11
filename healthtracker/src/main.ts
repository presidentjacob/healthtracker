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
let currentDate = new Date();

function showNameSection() {
  if (nameSectionEl && helloGreetingSectionEl) {
    nameSectionEl.style.display = "block";
    helloGreetingSectionEl.style.display = "none";
  }
}

function showHelloSection(name: string) {
  if (nameSectionEl && helloGreetingSectionEl && userNameEl) {
    nameSectionEl.style.display = "none";
    helloGreetingSectionEl.style.display = "block";
    userNameEl.textContent = name;
  }
}

function renderCalendar(): void {
  // Ensure required elements exist
  if (!calendarBody || !currentMonthYearEl) return;

  // Clear previous calendar
  calendarBody.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Update header (month name and year)
  currentMonthYearEl.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long' })} ${year}`;

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let date = 1;
  for (let i = 0; i < 6; i++) {
    const row = document.createElement('tr');
    for (let j = 0; j < 7; j++) {
      const cell = document.createElement('td');
      if (i === 0 && j < firstDayOfMonth) {
        // empty cell before month starts
        cell.textContent = '';
      } else if (date > daysInMonth) {
        // empty cells after month ends
        cell.textContent = '';
      } else {
        cell.textContent = date.toString();
        date++;
      }
      row.appendChild(cell);
    }
    calendarBody.appendChild(row);
    // stop early if we've rendered all days
    if (date > daysInMonth) break;
  }
}

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
  const storedName = localStorage.getItem("user-name");


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
});