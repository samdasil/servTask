// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('SW registered!', reg);
        }).catch(err => {
            console.log('SW registration failed:', err);
        });
    });
}

// Elements
const listElement = document.querySelector('#todoList');
const inputElement = document.querySelector('#app .addTodo input');
const buttonElement = document.querySelector('#app .addTodo button');
const buttonErase = document.querySelector('#erase');
const currentListSelect = document.querySelector('#currentListSelect');
const addNewListBtn = document.querySelector('#addNewList');
const deleteListBtn = document.querySelector('#deleteList');
const themeToggleBtn = document.querySelector('#themeToggle');
const listTitle = document.querySelector('#listTitle');

// Theme Logic
const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('TodoTheme', newTheme);
    updateThemeIcon(newTheme);
};

const updateThemeIcon = (theme) => {
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
};

// Init Theme
const savedTheme = localStorage.getItem('TodoTheme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
window.addEventListener('DOMContentLoaded', () => updateThemeIcon(savedTheme));

themeToggleBtn.onclick = toggleTheme;

// State
let AppData = {
    currentListIndex: 0,
    lists: [
        { name: 'Minha Lista', items: [] }
    ]
};

// Initialization and Migration
const loadData = () => {
    const savedData = localStorage.getItem('TodoAppData');
    if (savedData) {
        AppData = JSON.parse(savedData);
    } else {
        const oldData = localStorage.getItem('ListItems');
        if (oldData) {
            const items = JSON.parse(oldData);
            AppData.lists[0].items = items;
            localStorage.removeItem('ListItems');
        }
    }
    renderLists();
    renderTodo();
};

const saveData = () => {
    localStorage.setItem('TodoAppData', JSON.stringify(AppData));
};

// Rendering
function renderLists() {
    currentListSelect.innerHTML = '';
    AppData.lists.forEach((list, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = list.name;
        if (index === AppData.currentListIndex) {
            option.selected = true;
            listTitle.textContent = list.name;
        }
        currentListSelect.appendChild(option);
    });
}

function renderTodo() {
    listElement.innerHTML = '';
    const currentList = AppData.lists[AppData.currentListIndex];
    if (currentList) {
        currentList.items.forEach((todo, index) => {
            createToDoItem(todo, index);
        });
    }
}

function createToDoItem(todoText, index) {
    const todoElement = document.createElement('li');
    
    const labelElement = document.createElement('label');
    const inputItemElement = document.createElement('input');
    inputItemElement.setAttribute('type', 'checkbox');
    
    const spanElement = document.createElement('span');
    const pElement = document.createElement('p');
    pElement.textContent = todoText;

    const editBtn = document.createElement('i');
    editBtn.className = 'fa fa-edit edit-todo';
    editBtn.onclick = (e) => {
        e.preventDefault();
        editTask(index);
    };

    labelElement.appendChild(inputItemElement);
    labelElement.appendChild(spanElement);
    labelElement.appendChild(pElement);
    
    todoElement.appendChild(labelElement);
    todoElement.appendChild(editBtn);
    listElement.appendChild(todoElement);
}

// Actions
function editTask(index) {
    const currentItems = AppData.lists[AppData.currentListIndex].items;
    const newText = prompt('Editar tarefa:', currentItems[index]);
    
    if (newText !== null && newText.trim() !== '') {
        currentItems[index] = newText.trim();
        saveData();
        renderTodo();
    }
}

function addTodoInArray() {
    const todoText = inputElement.value.trim();

    if (todoText === '') {
        alert('Por favor, digite uma tarefa!');
        return;
    }

    AppData.lists[AppData.currentListIndex].items.push(todoText);
    inputElement.value = '';
    saveData();
    renderTodo();
}

function addNewList() {
    const listName = prompt('Nome da nova lista:');
    if (listName && listName.trim() !== '') {
        AppData.lists.push({ name: listName.trim(), items: [] });
        AppData.currentListIndex = AppData.lists.length - 1;
        saveData();
        renderLists();
        renderTodo();
    }
}

function deleteCurrentList() {
    if (AppData.lists.length <= 1) {
        alert('Você não pode deletar a única lista existente!');
        return;
    }

    if (confirm(`Tem certeza que deseja deletar a lista "${AppData.lists[AppData.currentListIndex].name}"?`)) {
        AppData.lists.splice(AppData.currentListIndex, 1);
        AppData.currentListIndex = 0;
        saveData();
        renderLists();
        renderTodo();
    }
}

function removeAllItemsInCurrentList() {
    if (confirm('Deseja apagar todas as tarefas desta lista?')) {
        AppData.lists[AppData.currentListIndex].items = [];
        saveData();
        renderTodo();
    }
}

// Event Listeners
inputElement.addEventListener('keyup', function (e) {
    const key = e.which || e.keyCode;
    if (key == 13) {
        addTodoInArray();
    }
});

buttonElement.onclick = addTodoInArray;
buttonErase.onclick = removeAllItemsInCurrentList;

currentListSelect.onchange = (e) => {
    AppData.currentListIndex = parseInt(e.target.value);
    listTitle.textContent = AppData.lists[AppData.currentListIndex].name;
    saveData();
    renderTodo();
};

addNewListBtn.onclick = addNewList;
deleteListBtn.onclick = deleteCurrentList;

// Init
loadData();