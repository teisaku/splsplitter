// Firebaseの初期化コード
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDoc, doc } from "firebase/firestore"; 

const firebaseConfig = {
    apiKey: "AIzaSyAh-s6UqPTU614UgT1H2_dJhpunT3buzfI",
    authDomain: "simplesplitter1.firebaseapp.com",
    projectId: "simplesplitter1",
    storageBucket: "simplesplitter1.appspot.com",
    messagingSenderId: "949275358143",
    appId: "1:949275358143:web:00a13b212f2fe59dbd270a",
    measurementId: "G-NEBY6CCDTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let members = [];
let expenses = [];

function addMember() {
    const memberName = document.getElementById('memberName').value;
    if (memberName !== "") {
        members.push(memberName);
        updatePayerOptions();
        document.getElementById('memberName').value = "";
    }
}

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
    }
}

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

function calculateResults() {
    // 省略: 割り勘計算ロジック
}

async function createBackup() {
    const backupName = document.getElementById('backupName').value;
    if (backupName !== "") {
        const backup = {
            name: backupName,
            members: members,
            expenses: expenses
        };
        try {
            const docRef = await addDoc(collection(db, "backups"), backup);
            console.log("Document written with ID: ", docRef.id);
            alert("バックアップが作成されました");
        } catch (e) {
            console.error("Error adding document: ", e);
        }
        document.getElementById('backupName').value = "";
    }
}

async function shareBackup() {
    const backupName = document.getElementById('backupName').value;
    if (backupName !== "") {
        const backup = {
            name: backupName,
            members: members,
            expenses: expenses
        };

        try {
            const docRef = await addDoc(collection(db, "backups"), backup);
            const shareLink = `${window.location.origin}?id=${docRef.id}`;
            alert(`共有リンク: ${shareLink}`);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
        document.getElementById('backupName').value = "";
    }
}

async function loadBackupFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const backupId = urlParams.get('id');
    if (backupId) {
        try {
            const docRef = doc(db, "backups", backupId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const backup = docSnap.data();
                members = backup.members;
                expenses = backup.expenses;
                updatePayerOptions();
                updateExpenseList();
                calculateResults();
            } else {
                console.log("No such document!");
            }
        } catch (e) {
            console.log("Error getting document:", e);
        }
    }
}

window.onload = loadBackupFromURL;
