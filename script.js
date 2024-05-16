let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let members = new Set(JSON.parse(localStorage.getItem('members')) || []);
let showingAll = false;

document.addEventListener('DOMContentLoaded', () => {
    updateMemberDropdown();
    updateExpenseMembers();
    displayExpenses();
    calculateSplit();
});

function saveToLocalStorage() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('members', JSON.stringify(Array.from(members)));
}

function addMember() {
    const memberName = document.getElementById('memberName').value;
    if (memberName && !members.has(memberName)) {
        members.add(memberName);
        updateMemberDropdown();
        updateExpenseMembers();
        saveToLocalStorage();
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
        saveToLocalStorage();
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
    saveToLocalStorage();
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
    localStorage.setItem('backup_expenses', localStorage.getItem('expenses'));
    localStorage.setItem('backup_members', localStorage.getItem('members'));
    localStorage.removeItem('expenses');
    localStorage.removeItem('members');
    location.reload();
    document.getElementById('restoreButton').style.display = 'block';
}

function restoreData() {
    localStorage.setItem('expenses', localStorage.getItem('backup_expenses'));
    localStorage.setItem('members', localStorage.getItem('backup_members'));
    localStorage.removeItem('backup_expenses');
    localStorage.removeItem('backup_members');
    location.reload();
}
