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
const listElement = document.querySelector('#app ul');
const inputElement = document.querySelector('#app .addTodo input');
const buttonElement = document.querySelector('#app .addTodo button');
const buttonErase = document.querySelector('#erase');
const currentListSelect = document.querySelector('#currentListSelect');
const addNewListBtn = document.querySelector('#addNewList');
const deleteListBtn = document.querySelector('#deleteList');
const listTitle = document.querySelector('#listTitle');

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
        // Migration from old schema
        const oldData = localStorage.getItem('ListItems');
        if (oldData) {
            const items = JSON.parse(oldData);
            AppData.lists[0].items = items;
            // Clean up old data
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
        currentList.items.forEach(todo => {
            createToDoItem(todo);
        });
    }
}

function createToDoItem(todoText) {
    const todoElement = document.createElement('li');
    const labelElement = document.createElement('label');
    const inputItemElement = document.createElement('input');
    const pElement = document.createElement('p');
    const spanElement = document.createElement('span');
    const textNode = document.createTextNode(todoText);

    inputItemElement.setAttribute('type', 'checkbox');
    
    labelElement.appendChild(inputItemElement);
    labelElement.appendChild(pElement);
    labelElement.appendChild(spanElement);
    pElement.appendChild(textNode);
    todoElement.appendChild(labelElement);
    listElement.appendChild(todoElement);
}

// Actions
function addTodoInArray() {
    const todoText = inputElement.value.trim();

    // 2. Não deixar incluir uma tarefa vazia
    if (todoText === '') {
        alert('Por favor, digite uma tarefa!');
        return;
    }

    AppData.lists[AppData.currentListIndex].items.push(todoText);
    inputElement.value = '';
    createToDoItem(todoText);
    saveData();
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