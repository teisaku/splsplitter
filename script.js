let members = [];
let expenses = [];

// メンバーを追加
function addMember() {
    const memberName = document.getElementById('memberName').value;
    if (memberName !== "") {
        members.push(memberName);
        updatePayerOptions();
        document.getElementById('memberName').value = "";
        saveData();  // データを保存
    }
}

// 支払者のオプションを更新
function updatePayerOptions() {
    const payerSelect = document.getElementById('payerName');
    payerSelect.innerHTML = '<option value="" disabled selected>支払者を選択</option>';
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member;
        option.textContent = member;
        payerSelect.appendChild(option);
    });
}

// 費用を追加
function addExpense() {
    const expenseTitle = document.getElementById('expenseTitle').value;
    const expenseAmount = document.getElementById('expenseAmount').value;
    const payerName = document.getElementById('payerName').value;

    if (expenseAmount !== "" && payerName !== "") {
        const expense = {
            title: expenseTitle,
            amount: parseFloat(expenseAmount),
            payer: payerName,
            members: [...members]
        };
        expenses.push(expense);
        updateExpenseList();
        document.getElementById('expenseTitle').value = "";
        document.getElementById('expenseAmount').value = "";
        saveData();  // データを保存
    }
}

// 費用リストを更新
function updateExpenseList() {
    const expensesList = document.getElementById('expenses');
    expensesList.innerHTML = "";
    expenses.forEach(expense => {
        const li = document.createElement('li');
        li.textContent = `${expense.payer}が${expense.amount}円支払いました (${expense.title})`;
        expensesList.appendChild(li);
    });
    calculateResults();
}

// 結果を計算
function calculateResults() {
    // 省略: 割り勘計算ロジック
}

// データをFirebaseに保存
async function saveData() {
    try {
        await db.collection("split-bill-app").doc("sharedData").set({
            members: members,
            expenses: expenses
        });
        console.log("データが保存されました");
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// データをFirebaseから読み込み
async function loadData() {
    try {
        const doc = await db.collection("split-bill-app").doc("sharedData").get();
        if (doc.exists) {
            const data = doc.data();
            members = data.members || [];
            expenses = data.expenses || [];
            updatePayerOptions();
            updateExpenseList();
            calculateResults();
            console.log("データが読み込まれました");
        } else {
            console.log("No such document!");
        }
    } catch (e) {
        console.error("Error getting document: ", e);
    }
}

// ページロード時にデータを読み込む
window.onload = loadData;
