(()=>{
 const section=accessUsersSection;
 accessUsersSection=function(){
  const box=document.createElement('div');box.innerHTML=section();
  if(state.user.role==='Administrador'&&!state.user.customRole)box.querySelectorAll('[data-access]').forEach(edit=>{
   const u=state.users.find(u=>u.id===edit.dataset.access);
   if(!u||u.deleted||!u.googleUid||u.role==='Motorista'||!u.email.endsWith('@acesso.cep4.invalid'))return;
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
  document.querySelectorAll('[data-password-user]').forEach(b=>b.onclick=()=>{
   const u=state.users.find(u=>u.id===b.dataset.passwordUser),dialog=document.querySelector('#action-dialog');
   dialog.innerHTML='<form id="password-change-form"><h2>Alterar senha</h2><p>Usuário: <strong>'+esc(u.email.split('@')[0])+'</strong></p><label>Nova senha<input name="newPassword" type="password" required minlength="6" maxlength="128" autocomplete="new-password"></label><label>Confirmar nova senha<input name="confirmation" type="password" required minlength="6" maxlength="128" autocomplete="new-password"></label><p>Mínimo de 6 caracteres. O login e o perfil permanecem os mesmos.</p><p id="password-change-error" role="alert"></p><div class="button-row"><button type="button" class="secondary" data-cancel-password>Cancelar</button><button type="submit">Salvar nova senha</button></div></form>';
   const form=dialog.querySelector('form');window.cep4EnhancePasswords(form);dialog.querySelector('[data-cancel-password]').onclick=()=>dialog.close();
   form.onsubmit=async e=>{e.preventDefault();const submit=form.querySelector('[type=submit]'),error=form.querySelector('[role=alert]');error.textContent='';
    if(form.elements.newPassword.value!==form.elements.confirmation.value){error.textContent='As senhas não coincidem.';return;}
    submit.disabled=true;try{await api('users/password',{id:u.id,newPassword:form.elements.newPassword.value});form.reset();dialog.close();notify('Senha alterada. Use o mesmo login com a nova senha.');}catch(e){error.textContent=e.message;}finally{submit.disabled=false;}
   };dialog.addEventListener('close',()=>{form.reset();},{once:true});dialog.showModal();form.elements.newPassword.focus();
  });
 };
})();
