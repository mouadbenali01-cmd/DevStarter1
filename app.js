const STORAGE_KEY = "devstarter-data";

const defaultData = { tasks: [], topics: [], ideas: [] };
let data = loadData();
let activeTaskFilter = "all";

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.tasks) && Array.isArray(saved.topics) && Array.isArray(saved.ideas)
      ? saved : structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  render();
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function render() {
  const completed = data.tasks.filter(task => task.done).length;
  const total = data.tasks.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.querySelector("#completed-count").textContent = completed;
  document.querySelector("#topic-count").textContent = data.topics.length;
  document.querySelector("#idea-count").textContent = data.ideas.length;
  document.querySelector("#progress-label").textContent = `${progress}%`;
  document.querySelector("#progress-fill").style.width = `${progress}%`;

  document.querySelectorAll(".filter-button").forEach(button => {
    const selected = button.dataset.filter === activeTaskFilter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const taskList = document.querySelector("#task-list");
  taskList.replaceChildren();
  const visibleTasks = data.tasks.filter(task => {
    if (activeTaskFilter === "active") return !task.done;
    if (activeTaskFilter === "completed") return task.done;
    return true;
  });

  visibleTasks.forEach(task => {
    const item = createElement("li", `task-item${task.done ? " done" : ""}`);
    const checkbox = createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `Mark ${task.text} as ${task.done ? "incomplete" : "complete"}`);
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveData();
    });
    item.append(checkbox, createElement("span", "", task.text));
    item.append(deleteButton(() => {
      data.tasks = data.tasks.filter(entry => entry.id !== task.id);
      saveData();
    }));
    taskList.append(item);
  });

  const taskEmpty = document.querySelector("#task-empty");
  taskEmpty.hidden = visibleTasks.length > 0;
  if (total === 0) {
    taskEmpty.textContent = "No tasks yet. Add one small goal to get started.";
  } else if (visibleTasks.length === 0) {
    taskEmpty.textContent = activeTaskFilter === "active"
      ? "Great work — there are no active tasks."
      : "No completed tasks yet. Keep going!";
  }

  const topicList = document.querySelector("#topic-list");
  topicList.replaceChildren();
  data.topics.forEach(topic => {
    const chip = createElement("span", "chip", topic.name);
    const remove = createElement("button", "", "×");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${topic.name}`);
    remove.addEventListener("click", () => {
      data.topics = data.topics.filter(entry => entry.id !== topic.id);
      saveData();
    });
    chip.append(remove);
    topicList.append(chip);
  });
  toggleEmpty("#topic-empty", data.topics.length === 0);

  const ideaList = document.querySelector("#idea-list");
  ideaList.replaceChildren();
  data.ideas.forEach(idea => {
    const item = createElement("li", "idea-item");
    item.append(createElement("span", "", idea.text));
    item.append(deleteButton(() => {
      data.ideas = data.ideas.filter(entry => entry.id !== idea.id);
      saveData();
    }));
    ideaList.append(item);
  });
  toggleEmpty("#idea-empty", data.ideas.length === 0);
}

function toggleEmpty(selector, isEmpty) {
  document.querySelector(selector).hidden = !isEmpty;
}

function deleteButton(onDelete) {
  const button = createElement("button", "delete-btn", "×");
  button.type = "button";
  button.setAttribute("aria-label", "Delete item");
  button.addEventListener("click", onDelete);
  return button;
}

function addItem(formId, inputId, collection, property) {
  document.querySelector(formId).addEventListener("submit", event => {
    event.preventDefault();
    const input = document.querySelector(inputId);
    const value = input.value.trim();
    if (!value) return;
    const exists = collection === "topics" &&
      data.topics.some(topic => topic.name.toLowerCase() === value.toLowerCase());
    if (exists) {
      input.setCustomValidity("This topic is already on your list.");
      input.reportValidity();
      input.setCustomValidity("");
      return;
    }
    data[collection].push({
      id: crypto.randomUUID(),
      [property]: value,
      ...(collection === "tasks" ? { done: false } : {})
    });
    input.value = "";
    saveData();
    input.focus();
  });
}

document.querySelectorAll(".filter-button").forEach(button => {
  button.addEventListener("click", () => {
    activeTaskFilter = button.dataset.filter;
    render();
  });
});

addItem("#task-form", "#task-input", "tasks", "text");
addItem("#topic-form", "#topic-input", "topics", "name");
addItem("#idea-form", "#idea-input", "ideas", "text");
render();
