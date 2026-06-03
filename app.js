
let users = JSON.parse(localStorage.getItem('users')) || [];
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
correctPoints:2,
fastestBonus:1
};

let usedQuestions = JSON.parse(localStorage.getItem('usedQuestions')) || [];

let quiz = JSON.parse(localStorage.getItem('quiz')) || [];

let quizStarted = false;
let currentUser = null;
let current = 0;
let answered = false;
let timer = 15;
let interval;
let questionStartTime;

const pool = [
{question:'Which country won FIFA 2022?',options:['Argentina','Brazil','France','Germany'],answer:0},
{question:'Who is CR7?',options:['Messi','Ronaldo','Mbappe','Neymar'],answer:1},
{question:'Who won FIFA 2018?',options:['France','Brazil','Argentina','Germany'],answer:0},
{question:'Who won FIFA 2006?',options:['Italy','France','Brazil','Germany'],answer:0},
{question:'Who scored Hand of God goal?',options:['Maradona','Messi','Pele','Ronaldo'],answer:0},
{question:'Which country hosted FIFA 2010?',options:['South Africa','Brazil','Russia','Germany'],answer:0},
{question:'Which stadium hosted FIFA 2022 final?',options:['Lusail Stadium','Camp Nou','Maracana','Wembley'],answer:0},
{question:'Who captained Argentina in 2022?',options:['Messi','Di Maria','Otamendi','Dybala'],answer:0},
{question:'Which nation lost 7-1 to Germany?',options:['Brazil','France','Spain','Italy'],answer:0},
{question:'Which goalkeeper had most clean sheets in FIFA 2006?',options:['Buffon','Casillas','Kahn','Barthez'],answer:0},
{question:'Who won FIFA 1998?',options:['France','Brazil','Germany','Italy'],answer:0},
{question:'Which player scored most World Cup goals?',options:['Klose','Ronaldo','Pele','Messi'],answer:0},
{question:'Who won Ballon d’Or 2023?',options:['Messi','Ronaldo','Mbappe','Haaland'],answer:0},
{question:'Which nation won first FIFA World Cup?',options:['Uruguay','Brazil','Germany','Italy'],answer:0},
{question:'Who won Copa America 2021?',options:['Argentina','Brazil','Chile','Uruguay'],answer:0}
];

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

function registerUser(){

const name=document.getElementById('name').value;
const email=document.getElementById('email').value;
const phone=document.getElementById('phone').value;

if(!name || !email || !phone){
alert('Enter all details');
return;
}

const exists = users.find(u=>u.email===email);

if(exists){
alert('User already exists');
return;
}

users.push({name,email,phone});

localStorage.setItem('users',JSON.stringify(users));

document.getElementById('name').value='';
document.getElementById('email').value='';
document.getElementById('phone').value='';

document.getElementById('registerBox').classList.add('hidden');

renderUsers();

alert('Registration Successful');
}

function joinQuiz(){

const email=document.getElementById('loginEmail').value;

const user=users.find(u=>u.email===email);

if(!user){
alert('Please register first');
return;
}

if(!quizStarted){
alert('Quiz not started by admin');
return;
}

currentUser=user;

showSection('quizSection');

current=0;

loadQuestion();
}

function adminLogin(){

const pass=document.getElementById('adminPassword').value;

if(pass==='vvv888_+'){

document.getElementById('dashboard').classList.remove('hidden');

document.getElementById('correctPoints').value=settings.correctPoints;
document.getElementById('fastestBonus').value=settings.fastestBonus;

renderUsers();
renderQuestions();
renderLeaderboardManage();

alert('Admin Login Successful');

}else{
alert('Wrong Password');
}
}

function generateAIQuestions(){

let available = pool.filter(
q=>!usedQuestions.includes(q.question)
);

if(available.length < 10){
usedQuestions=[];
available=[...pool];
}

available=available.sort(()=>Math.random()-0.5);

quiz=available.slice(0,10);

quiz.forEach(q=>{
usedQuestions.push(q.question);
});

localStorage.setItem('usedQuestions',JSON.stringify(usedQuestions));
localStorage.setItem('quiz',JSON.stringify(quiz));

renderQuestions();

alert('10 Unique Questions Generated');
}

function renderQuestions(){

const list=document.getElementById('questionsList');

list.innerHTML='';

quiz.forEach((q,index)=>{

const div=document.createElement('div');

div.className='card';

div.innerHTML=
'<p><b>Q'+(index+1)+':</b> '+q.question+'</p>'+
'<ul>'+
'<li>A. '+q.options[0]+'</li>'+
'<li>B. '+q.options[1]+'</li>'+
'<li>C. '+q.options[2]+'</li>'+
'<li>D. '+q.options[3]+'</li>'+
'</ul>'+
'<p><b>Correct:</b> '+q.options[q.answer]+'</p>'+
'<button onclick="editQuestion('+index+')">Edit</button>'+
'<button onclick="deleteQuestion('+index+')">Delete</button>';

list.appendChild(div);

});
}

function addQuestion(){

const question=prompt('Question');
const a=prompt('Option A');
const b=prompt('Option B');
const c=prompt('Option C');
const d=prompt('Option D');
const answer=Number(prompt('Correct Answer Index (0-3)'));

quiz.push({
question,
options:[a,b,c,d],
answer
});

localStorage.setItem('quiz',JSON.stringify(quiz));

renderQuestions();
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

renderQuestions();
}

function deleteQuestion(index){

quiz.splice(index,1);

localStorage.setItem('quiz',JSON.stringify(quiz));

renderQuestions();
}

function startQuiz(){
quizStarted=true;
alert('Quiz Started');
}

function loadQuestion(){

answered=false;

if(current>=quiz.length){
finishQuiz();
return;
}

questionStartTime=Date.now();

const q=quiz[current];

document.getElementById('question').innerText=q.question;

const options=document.getElementById('options');

options.innerHTML='';

q.options.forEach((opt,index)=>{

const btn=document.createElement('button');

btn.innerText=opt;

btn.onclick=()=>submitAnswer(index);

options.appendChild(btn);

});

timer=15;

document.getElementById('timer').innerText=timer;

clearInterval(interval);

interval=setInterval(()=>{

timer--;

document.getElementById('timer').innerText=timer;

if(timer<=0){
clearInterval(interval);
nextQuestion();
}

},1000);
}

function submitAnswer(index){

if(answered) return;

answered=true;

const q=quiz[current];

const correct=index===q.answer;

const responseTime=Date.now()-questionStartTime;

const fastest=responseTime<3000;

updateScore(correct,fastest);

clearInterval(interval);

setTimeout(()=>{
nextQuestion();
},100);
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

function finishQuiz(){

document.getElementById('question').innerText='Quiz Completed';

document.getElementById('options').innerHTML='';

quizStarted=false;

showLeaderboard(false);
}

function showLeaderboard(admin=false){

showSection('leaderboardSection');

const table=document.getElementById('leaderboardTable');

let html='<tr><th>Name</th><th>Correct</th><th>Wrong</th><th>Points</th>';

if(admin){
html+='<th>Action</th>';
}

html+='</tr>';

leaderboard.sort((a,b)=>b.points-a.points);

leaderboard.forEach((l,index)=>{

html+='<tr>'+
'<td>'+l.name+'</td>'+
'<td>'+l.correct+'</td>'+
'<td>'+l.wrong+'</td>'+
'<td>'+l.points+'</td>';

if(admin){

html+='<td>'+
'<button onclick="editPoints('+index+')">Edit</button>'+
'<button onclick="removePoints('+index+')">Remove</button>'+
'</td>';

}

html+='</tr>';

});

table.innerHTML=html;
}

function renderLeaderboardManage(){
showLeaderboard(true);
}

function editPoints(index){

const points=Number(
prompt('New Points',leaderboard[index].points)
);

leaderboard[index].points=points;

localStorage.setItem('leaderboard',JSON.stringify(leaderboard));

renderLeaderboardManage();
}

function removePoints(index){

leaderboard.splice(index,1);

localStorage.setItem('leaderboard',JSON.stringify(leaderboard));

renderLeaderboardManage();
}

function clearLeaderboard(){

leaderboard=[];

localStorage.setItem('leaderboard',JSON.stringify(leaderboard));

renderLeaderboardManage();

alert('Leaderboard Cleared');
}

function renderUsers(){

const list=document.getElementById('usersList');

list.innerHTML='';

users.forEach((u,index)=>{

const div=document.createElement('div');

div.className='card';

div.innerHTML=
'<p><b>'+u.name+'</b><br>'+u.email+'<br>'+u.phone+'</p>'+
'<button onclick="editUser('+index+')">Edit</button>'+
'<button onclick="deleteUser('+index+')">Delete</button>';

list.appendChild(div);

});
}

function editUser(index){

const u=users[index];

const name=prompt('Name',u.name);
const email=prompt('Email',u.email);
const phone=prompt('Phone',u.phone);

users[index]={name,email,phone};

localStorage.setItem('users',JSON.stringify(users));

renderUsers();
}

function deleteUser(index){

users.splice(index,1);

localStorage.setItem('users',JSON.stringify(users));

renderUsers();
}

function clearUsers(){

users=[];

localStorage.setItem('users',JSON.stringify(users));

renderUsers();

alert('Users Cleared');
}

function exportUsers(){

let csv='Name,Email,Phone\n';

users.forEach(u=>{
csv+=u.name+','+u.email+','+u.phone+'\n';
});

downloadCSV(csv,'users.csv');
}

function exportLeaderboard(){

let csv='Name,Correct,Wrong,Points\n';

leaderboard.forEach(l=>{
csv+=l.name+','+l.correct+','+l.wrong+','+l.points+'\n';
});

downloadCSV(csv,'leaderboard.csv');
}

function downloadCSV(content,file){

const blob=new Blob([content],{type:'text/csv'});

const a=document.createElement('a');

a.href=URL.createObjectURL(blob);

a.download=file;

a.click();
}

function saveSettings(){

settings.correctPoints=
Number(document.getElementById('correctPoints').value);

settings.fastestBonus=
Number(document.getElementById('fastestBonus').value);

localStorage.setItem('settings',JSON.stringify(settings));

alert('Settings Updated');
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

showLeaderboard(false);
