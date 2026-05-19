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

// Firebase Config Check (loaded globally from config.js)
const activeFirebaseConfig = typeof firebaseConfig !== 'undefined' ? firebaseConfig : null;
const isFirebaseConfigured = activeFirebaseConfig && activeFirebaseConfig.apiKey && activeFirebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

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
const shareListBtn = document.querySelector('#shareList');
const syncStatusElement = document.querySelector('#syncStatus');
const toastElement = document.querySelector('#toast');

// Firebase Initialization
let db = null;
let isCloudActive = false;

if (isFirebaseConfigured && typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(activeFirebaseConfig);
        db = firebase.firestore();
        isCloudActive = true;
        console.log("Firebase initialized successfully. Cloud sync is active!");
    } catch (e) {
        console.error("Failed to initialize Firebase:", e);
    }
} else {
    console.log("Firebase not configured or script missing. Running in local/hybrid mode.");
}

// UUID Generator
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
};

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
        { id: generateUUID(), name: 'Minha Lista', items: [] }
    ]
};
let draggedIndex = null;

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
            AppData.lists[0].id = generateUUID();
            localStorage.removeItem('ListItems');
        }
    }
    
    if (AppData.currentListIndex >= AppData.lists.length) {
        AppData.currentListIndex = 0;
    }
    
    renderLists();
    renderTodo();
};

const migrateData = () => {
    let updated = false;
    if (!AppData.lists || AppData.lists.length === 0) {
        AppData.lists = [{ id: generateUUID(), name: 'Minha Lista', items: [] }];
        AppData.currentListIndex = 0;
        updated = true;
    }
    AppData.lists.forEach(list => {
        if (!list.id) {
            list.id = generateUUID();
            updated = true;
        }
    });
    if (updated) {
        saveDataLocallyOnly();
    }
};

const saveDataLocallyOnly = () => {
    localStorage.setItem('TodoAppData', JSON.stringify(AppData));
};

const saveData = () => {
    saveDataLocallyOnly();
    syncCurrentListToCloud();
};

const syncCurrentListToCloud = async () => {
    if (!isCloudActive || !db) {
        updateSyncStatus('local');
        return;
    }
    
    const currentList = AppData.lists[AppData.currentListIndex];
    if (!currentList || !currentList.id) return;
    
    updateSyncStatus('syncing');
    try {
        await db.collection("lists").doc(currentList.id).set({
            id: currentList.id,
            name: currentList.name,
            items: currentList.items,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        updateSyncStatus('synced');
    } catch (e) {
        console.error("Cloud sync failed:", e);
        updateSyncStatus('local');
    }
};

let currentListenerUnsubscribe = null;

const setupListListener = (listId) => {
    if (!isCloudActive || !db) {
        updateSyncStatus('local');
        return;
    }
    
    if (typeof currentListenerUnsubscribe === 'function') {
        currentListenerUnsubscribe();
    }
    
    updateSyncStatus('syncing');
    currentListenerUnsubscribe = db.collection("lists").doc(listId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const cloudList = doc.data();
                const listIndex = AppData.lists.findIndex(l => l.id === listId);
                
                if (listIndex !== -1) {
                    const localItems = JSON.stringify(AppData.lists[listIndex].items);
                    const cloudItems = JSON.stringify(cloudList.items || []);
                    
                    if (localItems !== cloudItems || AppData.lists[listIndex].name !== cloudList.name) {
                        AppData.lists[listIndex].name = cloudList.name;
                        AppData.lists[listIndex].items = cloudList.items || [];
                        
                        saveDataLocallyOnly();
                        if (listIndex === AppData.currentListIndex) {
                            renderTodo();
                            listTitle.textContent = cloudList.name;
                            renderLists();
                        }
                    }
                }
                updateSyncStatus('synced');
            }
        }, (error) => {
            console.error("Listener error:", error);
            updateSyncStatus('local');
        });
};

const loadSharedList = async (listId) => {
    if (!isCloudActive || !db) return;
    
    updateSyncStatus('syncing');
    try {
        const docRef = db.collection("lists").doc(listId);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const cloudList = doc.data();
            const existingIndex = AppData.lists.findIndex(l => l.id === listId);
            
            if (existingIndex !== -1) {
                AppData.lists[existingIndex].name = cloudList.name;
                AppData.lists[existingIndex].items = cloudList.items || [];
                AppData.currentListIndex = existingIndex;
            } else {
                AppData.lists.push({
                    id: listId,
                    name: cloudList.name,
                    items: cloudList.items || []
                });
                AppData.currentListIndex = AppData.lists.length - 1;
            }
            
            saveDataLocallyOnly();
            renderLists();
            renderTodo();
            updateSyncStatus('synced');
            showToast("Lista importada e sincronizada!");
            
            setupListListener(listId);
        } else {
            console.log("List not found in Firestore.");
            showToast("Lista compartilhada não encontrada.");
            updateSyncStatus('local');
        }
    } catch (e) {
        console.error("Error loading shared list:", e);
        showToast("Erro ao carregar lista compartilhada.");
        updateSyncStatus('local');
    }
};

const updateSyncStatus = (status) => {
    if (!syncStatusElement) return;
    
    syncStatusElement.className = 'sync-status';
    
    if (!isCloudActive) {
        syncStatusElement.classList.add('local');
        syncStatusElement.title = "Modo Local (Salvo no dispositivo)";
        return;
    }
    
    if (status === 'syncing') {
        syncStatusElement.classList.add('syncing');
        syncStatusElement.title = "Sincronizando com a nuvem...";
        syncStatusElement.innerHTML = '<i class="fa fa-spinner" aria-hidden="true"></i>';
    } else if (status === 'synced') {
        syncStatusElement.classList.add('synced');
        syncStatusElement.title = "Sincronizado na Nuvem";
        syncStatusElement.innerHTML = '<i class="fa fa-cloud" aria-hidden="true"></i>';
    } else {
        syncStatusElement.classList.add('local');
        syncStatusElement.title = "Modo Offline (Salvo localmente)";
        syncStatusElement.innerHTML = '<i class="fa fa-cloud" aria-hidden="true"></i>';
    }
};

let toastTimeout = null;
const showToast = (message) => {
    if (!toastElement) return;
    
    const messageSpan = toastElement.querySelector('.toast-message');
    if (messageSpan) {
        messageSpan.textContent = message;
    }
    
    toastElement.classList.add('show');
    
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }
    
    toastTimeout = setTimeout(() => {
        toastElement.classList.remove('show');
    }, 3000);
};

const shareCurrentList = () => {
    const currentList = AppData.lists[AppData.currentListIndex];
    if (!currentList) return;
    
    const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
    const shareUrl = `${cleanUrl}?list=${currentList.id}`;
    
    const shareData = {
        title: `ServTask - ${currentList.name}`,
        text: `Confira minha lista de tarefas "${currentList.name}" no ServTask!`,
        url: shareUrl
    };
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        navigator.share(shareData)
            .then(() => console.log("Shared successfully via Web Share API"))
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    console.error("Web Share failed, falling back to copy:", err);
                    copyLinkToClipboard(shareUrl);
                }
            });
    } else {
        copyLinkToClipboard(shareUrl);
    }
};

const copyLinkToClipboard = (shareUrl) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast("Link copiado para compartilhar!");
        }).catch((err) => {
            console.error("Clipboard copy failed, trying fallback:", err);
            fallbackCopy(shareUrl);
        });
    } else {
        fallbackCopy(shareUrl);
    }
};

const fallbackCopy = (text) => {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast("Link copiado para compartilhar!");
    } catch (err) {
        prompt("Copie o link abaixo para compartilhar:", text);
    }
};

const initApp = () => {
    loadData();
    migrateData();
    
    const urlParams = new URLSearchParams(window.location.search);
    const sharedListId = urlParams.get('list');
    
    if (sharedListId) {
        if (isCloudActive) {
            loadSharedList(sharedListId);
        } else {
            showToast("Nuvem não configurada. Modo local ativo.");
            setupListListenerForCurrent();
        }
    } else {
        setupListListenerForCurrent();
    }
};

const setupListListenerForCurrent = () => {
    const currentList = AppData.lists[AppData.currentListIndex];
    if (currentList) {
        setupListListener(currentList.id);
    } else {
        updateSyncStatus('local');
    }
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
    
    // Drag Handle on the left
    const dragHandle = document.createElement('i');
    dragHandle.className = 'fas fa-grip-vertical drag-handle';
    dragHandle.title = 'Arrastar para reordenar';
    
    // Desktop Drag-and-Drop Events
    todoElement.setAttribute('draggable', 'true');
    todoElement.ondragstart = (e) => {
        draggedIndex = index;
        todoElement.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };

    todoElement.ondragover = (e) => {
        e.preventDefault();
        todoElement.classList.add('drag-over');
    };

    todoElement.ondragleave = () => {
        todoElement.classList.remove('drag-over');
    };

    todoElement.ondrop = (e) => {
        e.preventDefault();
        todoElement.classList.remove('drag-over');
        if (draggedIndex !== null && draggedIndex !== index) {
            reorderTasks(draggedIndex, index);
        }
    };

    todoElement.ondragend = () => {
        todoElement.classList.remove('dragging');
        draggedIndex = null;
    };

    // Mobile Touch Events on the dragHandle
    dragHandle.ontouchstart = (e) => {
        draggedIndex = index;
        todoElement.classList.add('dragging');
        e.stopPropagation();
    };

    dragHandle.ontouchmove = (e) => {
        e.preventDefault(); // Prevents page scrolling while dragging
        const touch = e.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (!element) return;
        
        const targetLi = element.closest('#todoList li');
        
        // Clear all other temporary drag-over classes
        const allLis = listElement.querySelectorAll('li');
        allLis.forEach(li => {
            if (li !== todoElement) li.classList.remove('drag-over');
        });
        
        if (targetLi && targetLi !== todoElement) {
            targetLi.classList.add('drag-over');
        }
    };

    dragHandle.ontouchend = (e) => {
        todoElement.classList.remove('dragging');
        
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Clean up drag-over classes
        const allLis = listElement.querySelectorAll('li');
        allLis.forEach(li => li.classList.remove('drag-over'));
        
        if (element) {
            const targetLi = element.closest('#todoList li');
            if (targetLi && targetLi !== todoElement) {
                const targetIndex = Array.from(listElement.children).indexOf(targetLi);
                if (targetIndex !== -1 && draggedIndex !== null) {
                    reorderTasks(draggedIndex, targetIndex);
                }
            }
        }
        draggedIndex = null;
    };

    const labelElement = document.createElement('label');
    const inputItemElement = document.createElement('input');
    inputItemElement.setAttribute('type', 'checkbox');
    
    const spanElement = document.createElement('span');
    const pElement = document.createElement('p');
    pElement.textContent = todoText;

    const actionsWrapper = document.createElement('div');
    actionsWrapper.className = 'todo-actions';

    const editBtn = document.createElement('i');
    editBtn.className = 'fa fa-edit edit-todo';
    editBtn.title = 'Editar tarefa';
    editBtn.onclick = (e) => {
        e.preventDefault();
        editTask(index);
    };

    const deleteBtn = document.createElement('i');
    deleteBtn.className = 'fa fa-trash delete-todo';
    deleteBtn.title = 'Remover tarefa';
    deleteBtn.onclick = (e) => {
        e.preventDefault();
        deleteTask(index);
    };

    actionsWrapper.appendChild(editBtn);
    actionsWrapper.appendChild(deleteBtn);

    labelElement.appendChild(inputItemElement);
    labelElement.appendChild(spanElement);
    labelElement.appendChild(pElement);
    
    // Append in order: drag handle, checkbox/label, actions
    todoElement.appendChild(dragHandle);
    todoElement.appendChild(labelElement);
    todoElement.appendChild(actionsWrapper);
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

function deleteTask(index) {
    const currentItems = AppData.lists[AppData.currentListIndex].items;
    if (confirm(`Tem certeza que deseja remover a tarefa "${currentItems[index]}"?`)) {
        currentItems.splice(index, 1);
        saveData();
        renderTodo();
    }
}

function reorderTasks(fromIndex, toIndex) {
    const currentList = AppData.lists[AppData.currentListIndex];
    if (!currentList) return;
    
    const items = currentList.items;
    const draggedItem = items.splice(fromIndex, 1)[0];
    items.splice(toIndex, 0, draggedItem);
    
    saveData();
    renderTodo();
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
        const newListId = generateUUID();
        AppData.lists.push({ id: newListId, name: listName.trim(), items: [] });
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
        if (typeof currentListenerUnsubscribe === 'function') {
            currentListenerUnsubscribe();
            currentListenerUnsubscribe = null;
        }
        
        AppData.lists.splice(AppData.currentListIndex, 1);
        AppData.currentListIndex = 0;
        saveData();
        renderLists();
        renderTodo();
        
        setupListListenerForCurrent();
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
    const currentList = AppData.lists[AppData.currentListIndex];
    if (currentList) {
        listTitle.textContent = currentList.name;
        setupListListener(currentList.id);
    }
    saveData();
    renderTodo();
};

addNewListBtn.onclick = addNewList;
deleteListBtn.onclick = deleteCurrentList;
shareListBtn.onclick = shareCurrentList;

// Init
initApp();