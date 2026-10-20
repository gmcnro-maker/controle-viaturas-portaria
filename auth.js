import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,setPersistence,inMemoryPersistence} from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
const settings=window.CEP4_CONFIG,message=document.querySelector('#login-message'),button=document.querySelector('#google-login'),frame=document.querySelector('#cep4-bridge');
const pending=new Map(),retries=new Map();let peer=null,peerOrigin='',auth=null,current=null,channel='';
const trustedOrigin=origin=>{try{const u=new URL(origin);return u.protocol==='https:'&&(u.hostname==='script.google.com'||u.hostname==='script.googleusercontent.com'||/^[a-z0-9-]+-script\.googleusercontent\.com$/.test(u.hostname));}catch{return false;}};
function receive(event){
 const data=event.data;if(!data||data.channel!==channel||!trustedOrigin(event.origin))return;
 if(data.type==='CEP4_READY'){
  if(peer&&peer!==event.source)return;peer=event.source;peerOrigin=event.origin;button.disabled=false;message.textContent='Motorista: use seu Gmail autorizado. Guarda, P4 e Administrador: use usuário e senha.';return;
 }
 if(data.type!=='CEP4_RESULT'||event.source!==peer||event.origin!==peerOrigin)return;
 const entry=pending.get(data.id);if(!entry)return;pending.delete(data.id);clearTimeout(entry.timer);
 if(data.error)entry.reject(Error(data.error));else entry.resolve(data.value);
}
window.addEventListener('message',receive);
window.cep4Api=async(path,input)=>{
 if(!current||!peer)throw Error('Entre com Google para continuar.');
 const publicInput={...(input||{})};delete publicInput.adminPassword;
 const key=JSON.stringify({uid:current.uid,path,input:publicInput});let operationId=retries.get(key);
 if(input&&!operationId){operationId=crypto.randomUUID();retries.set(key,operationId);}
 const token=await current.getIdToken();
 return new Promise((resolve,reject)=>{
  const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('Não foi possível confirmar a resposta. Consulte os registros antes de repetir.'));},90000);
  pending.set(id,{timer,reject,resolve:value=>{retries.delete(key);if(value?.warning)message.textContent=value.warning;resolve(value);}});
  peer.postMessage({type:'CEP4_RPC',channel,id,path,input:input||{},operationId:operationId||null,token},peerOrigin);
 });
};
window.cep4Logout=async()=>{current=null;retries.clear();for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Sessão encerrada.'));}pending.clear();await signOut(auth);window.cep4Clear();};
async function boot(){
 if(!settings?.firebase?.apiKey||!settings.firebase.projectId||!settings.firebase.authDomain||!settings.firebase.appId)throw Error('O responsável ainda precisa configurar o login Google. Nenhum dado pode ser enviado.');
 const endpoint=new URL(settings.webAppUrl);if(endpoint.origin!=='https://script.google.com'||!endpoint.pathname.endsWith('/exec'))throw Error('Endereço do serviço CEP4 inválido.');
 auth=getAuth(initializeApp(settings.firebase));auth.languageCode='pt-BR';await setPersistence(auth,inMemoryPersistence);
 const p4=document.createElement('form');p4.innerHTML='<details><summary>Guarda, P4 e Administrador · usuário e senha</summary><label>Usuário<input name="email" type="text" required autocomplete="username" pattern="[A-Za-z0-9._-]{3,40}" maxlength="40"></label><label>Senha<input name="password" type="password" required autocomplete="current-password"></label><button type="submit">Entrar</button></details>';button.after(p4);window.cep4EnhancePasswords(p4);
 p4.onsubmit=async event=>{event.preventDefault();const submit=p4.querySelector('button[type=submit]');submit.disabled=true;try{if(!peer)throw Error('Aguarde a conexão com o CEP4.');const credential=await signInWithEmailAndPassword(auth,p4.elements.email.value.trim().toLowerCase()+'@acesso.cep4.invalid',p4.elements.password.value);current=credential.user;await window.cep4Load();}catch(error){current=null;await signOut(auth);window.cep4Clear();message.textContent=error.message;}finally{p4.elements.password.value='';submit.disabled=false;}};
 channel=crypto.randomUUID();endpoint.searchParams.set('channel',channel);frame.src=endpoint.href;
 button.onclick=async()=>{button.disabled=true;try{
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  const credential=await signInWithPopup(auth,provider);current=credential.user;
  message.textContent='Verificando autorização no CEP4…';await window.cep4Load();
 }catch(error){current=null;if(auth)await signOut(auth);window.cep4Clear();message.textContent=error.code==='auth/popup-blocked'?'Permita a janela de login do Google para entrar.':error.message||'Não foi possível entrar.';}finally{button.disabled=!peer;}};
 setTimeout(()=>{if(!peer)message.textContent='A conexão com o CEP4 não respondeu. Confira a implantação e a origem autorizada.';},30000);
}
boot().catch(error=>{message.textContent=error.message;button.disabled=true;});

let provisioningAuth=null;
window.cep4CreateInternalAccount=async(login,password)=>{
 if(!/^[a-z0-9._-]{3,40}$/.test(login)||typeof password!=='string'||password.length<6)throw Error('Use usuário de 3 a 40 caracteres e senha com pelo menos 6 caracteres.');
 if(!provisioningAuth){provisioningAuth=getAuth(initializeApp(settings.firebase,'cep4-provisioning'));await setPersistence(provisioningAuth,inMemoryPersistence);}
 try{const result=await createUserWithEmailAndPassword(provisioningAuth,login+'@acesso.cep4.invalid',password);return result.user.uid;}finally{await signOut(provisioningAuth);}
};
