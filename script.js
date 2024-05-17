let expenses = [];
let members = new Set();
let showingAll = false;
let gistId = '';  // GistのIDを保存するための変数

// GitHubアクセストークン（GitHubから取得したアクセストークンを設定）
const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN';

document.addEventListener('DOMContentLoaded', () => {
    const savedGistId = localStorage.getItem('gistId');
    if (savedGistId) {
        gistId = savedGistId;
        fetchGistData();
    } else {
        initializeApp();
    }
});

function fetchGistData() {
    fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const content = JSON.parse(data.files['data.json'].content);
        expenses = content.expenses || [];
        members = new Set(content.members || []);
        initializeApp();
    })
    .catch(error => {
        console.error('Error fetching gist:', error);
        initializeApp();
    });
}

function saveToGist() {
    const data = {
        expenses: expenses,
        members: Array.from(members)
    };
    
    const body = {
        description: "Expenses data",
        public: false,
        files: {
            "data.json": {
                content: JSON.stringify(data)
            }
        }
    };
    
    const url = gistId ? `https://api.github.com/gists/${gistId}` : `https://api.github.com/gists`;
    const method = gistId ? 'PATCH' : 'POST';
    
    fetch(url, {
        method: method,
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
        if (!gistId) {
            gistId = data.id;
            localStorage.setItem('gistId', gistId);
        }
    })
    .catch(error => {
        console.error('Error saving gist:', error);
    });
}

function initializeApp() {
    updateMemberDropdown();
    updateExpenseMembers();
    displayExpenses();
    calculateSplit();
    displayBackups();
}

function addMember() {
    const memberName = document.getElementById('memberName').value;
    if (memberName && !members.has(memberName)) {
        members.add(memberName);
        updateMemberDropdown();
        updateExpenseMembers();
        saveToGist();
        document.getElementById('memberName').value = '';
    } else {
        alert('有効なメンバー名を入力してください。');
    }
}

function updateMemberDropdown() {
    const payerNameSelect = document.getElementById('payerName');
    payerNameSelect.innerHTML = '<option value="" disabled selected>支払者を選択</option>';
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.text = member;
        payerNameSelect.appendChild(option);
    });
}

function updateExpenseMembers() {
    const expenseMembersDiv = document.getElementById('expenseMembers');
    expenseMembersDiv.innerHTML = '';
    members.forEach(member => {
        const div = document.createElement('div');
        div.innerHTML = `<input type="checkbox" id="expenseMember_${member}" value="${member}" checked> ${member}`;
        expenseMembersDiv.appendChild(div);
    });
}

function addExpense() {
    const title = document.getElementById('expenseTitle').value || '-';
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const payer = document.getElementById('payerName').value;
    const expenseMembers = Array.from(document.querySelectorAll('#expenseMembers input:checked')).map(input => input.value);

    if (!isNaN(amount) && payer && expenseMembers.length > 0) {
        const expense = {
            title: title,
            amount: amount,
            payer: payer,
            members: expenseMembers
        };
        expenses.push(expense);
        displayExpenses();
        calculateSplit();
        saveToGist();
        clearForm();
    } else {
        alert('金額と支払者を正しく入力し、少なくとも一人のメンバーを選択してください。');
    }
}

function displayExpenses() {
    const expenseList = document.getElementById('expenses');
    expenseList.innerHTML = '';

    const latestExpenses = showingAll ? expenses : expenses.slice(-3);

    latestExpenses.forEach((expense, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${expense.title} - ¥${expense.amount.toFixed(2)} (支払者: ${expense.payer}, メンバー: ${expense.members.join(', ')}) <button onclick="removeExpense(${index})">削除</button>`;
        expenseList.appendChild(li);
    });

    const showMoreButton = document.getElementById('showMoreButton');
    if (expenses.length > 3) {
        showMoreButton.style.display = 'block';
        showMoreButton.innerText = showingAll ? '詳細を隠す' : '詳細を表示';
    } else {
        showMoreButton.style.display = 'none';
    }
}

function removeExpense(index) {
    expenses.splice(index, 1);
    displayExpenses();
    calculateSplit();
    saveToGist();
}

function toggleDetails() {
    showingAll = !showingAll;
    displayExpenses();
}

function calculateSplit() {
    const resultsDiv = document.getElementById('results');
    const detailedResultsDiv = document.getElementById('detailedResults');
    resultsDiv.innerHTML = '';
    detailedResultsDiv.innerHTML = '';

    const totalAmounts = {};
    const balances = {};

    members.forEach(member => {
        totalAmounts[member] = 0;
        balances[member] = 0;
    });

    expenses.forEach(expense => {
        const numMembers = expense.members.length;
        const amountPerMember = expense.amount / numMembers;

        totalAmounts[expense.payer] += expense.amount;

        expense.members.forEach(member => {
            balances[member] -= amountPerMember;
        });

        balances[expense.payer] += expense.amount;
    });

    members.forEach(member => {
        const totalPaid = totalAmounts[member];
        const balance = balances[member];
        const receiveAmount = balance > 0 ? balance : 0;
        const payAmount = balance < 0 ? Math.abs(balance) : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member}</td>
            <td>¥${totalPaid.toFixed(2)}</td>
            <td>¥${receiveAmount.toFixed(2)}</td>
            <td>¥${payAmount.toFixed(2)}</td>
        `;
        resultsDiv.appendChild(row);
    });

    const payers = Array.from(members).filter(member => balances[member] < 0);
    const receivers = Array.from(members).filter(member => balances[member] > 0);

    payers.forEach(payer => {
        receivers.forEach(receiver => {
            if (balances[payer] === 0 || balances[receiver] === 0) return;
            const amount = Math.min(Math.abs(balances[payer]), balances[receiver]);
            balances[payer] += amount;
            balances[receiver] -= amount;
            const detailedResultDiv = document.createElement('div');
            detailedResultDiv.innerHTML = `${payer}は${receiver}に¥${amount.toFixed(2)}を支払う`;
            detailedResultsDiv.appendChild(detailedResultDiv);
        });
    });
}

function clearForm() {
    document.getElementById('expenseTitle').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('payerName').value = '';
    Array.from(document.querySelectorAll('#expenseMembers input')).forEach(input => input.checked = true);
}

function resetData() {
    if (confirm('本当にデータをリセットしますか？ この操作は元に戻せません。')) {
        expenses = [];
        members = new Set();
        gistId = '';
        localStorage.removeItem('gistId');
        initializeApp();
        saveToGist();
    }
}

function createBackup() {
    const backupName = document.getElementById('backupName').value;
    if (!backupName) {
        alert('バックアップ名を入力してください。');
        return;
    }

    db.collection('backups').add({
        name: backupName,
        data: { expenses: expenses, members: Array.from(members) }
    }).then(() => {
        displayBackups();
    }).catch((error) => {
        console.error("Error creating backup: ", error);
    });
}

function displayBackups() {
    const backupList = document.getElementById('backupList');
    backupList.innerHTML = '';

    db.collection('backups').get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const backup = doc.data();
            const div = document.createElement('div');
            div.innerHTML = `
                ${backup.name}
                <div>
                    <button onclick="restoreBackup('${doc.id}')">復元</button>
                    <button class="delete-btn" onclick="deleteBackup('${doc.id}')">削除</button>
                </div>
            `;
            backupList.appendChild(div);
        });
    }).catch((error) => {
        console.error("Error getting backups: ", error);
    });
}

function restoreBackup(id) {
    db.collection('backups').doc(id).get().then((doc) => {
        if (doc.exists) {
            const backupData = doc.data().data;
            expenses = backupData.expenses;
            members = new Set(backupData.members);
            saveToGist();
            location.reload();
        } else {
            alert('選択されたバックアップが見つかりません。');
        }
    }).catch((error) => {
        console.error("Error restoring backup: ", error);
    });
}

function deleteBackup(id) {
    db.collection('backups').doc(id).delete().then(() => {
        displayBackups();
    }).catch((error) => {
        console.error("Error deleting backup: ", error);
    });
}