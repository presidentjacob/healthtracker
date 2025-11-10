import { invoke } from "@tauri-apps/api/core";

let nameInputEl: HTMLInputElement | null;
let nameFormEl: HTMLFormElement | null;
let nameSectionEl: HTMLElement | null;
let userNameEl: HTMLElement | null;
let helloGreetingSectionEl: HTMLElement | null; // change to log section

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

window.addEventListener("DOMContentLoaded", () => {
  nameInputEl = document.querySelector("#name-input");
  nameFormEl = document.querySelector("#name-form");
  nameSectionEl = document.querySelector("#name-section");
  helloGreetingSectionEl = document.querySelector("#hello-section");
  userNameEl = document.querySelector("#user-name");

  const storedName = localStorage.getItem("user-name");
  // Need to add a location to skip the name section if there is a stored name

  if (storedName) {
    showHelloSection(storedName);
  } else {
    showNameSection();
  }

  nameFormEl?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (nameInputEl && nameInputEl.value.trim()) {
      localStorage.setItem("user-name", nameInputEl.value.trim());
      showHelloSection(nameInputEl.value.trim());
    }
  });
});