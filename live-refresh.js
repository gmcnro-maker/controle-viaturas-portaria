// Consulta automática serial, sem trocar a sessão nem apagar rascunhos.
(()=>{
 let busy=0,dirty=false,failures=0,generation=0;
 document.addEventListener('input',e=>{if(e.target.closest('#departure,#action-form,#register,#access-form,#profile-form'))dirty=true;});
 document.addEventListener('change',e=>{if(e.target.closest('form'))dirty=true;});
 document.addEventListener('close',e=>{if(e.target.id==='action-dialog')dirty=false;},true);
 const priorRefresh=refresh;refresh=async function(){generation++;busy++;try{await priorRefresh();dirty=false;}finally{busy--;}};
 async function check(){
  if(busy||document.hidden||!state?.user||document.querySelector('#action-dialog[open]')||dirty||document.querySelector('button[type=submit]:disabled'))return;
  busy++;const started=generation;try{const next=await api('state');if(started!==generation||dirty||document.querySelector('#action-dialog[open]'))return;if(JSON.stringify(next)!==JSON.stringify(state)){state=next;render();}failures=0;}catch{failures=Math.min(failures+1,3);}finally{busy--;}
 }
 async function loop(){await check();setTimeout(loop,15000*(failures+1));}setTimeout(loop,15000);
 window.addEventListener('focus',check);document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
 const priorClear=window.cep4Clear;window.cep4Clear=function(...args){generation++;dirty=false;return priorClear?.(...args);};
})();
