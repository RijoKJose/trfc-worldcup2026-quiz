import {
    db,
    auth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    serverTimestamp
} from './firebase.js';

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    onSnapshot
}
from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';


let users = [];
let leaderboard = [];
let settings = {
    correctPoints: 2,
    fastestBonus: 1
};

let quiz = [];
let reviewQuestions = [];
let currentQuizId = null;

let quizStarted = false;
let currentUser = null;
let current = 0;
let answered = false;
let currentQuestion = 0;
let score = 0;
let timer = 15;
let timerInterval = null;
let questionStartTime = null;
let interval;
let lobbyActive = false;
let quizEnded = false;
let lobbyCountdown = 60;
let lobbyInterval = null;
let loggedInUser = null;
let lobbyRemaining = 60;

// Firebase Authentication Listener
onAuthStateChanged(auth, user => {

    if (user) {

        console.log('Admin Logged In');

        document.getElementById('dashboard')
            ?.classList.remove('hidden');

        document.getElementById('adminLoginSection')
            ?.classList.add('hidden');

    } else {

        console.log('Admin Logged Out');

        document.getElementById('dashboard')
            ?.classList.add('hidden');

        document.getElementById('adminLoginSection')
            ?.classList.remove('hidden');

    }

});

function showSection(id){
hideAll();
document.getElementById(id).classList.remove('hidden');
}

function hideAll(){
['joinSection','quizSection','leaderboardSection','adminSection']
.forEach(id=>{
document.getElementById(id).classList.add('hidden');
});
}

function showRegister(){
document.getElementById('registerBox').classList.remove('hidden');
}

async function registerUser() {

    const name =
        document.getElementById('name').value.trim();

    const email =
        document.getElementById('email').value.trim().toLowerCase();

    const phone =
        document.getElementById('phone').value.trim();

    if (!name || !email || !phone) {

        alert('Enter all details');

        return;

    }

    const userRef =
        doc(db, 'users', email);

    const existingUser =
        await getDoc(userRef);

    if (existingUser.exists()) {

        alert('User already registered');

        return;

    }

    await setDoc(userRef, {

        name,
        email,
        phone,

        createdAt: serverTimestamp()

    });

    alert('Registration Successful');

    document.getElementById('name').value = '';

    document.getElementById('email').value = '';

    document.getElementById('phone').value = '';

    document.getElementById('registerBox')
        .classList.add('hidden');

    loadUsers();
}

async function loadUsers() {

    users = [];

    const snapshot =
        await getDocs(collection(db, 'users'));

    snapshot.forEach(docSnap => {

        users.push(docSnap.data());

    });

    renderUsers();
}

async function adminLogout() {

    await signOut(auth);

}
function startQuizEngine() {

    currentQuestion = 0;

    score = 0;

    showSection(

        'quizSection'

    );

    loadQuestion();

}
function loadQuestion() {

    if (

        currentQuestion >= quiz.length

    ) {

        finishQuiz();

        return;

    }

    const q =

        quiz[currentQuestion];

    document.getElementById(

        'currentQuestion'

    ).innerText =

        currentQuestion + 1;

    document.getElementById(

        'totalQuestions'

    ).innerText =

        quiz.length;

    document.getElementById(

        'question'

    ).innerText =

        q.question;

    const optionsDiv =

        document.getElementById(

            'options'

        );

    optionsDiv.innerHTML = '';

    q.options.forEach(

        (

            option,

            index

        ) => {

            const btn =

                document.createElement(

                    'button'

                );

            btn.innerText =

                option;

            btn.onclick =

                () =>

                    submitAnswer(

                        index

                    );

            optionsDiv.appendChild(

                btn

            );

        }

    );

    startTimer();

}
function startTimer() {

    clearInterval(

        timerInterval

    );

    timer = 15;

    questionStartTime =

        Date.now();

    document.getElementById(

        'timer'

    ).innerText =

        timer;

    timerInterval =

        setInterval(

            () => {

                timer--;

                document

                    .getElementById(

                        'timer'

                    )

                    .innerText =

                        timer;

                if (

                    timer <= 0

                ) {

                    clearInterval(

                        timerInterval

                    );

                 currentQuestion++;

if (currentQuestion >= quiz.length) {

    finishQuiz();

    return;

}

loadQuestion();

                }

            },

            1000

        );

}

async function joinQuiz() {

    try {

        const email =

            document

            .getElementById(

                'loginEmail'

            )

            .value

            .trim()

            .toLowerCase();

        if (!email) {

            alert(

                'Enter Email'

            );

            return;

        }

        const userDoc =

            await getDoc(

                doc(

                    db,

                    'users',

                    email

                )

            );

        if (

            !userDoc.exists()

        ) {

            alert(

                'Please Register First'

            );

            return;

        }

        const statusDoc =

            await getDoc(

                doc(

                    db,

                    'quizStatus',

                    'current'

                )

            );

        if (

            !statusDoc.exists()

        ) {

            alert(

                'No Quiz Available'

            );

            return;

        }

        const status =

            statusDoc.data();

        if (

            status.status !==

            'LOBBY'

        ) {

            alert(

                'Quiz already started.'

            );

            return;

        }

        const participantId =

            `${status.quizId}_${email}`;

        const attempt =

            await getDoc(

                doc(

                    db,

                    'participants',

                    participantId

                )

            );

        if (

            attempt.exists()

        ) {

            alert(

                'You have already participated.'

            );

            return;

        }

        await setDoc(

            doc(

                db,

                'participants',

                participantId

            ),

            {

                quizId:

                    status.quizId,

                email,

                joinedAt:

                    serverTimestamp(),

                completed: false,

                score: 0

            }

        );

        loggedInUser = {

            email,

            participantId,

            quizId:

                status.quizId

        };
await loadQuiz(

    status.quizId

);
        if (status.status === 'LIVE') {

    startQuizEngine();

}
        alert(

            'Successfully Joined'

        );

    }

    catch (error) {

        console.error(error);

        alert(

            'Unable to join.'

        );

    }

}
async function submitAnswer(selectedAnswer) {

    clearInterval(timerInterval);

    const q = quiz[currentQuestion];

    const timeTaken =
        Date.now() - questionStartTime;

    if (selectedAnswer === q.answer) {

        score += settings.correctPoints;

        if (timeTaken <= 3000) {

            score += settings.fastestBonus;

        }

    }

    currentQuestion++;

    if (currentQuestion >= quiz.length) {

        await finishQuiz();

        return;

    }

    loadQuestion();

}
async function loadQuiz(

    quizId

) {

    const quizDoc =

        await getDoc(

            doc(

                db,

                'quizzes',

                quizId

            )

        );

    if (

        !quizDoc.exists()

    ) {

        alert(

            'Quiz Not Found'

        );

        return;

    }

    quiz =

        quizDoc.data()

        .questions;

}
async function adminLogin() {

    try {

        await signInWithEmailAndPassword(
            auth,
            document.getElementById('adminEmail').value,
            document.getElementById('adminPassword').value
        );

    } catch (error) {

        alert(error.message);

    }

}


async function generateAIQuestions() {

    try {

        const response = await fetch(

            '/api/generate-questions',

            {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json'

                },

                body: JSON.stringify({

                    topic: 'FIFA World Cup',

                    questionCount: 10

                })

            }

        );

        const data = await response.json();

        if (!data.success) {

            alert(

                data.error ||

                'Failed to generate questions'

            );

            return;

        }

        reviewQuestions = data.questions;

        renderReviewQuestions();

    } catch (error) {

        console.error(error);

        alert(

            'Unable to connect to Gemini.'

        );

    }

}

function renderReviewQuestions() {

    const container =

        document.getElementById(

            'questionsList'

        );

    container.innerHTML = '';

    reviewQuestions.forEach(

        (q, index) => {

            const card =

                document.createElement('div');

            card.className =

                'question-card';

            card.innerHTML = `

                <h4>

                    Question ${index + 1}

                </h4>

                <textarea

                    onchange="updateQuestion(

                        ${index},

                        'question',

                        this.value

                    )"

                >

                    ${q.question}

                </textarea>

                ${q.options.map(

                    (option, optionIndex) => `

                        <input

                            value="${option}"

                            onchange="updateOption(

                                ${index},

                                ${optionIndex},

                                this.value

                            )"

                        >

                    `

                ).join('')}

                <label>

                    Correct Option

                </label>

                <select

                    onchange="updateAnswer(

                        ${index},

                        this.value

                    )"

                >

                    <option

                        value="0"

                        ${q.answer == 0 ?

                            'selected' :

                            ''}

                    >

                        Option 1

                    </option>

                    <option

                        value="1"

                        ${q.answer == 1 ?

                            'selected' :

                            ''}

                    >

                        Option 2

                    </option>

                    <option

                        value="2"

                        ${q.answer == 2 ?

                            'selected' :

                            ''}

                    >

                        Option 3

                    </option>

                    <option

                        value="3"

                        ${q.answer == 3 ?

                            'selected' :

                            ''}

                    >

                        Option 4

                    </option>

                </select>

                <button

                    onclick="deleteQuestion(

                        ${index}

                    )"

                >

                    Delete

                </button>

            `;

            container.appendChild(card);

        }

    );

}

function addQuestion() {

    reviewQuestions.push({

        question: '',

        options: [

            '',

            '',

            '',

            ''

        ],

        answer: 0

    });

    renderReviewQuestions();

}

function editQuestion(index){

const q=quiz[index];

const question=prompt('Question',q.question);
const a=prompt('Option A',q.options[0]);
const b=prompt('Option B',q.options[1]);
const c=prompt('Option C',q.options[2]);
const d=prompt('Option D',q.options[3]);
const answer=Number(prompt('Correct Answer Index',q.answer));

quiz[index]={
question,
options:[a,b,c,d],
answer
};

localStorage.setItem('quiz',JSON.stringify(quiz));

renderReviewQuestions();
}

function updateQuestion(

    index,

    field,

    value

) {

    reviewQuestions[index][field] =

        value;

}
function updateOption(

    questionIndex,

    optionIndex,

    value

) {

    reviewQuestions[questionIndex]

        .options[optionIndex] = value;

}
function updateAnswer(

    index,

    value

) {

    reviewQuestions[index].answer =

        Number(value);

}
function deleteQuestion(index) {

    reviewQuestions.splice(

        index,

        1

    );

    renderReviewQuestions();

}
async function publishQuiz() {

    try {

        if (

            reviewQuestions.length === 0

        ) {

            alert(

                'No questions available.'

            );

            return;

        }

        const quizId =

            `quiz_${Date.now()}`;

        await setDoc(

            doc(

                db,

                'quizzes',

                quizId

            ),

            {

                quizId,

                title:

                    'TRFC Quiz',

                questions:

                    reviewQuestions,

                questionCount:

                    reviewQuestions.length,

                createdAt:

                    serverTimestamp(),

                published: true

            }

        );

        currentQuizId = quizId;
        await setCurrentQuiz();

        alert(

            'Quiz Published Successfully'

        );

    }

    catch (error) {

        console.error(error);

        alert(

            'Unable to publish quiz.'

        );

    }

}

async function setCurrentQuiz() {

    await setDoc(

        doc(

            db,

            'quizStatus',

            'current'

        ),

        {

            quizId:

                currentQuizId,

            status:

                'READY',

            publishedAt:

                serverTimestamp()

        }

    );

}

async function startQuiz() {

    try {

        if (!currentQuizId) {

            alert(
                'Publish a quiz first.'
            );

            return;

        }

        const now = Date.now();

        const lobbyEndTime =
            now + (60 * 1000);

        const quizStartTime =
            lobbyEndTime;

        const quizEndTime =
            quizStartTime +
            (15 * 10 * 1000) +
            (20 * 1000);

        await setDoc(

            doc(
                db,
                'quizStatus',
                'current'
            ),

            {

                quizId: currentQuizId,

                status: 'LOBBY',

                lobbyStartTime: now,

                lobbyEndTime,

                quizStartTime,

                quizEndTime

            }

        );

        alert(
            'Lobby Started'
        );

    }

    catch (error) {

        console.error(error);

        alert(
            'Unable to start quiz.'
        );

    }

}
function listenForQuizStatus() {

    onSnapshot(

        doc(
            db,
            'quizStatus',
            'current'
        ),

        snapshot => {

            if (!snapshot.exists()) {

                return;

            }

            const data =
                snapshot.data();

            handleQuizStatus(
                data
            );

        }

    );

}

function handleQuizStatus(status) {

    const now =
        Date.now();

    if (

        status.status === 'LOBBY'

    ) {

        startLobbyCountdown(

            status.lobbyEndTime

        );

    }

    else if (

        status.status === 'LIVE'

    ) {

        if (!quizStarted) { 
            quizStarted = true; 
            startQuizEngine(); 
        }
    }

    else if (

        status.status === 'ENDED'

    ) {

        quizEnded = true;

    }

}


async function updateQuizLeaderboard() {

    const leaderboardId =

        `${loggedInUser.quizId}_${loggedInUser.email}`;

    await setDoc(

        doc(

            db,

            'quizLeaderboards',

            leaderboardId

        ),

        {

            quizId:

                loggedInUser.quizId,

            email:

                loggedInUser.email,

            score,

            completedAt:

                serverTimestamp()

        }

    );

}
async function updateGlobalLeaderboard() {

    const globalRef =

        doc(

            db,

            'globalLeaderboards',

            loggedInUser.email

        );

    const existing =

        await getDoc(

            globalRef

        );

    if (

        existing.exists()

    ) {

        const total =

            existing.data()

                .totalPoints +

            score;

        await updateDoc(

            globalRef,

            {

                totalPoints:

                    total

            }

        );

    }

    else {

        const user =

            await getDoc(

                doc(

                    db,

                    'users',

                    loggedInUser.email

                )

            );

        await setDoc(

            globalRef,

            {

                email:

                    loggedInUser.email,

                name:

                    user.data().name,

                totalPoints:

                    score

            }

        );

    }

}
async function loadQuizLeaderboard() {

    const table =

        document.getElementById(

            'leaderboardTable'

        );

    table.innerHTML = '';

    const snapshot =

        await getDocs(

            collection(

                db,

                'quizLeaderboards'

            )

        );

    const entries = [];

    snapshot.forEach(

        docSnap => {

            const data =

                docSnap.data();

            if (

                data.quizId ===

                loggedInUser.quizId

            ) {

                entries.push(

                    data

                );

            }

        }

    );

    entries.sort(

        (

            a,

            b

        ) =>

            b.score -

            a.score

    );

    table.innerHTML =

        `

        <tr>

            <th>

                Rank

            </th>

            <th>

                Email

            </th>

            <th>

                Score

            </th>

        </tr>

    `;

    entries.forEach(

        (

            player,

            index

        ) => {

            table.innerHTML +=

                `

                <tr>

                    <td>

                        ${index + 1}

                    </td>

                    <td>

                        ${player.email}

                    </td>

                    <td>

                        ${player.score}

                    </td>

                </tr>

            `;

        }

    );

}
function startLobbyCountdown(

    lobbyEndTime

) {

    clearInterval(

        lobbyInterval

    );

    lobbyInterval = setInterval(

        () => {

            const remaining =

                Math.max(

                    0,

                    Math.ceil(

                        (

                            lobbyEndTime -

                            Date.now()

                        ) / 1000

                    )

                );

            document.getElementById(

                'countdown'

            ).innerText =

                `Quiz starts in ${remaining}s`;

            if (

                remaining <= 0

            ) {

                clearInterval(

                    lobbyInterval

                );

                document.getElementById(

                    'countdown'

                ).innerText =

                    '';

            }

        },

        1000

    );

}
async function updateQuizState() {

    const statusRef =

        doc(
            db,
            'quizStatus',
            'current'
        );

    const snapshot =

        await getDoc(

            statusRef

        );

    if (

        !snapshot.exists()

    ) {

        return;

    }

    const data =
        snapshot.data();

    const now =
        Date.now();

    if (

        data.status === 'LOBBY' &&

        now >= data.quizStartTime

    ) {

        await updateDoc(

            statusRef,

            {

                status: 'LIVE'

            }

        );

    }

    else if (

        data.status === 'LIVE' &&

        now >= data.quizEndTime

    ) {

        await updateDoc(

            statusRef,

            {

                status: 'ENDED'

            }

        );

    }

}
async function completeQuiz() {

    await setDoc(

        doc(

            db,

            'participants',

            loggedInUser.participantId

        ),

        {

            completed: true,

            score,

            completedAt:
                serverTimestamp()

        },

        {

            merge: true

        }

    );

}


function updateScore(correct,fastest){

let player=leaderboard.find(
l=>l.email===currentUser.email
);

if(!player){

player={
name:currentUser.name,
email:currentUser.email,
correct:0,
wrong:0,
points:0
};

leaderboard.push(player);
}

if(correct){

player.correct+=1;
player.points+=Number(settings.correctPoints);

if(fastest){
player.points+=Number(settings.fastestBonus);
}

}else{
player.wrong+=1;
}

localStorage.setItem('leaderboard',JSON.stringify(leaderboard));
}

function nextQuestion(){
current++;
loadQuestion();
}

async function finishQuiz() {

    clearInterval(

        timerInterval

    );

    try {

    await completeQuiz();

} catch (error) {

    console.error(error);

}

try {

    await updateQuizLeaderboard();

} catch (error) {

    console.error(error);

}

try {

    await updateGlobalLeaderboard();

} catch (error) {

    console.error(error);

}

await showLeaderboard(true);

    alert(

        `Quiz Completed!

Score: ${score}`

    );

}

async function exportUsers() {

    const snapshot =

        await getDocs(

            collection(

                db,

                'users'

            )

        );

    let csv =

        'Name,Email,Phone\\n';

    snapshot.forEach(

        docSnap => {

            const user =

                docSnap.data();

            csv +=

                `${user.name},${user.email},${user.phone}\\n`;

        }

    );

    downloadCSV(

        csv,

        'users.csv'

    );

}
async function exportLeaderboard() {

    const snapshot =

        await getDocs(

            collection(

                db,

                'quizLeaderboards'

            )

        );

    let csv =

        'Email,Score\\n';

    snapshot.forEach(

            docSnap => {

            const data =

                docSnap.data();

            if (

                data.quizId ===

                loggedInUser.quizId

            ) {

                csv +=

                    `${data.email},${data.score}\\n`;

            }

        }

    );

    downloadCSV(

        csv,

        'leaderboard.csv'

    );

}
function downloadCSV(

    content,

    filename

) {

    const blob =

        new Blob(

            [content],

            {

                type:

                'text/csv'

            }

        );

    const url =

        URL.createObjectURL(

            blob

        );

    const a =

        document.createElement(

            'a'

        );

    a.href = url;

    a.download = filename;

    a.click();

    URL.revokeObjectURL(

        url

    );

}

async function showLeaderboard(admin=false){

    showSection('leaderboardSection');

    await loadGlobalLeaderboard();

}

async function loadGlobalLeaderboard() {

    const table = document.getElementById(
        'leaderboardTable'
    );

    table.innerHTML = '';

    const snapshot = await getDocs(

        collection(

            db,

            'globalLeaderboards'

        )

    );

    const entries = [];

    snapshot.forEach(docSnap => {

        entries.push(

            docSnap.data()

        );

    });

    entries.sort(

        (a, b) =>

            b.totalPoints -

            a.totalPoints

    );

    table.innerHTML =

        '<tr>' +

        '<th>Rank</th>' +

        '<th>Name</th>' +

        '<th>Total Points</th>' +

        '</tr>';

    entries.forEach(

        (player, index) => {

            table.innerHTML +=

                '<tr>' +

                '<td>' +

                (index + 1) +

                '</td>' +

                '<td>' +

                player.name +

                '</td>' +

                '<td>' +

                player.totalPoints +

                '</td>' +

                '</tr>';

        }

    );

}

function renderLeaderboardManage(){
    showLeaderboard(true);
}

async function editPoints(index) {

    const points = Number(

        prompt(

            'New Points',

            leaderboard[index].totalPoints

        )

    );

    if (isNaN(points)) {

        return;

    }

    await updateDoc(

        doc(

            db,

            'globalLeaderboards',

            leaderboard[index].email

        ),

        {

            totalPoints: points

        }

    );

    renderLeaderboardManage();

}

async function removePoints(index) {

    if (

        !confirm(

            'Remove this leaderboard entry?'

        )

    ) {

        return;

    }

    await deleteDoc(

        doc(

            db,

            'globalLeaderboards',

            leaderboard[index].email

        )

    );

    renderLeaderboardManage();

}


async function clearLeaderboard() {

    if (

        !confirm(

            'Clear entire leaderboard?'

        )

    ) {

        return;

    }

    const snapshot = await getDocs(

        collection(

            db,

            'globalLeaderboards'

        )

    );

    for (

        const docSnap of snapshot.docs

    ) {

        await deleteDoc(

            docSnap.ref

        );

    }

    renderLeaderboardManage();

    alert(

        'Leaderboard Cleared'

    );

}

async function renderUsers() {

    const list = document.getElementById(
        'usersList'
    );

    list.innerHTML = '';

    const snapshot = await getDocs(

        collection(

            db,

            'users'

        )

    );

    snapshot.forEach(docSnap => {

        const u = docSnap.data();

        const div = document.createElement(
            'div'
        );

        div.className = 'card';

        div.innerHTML =

            '<p><b>' +

            u.name +

            '</b><br>' +

            u.email +

            '<br>' +

            u.phone +

            '</p>' +

            '<button onclick="editUser(\'' +

            u.email +

            '\')">Edit</button>' +

            '<button onclick="deleteUser(\'' +

            u.email +

            '\')">Delete</button>';

        list.appendChild(div);

    });

}

async function editUser(email) {
    const userDoc = await getDoc(
        doc(
            db,
            'users',
            email
        )
    );

    const u = userDoc.data();

    const name = prompt(

        'Name',

        u.name

    );

    const phone = prompt(

        'Phone',

        u.phone

    );

    await updateDoc(

        doc(

            db,

            'users',

            email

        ),

        {

            name,

            phone

        }

    );

    renderUsers();

}

async function deleteUser(email) {

    if (

        !confirm(

            'Delete user?'

        )

    ) {

        return;

    }

    await deleteDoc(

        doc(

            db,

            'users',

            email

        )

    );

    renderUsers();

}

async function clearUsers() {

    if (

        !confirm(

            'Delete all users?'

        )

    ) {

        return;

    }

    const snapshot = await getDocs(

        collection(

            db,

            'users'

        )

    );

    for (

        const docSnap of snapshot.docs

    ) {

        await deleteDoc(

            docSnap.ref

        );

    }

    renderUsers();

    alert(

        'Users Cleared'

    );

}


async function saveSettings() {

    await setDoc(

        doc(

            db,

            'settings',

            'quiz'

        ),

        {

            correctPoints:

                Number(

                    document.getElementById(

                        'correctPoints'

                    ).value

                ),

            fastestBonus:

                Number(

                    document.getElementById(

                        'fastestBonus'

                    ).value

                )

        }

    );

    alert(

        'Settings Updated'

    );

}
function showHelp(){

alert(
'POINT SYSTEM\n\n'+
'Correct Answer: +'+settings.correctPoints+'\n'+
'Fastest Bonus: +'+settings.fastestBonus+'\n\n'+
'RULES\n'+
'- 15 seconds per question\n'+
'- One answer only\n'+
'- Quiz starts only after admin starts\n'+
'- Users can only VIEW leaderboard'
);
}

function updateCountdown(){

const wc=new Date('June 11, 2026').getTime();

const now=new Date().getTime();

const div=document.getElementById('countdown');

if(now<wc){

const days=Math.floor((wc-now)/(1000*60*60*24));

div.innerText='FIFA World Cup Starts In: '+days+' Days';

}else{

div.innerText='Daily Quiz Starts at 7 PM';
}
}

setInterval(updateCountdown,1000);

listenForQuizStatus();

onAuthStateChanged(auth, user => {

    if (user) {

        setInterval(

            updateQuizState,

            5000

        );

    }

});
window.showSection = showSection;
window.showRegister = showRegister;
window.joinQuiz = joinQuiz;
window.registerUser = registerUser;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.generateAIQuestions = generateAIQuestions;
window.addQuestion = addQuestion;
window.publishQuiz = publishQuiz;
window.startQuiz = startQuiz;
window.exportUsers = exportUsers;
window.exportLeaderboard = exportLeaderboard;
window.clearLeaderboard = clearLeaderboard;
window.clearUsers = clearUsers;
window.saveSettings = saveSettings;
window.showLeaderboard = showLeaderboard;
window.editPoints = editPoints;
window.removePoints = removePoints;
window.showHelp = showHelp;
window.updateQuestion = updateQuestion;
window.updateOption = updateOption;
window.updateAnswer = updateAnswer;
window.deleteQuestion = deleteQuestion;
window.renderUsers = renderUsers;
window.editUser = editUser;
window.deleteUser = deleteUser;
