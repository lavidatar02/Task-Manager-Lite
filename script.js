const TASKS_KEY='task-manager-lite-tasks';
const PROFILE_KEY='task-manager-lite-profile';
const THEME_KEY='task-manager-lite-theme';
const starterTasks=[
  {id:'python',title:'Complete Python Assignment',status:'Pending',priority:'Medium'},
  {id:'portfolio',title:'Build Personal Portfolio Website',status:'In Progress',priority:'Critical'},
  {id:'practice',title:"I'm Currently Practicing Python, Java and HTML",status:'In Progress',priority:'High'},
  {id:'database',title:'Read Database Notes',status:'Pending',priority:'Low'},
  {id:'student',title:'Student Management System Project',status:'Completed',priority:'Critical'}
];
let tasks=load(TASKS_KEY,starterTasks), profile=load(PROFILE_KEY,'Lavi'), editingId=null;
const $=id=>document.getElementById(id), esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function load(key,fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
function setStored(key,value){try{localStorage.setItem(key,value)}catch{ /* Local Server/file mode may restrict storage. */ }}
function save(){setStored(TASKS_KEY,JSON.stringify(tasks))}
function slug(v){return v.toLowerCase().replace(/\s+/g,'-')}
function greeting(){const hour=new Date().getHours();return `${hour<12?'Good Morning':hour<18?'Good Afternoon':'Good Evening'}, ${esc(profile)}`}
function render(){
  const query=$('searchInput').value.toLowerCase().trim(), visible=tasks.filter(t=>t.title.toLowerCase().includes(query));
  const active=visible.filter(t=>t.status!=='Completed'), completed=visible.filter(t=>t.status==='Completed');
  $('greeting').innerHTML=greeting();$('taskCount').textContent=tasks.length+'';
  $('taskCount').parentElement.innerHTML=`You've got <em id="taskCount">${tasks.length}</em> task${tasks.length===1?'':'s'} today`;
  $('activeTasks').innerHTML=active.length?active.map(taskHTML).join(''):'<div class="empty">No matching active tasks</div>';
  $('completedTasks').innerHTML=completed.length?completed.map(taskHTML).join(''):'<div class="empty">No completed tasks</div>';
  const done=tasks.filter(t=>t.status==='Completed').length;
  $('completionRate').textContent=tasks.length?Math.round(done/tasks.length*100)+'%':'0%';
  $('totalTasks').textContent=tasks.length;$('completedCount').textContent=done;$('pendingCount').textContent=tasks.filter(t=>t.status==='Pending').length;
}
function taskHTML(t){return `<div class="task-row ${t.status==='Completed'?'done':''}" data-id="${esc(t.id)}"><button class="task-check" data-action="toggle" aria-label="Toggle task">${t.status==='Completed'?'✓':''}</button><span class="task-title">${esc(t.title)}</span><div class="task-meta"><span class="status ${slug(t.status)}">${esc(t.status)}</span><span class="priority ${slug(t.priority)}">${esc(t.priority)}</span><span class="cf">CF</span><button class="row-action" data-action="edit" aria-label="Edit task">♢</button><button class="row-action" data-action="delete" aria-label="Delete task">♧</button></div></div>`}
function openTask(id){
  editingId=id;const t=tasks.find(x=>x.id===id), add=!t;
  $('modalEyebrow').textContent=add?'TASK':'UPDATE TASK';$('modalTitle').textContent=add?'Add New Task':'Update Task';
  $('taskTitle').value=t?.title||'';$('taskStatus').value=t?.status||'Pending';$('taskPriority').value=t?.priority||'Medium';$('modalBackdrop').hidden=false;$('taskTitle').focus();
}
function closeTask(){$('modalBackdrop').hidden=true;editingId=null}
function accountHTML(){return `<div class="account-header"><span class="avatar">♙</span><div><strong>${esc(profile)}</strong><small>Personal workspace</small></div><span class="online"></span></div><div class="active-card"><strong>● &nbsp;Account active</strong><p>Your task list is saved locally on this device.</p></div><div><button class="setting-button" data-setting="profile">♙ &nbsp; Edit Profile</button><button class="setting-button" data-setting="appearance">◐ &nbsp; Appearance</button><button class="setting-button" data-setting="about">ⓘ &nbsp; About</button></div>`}
function openSettings(type){$('accountPanel').classList.remove('open');const content={profile:`<button class="close-button" data-close-settings>×</button><p class="eyebrow">ACCOUNT</p><h2>Edit Profile</h2><label>Display name<input id="profileInput" value="${esc(profile)}" maxlength="40"></label><button class="primary-button full-button" data-save-profile>Save Profile</button>`,appearance:`<button class="close-button" data-close-settings>×</button><p class="eyebrow">PREFERENCES</p><h2>Appearance</h2><p>Choose how Task Manager Lite looks on this device.</p><button class="primary-button full-button" data-theme-toggle>Use ${document.body.classList.contains('dark')?'Light':'Dark'} Mode</button>`,about:`<button class="close-button" data-close-settings>×</button><p class="eyebrow">TASK MANAGER LITE</p><h2>About</h2><p>A focused task dashboard for organizing work. Your tasks and preferences stay on this device.</p>`}[type];$('settingsModal').innerHTML=content;$('settingsBackdrop').hidden=false}
document.addEventListener('click',e=>{
  const action=e.target.closest('[data-action]')?.dataset.action,id=e.target.closest('[data-id]')?.dataset.id;
  if(action&&id){const t=tasks.find(x=>x.id===id);if(action==='toggle')t.status=t.status==='Completed'?'Pending':'Completed';if(action==='edit')return openTask(id);if(action==='delete'&&confirm('Delete this task?'))tasks=tasks.filter(x=>x.id!==id);save();render();return}
  const setting=e.target.closest('[data-setting]')?.dataset.setting;if(setting)return openSettings(setting);
  if(e.target.closest('[data-close-settings]')){$('settingsBackdrop').hidden=true}
  if(e.target.closest('[data-save-profile]')){profile=$('profileInput').value.trim()||'Lavi';setStored(PROFILE_KEY,JSON.stringify(profile));$('settingsBackdrop').hidden=true;$('accountPanel').innerHTML=accountHTML();render()}
  if(e.target.closest('[data-theme-toggle]')){toggleTheme();$('settingsBackdrop').hidden=true}
});
$('addButton').onclick=()=>openTask();$('closeModal').onclick=closeTask;$('searchInput').oninput=render;
$('taskForm').onsubmit=e=>{e.preventDefault();const data={title:$('taskTitle').value.trim(),status:$('taskStatus').value,priority:$('taskPriority').value};if(!data.title)return;if(editingId){Object.assign(tasks.find(t=>t.id===editingId),data)}else tasks.push({id:Date.now().toString(),...data});save();closeTask();render()};
$('profileButton').onclick=()=>{$('notificationsPopover').classList.remove('open');$('accountPanel').innerHTML=accountHTML();$('accountPanel').classList.toggle('open')};
$('notificationButton').onclick=()=>{$('accountPanel').classList.remove('open');$('notificationsPopover').classList.toggle('open')};
$('modalBackdrop').onclick=e=>{if(e.target===$('modalBackdrop'))closeTask()};$('settingsBackdrop').onclick=e=>{if(e.target===$('settingsBackdrop'))$('settingsBackdrop').hidden=true};
function toggleTheme(){document.body.classList.toggle('dark');setStored(THEME_KEY,document.body.classList.contains('dark')?'dark':'light')}
if(load(THEME_KEY,'light')==='dark')document.body.classList.add('dark');setInterval(render,60000);render();