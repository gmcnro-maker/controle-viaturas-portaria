(()=>{
 function eligibleUsers(){return state.users.filter(u=>!u.deleted&&u.googleUid&&/@(?:acesso|matricula)\.cep4\.invalid$/.test(u.email));}
 function openPasswords(selected=''){
  const dialog=document.querySelector('#action-dialog'),users=eligibleUsers();
  dialog.innerHTML='<form id="password-change-form"><h2>Alteração de senhas</h2><label>Login<select name="userId" required><option value="">Selecione o usuário</option>'+users.map(u=>'<option value="'+esc(u.id)+'" '+(u.id===selected?'selected':'')+'>'+esc(u.email.split('@')[0])+(u.active?'':' · Inativo')+'</option>').join('')+'</select></label><label>Nova senha<input name="newPassword" type="password" required minlength="6" maxlength="128" autocomplete="new-password" placeholder="Mínimo de 6 caracteres"></label><p id="password-change-error" role="alert"></p><div class="button-row"><button type="button" class="secondary" data-cancel-password>Fechar</button><button type="submit">Salvar</button></div></form>';
  const form=dialog.querySelector('form');window.cep4EnhancePasswords(form);dialog.querySelector('[data-cancel-password]').onclick=()=>dialog.close();
  form.onsubmit=async e=>{e.preventDefault();const submit=form.querySelector('[type=submit]'),error=form.querySelector('[role=alert]');error.textContent='';submit.disabled=true;
   try{await api('users/password',{id:form.elements.userId.value,newPassword:form.elements.newPassword.value});form.elements.newPassword.value='';notify('Senha alterada com sucesso.');dialog.close();}catch(e){error.textContent=e.message;}finally{submit.disabled=false;}
  };
  dialog.addEventListener('close',()=>{form.reset();},{once:true});dialog.showModal();(selected?form.elements.newPassword:form.elements.userId).focus();
 }
 const previousRender=render;
 render=function(){previousRender();if(state.user.role!=='Administrador'||state.user.customRole)return;
  const button=()=>{const b=document.createElement('button');b.type='button';b.dataset.passwordPanel='';b.textContent='Alteração de senhas';b.onclick=()=>openPasswords();return b;};
  const nav=document.querySelector('#sidebar nav');if(nav)nav.append(button());
  if(page==='Painel'||page==='Acessos')document.querySelector('.page-heading')?.append(button());
 };
 const section=accessUsersSection;
 accessUsersSection=function(){
  const box=document.createElement('div');box.innerHTML=section();
  if(state.user.role==='Administrador'&&!state.user.customRole)box.querySelectorAll('[data-access]').forEach(edit=>{
   const u=state.users.find(u=>u.id===edit.dataset.access);
   if(!u||u.deleted||!u.googleUid||!/@(?:acesso|matricula)\.cep4\.invalid$/.test(u.email))return;
   const button=document.createElement('button');button.type='button';button.className='secondary';button.dataset.passwordUser=u.id;button.textContent='Alterar senha';edit.after(document.createTextNode(' '),button);
  });return box.innerHTML;
 };
 const wire=bind;
 bind=function(){wire();if(state.user.role!=='Administrador'||state.user.customRole)return;
  const access=document.querySelector('#access-form');
  if(access){
   access.querySelector('label:has([name=initialPassword])')?.insertAdjacentHTML('beforeend','<small>Usada somente ao criar uma conta. Para uma conta existente, clique em Alterar senha na lista.</small>');
   document.querySelectorAll('[data-access]').forEach(b=>{const edit=b.onclick;b.onclick=e=>{edit?.call(b,e);access.elements.account.readOnly=true;access.elements.googleUid.readOnly=true;access.elements.initialPassword.disabled=true;access.elements.initialPassword.value='';};});
   const clear=document.createElement('button');clear.type='button';clear.className='secondary';clear.textContent='Novo usuário';clear.onclick=()=>{access.reset();access.elements.account.readOnly=false;access.elements.googleUid.readOnly=false;access.elements.initialPassword.disabled=false;access.elements.account.focus();};access.prepend(clear);
  }
  document.querySelectorAll('[data-password-user]').forEach(b=>b.onclick=()=>openPasswords(b.dataset.passwordUser));
 };
})();
