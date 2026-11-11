'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {db} from '@/lib/supabase';

export default function SetPassword(){
 const router=useRouter();
 const [ready,setReady]=useState(false);
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  let active=true;
  const auth=db().auth;
  async function check(){
   const hash=new URLSearchParams(window.location.hash.slice(1));
   const query=new URLSearchParams(window.location.search);
   const code=query.get('code');
   if(code){
    const {error}=await auth.exchangeCodeForSession(code);
    if(error){if(active)setMessage(error.message);return;}
    window.history.replaceState(null,'',window.location.pathname);
   }else if(hash.get('access_token')&&hash.get('refresh_token')){
    const {error}=await auth.setSession({access_token:hash.get('access_token')!,refresh_token:hash.get('refresh_token')!});
    if(error){if(active)setMessage(error.message);return;}
    window.history.replaceState(null,'',window.location.pathname);
   }
   const {data,error}=await auth.getUser();
   if(!active)return;
   if(error||!data.user){setMessage('Abra o link do convite ou de recuperação recebido por e-mail para definir sua senha.');return;}
   setReady(true);
  }
  void check();
  return()=>{active=false};
 },[]);
 async function save(e:React.FormEvent){
  e.preventDefault();setMessage('');
  if(password.length<8){setMessage('Use pelo menos 8 caracteres.');return;}
  if(password!==confirm){setMessage('As senhas não coincidem.');return;}
  setBusy(true);
  const {error}=await db().auth.updateUser({password});
  if(error)setMessage(error.message);
  else router.replace('/dashboard');
  setBusy(false);
 }
 return <div className="auth panel">
  <div className="brand"><i/>Social Media OS</div>
  <h1>Criar senha</h1>
  <p>Defina a senha para acessar seu espaço de trabalho na Mella.</p>
  {ready?<form onSubmit={save}>
   <div className="field"><label>Nova senha</label><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></div>
   <div className="field"><label>Confirmar senha</label><input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></div>
   <button className="button" disabled={busy}>{busy?'Salvando…':'Salvar senha'}</button>
  </form>:!message?<p>Verificando convite…</p>:null}
  {message&&<p role="status">{message}</p>}
 </div>;
}
