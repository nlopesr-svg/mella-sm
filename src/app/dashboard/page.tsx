'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import AuthGate from '@/components/AuthGate';
import {db,type Client} from '@/lib/supabase';
import {useLanguage} from '@/components/LanguageProvider';
type Deadline={id:string;client_id:string|null;title:string;due_date:string;completed:boolean};
const dateKey=(y:number,m:number,d:number)=>`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
export default function Dashboard(){
 const {lang,t}=useLanguage();const today=new Date();
 const [month,setMonth]=useState(new Date(today.getFullYear(),today.getMonth(),1));
 const [clients,setClients]=useState<Client[]>([]);const[deadlines,setDeadlines]=useState<Deadline[]>([]);
 const [title,setTitle]=useState('');const[day,setDay]=useState(dateKey(today.getFullYear(),today.getMonth(),today.getDate()));const[clientId,setClientId]=useState('');
 const [error,setError]=useState('');const[busy,setBusy]=useState(false);
 async function refresh(){
  const [c,d]=await Promise.all([db().from('clients').select('*').is('deleted_at',null).eq('archived',false).order('name'),db().from('internal_deadlines').select('*').order('due_date')]);
  if(c.error)setError(c.error.message);else setClients((c.data||[]) as Client[]);
  if(d.error)setError(d.error.message);else setDeadlines((d.data||[]) as Deadline[]);
 }
 useEffect(()=>{void refresh()},[]);
 async function add(e:React.FormEvent){e.preventDefault();if(!title.trim()||!day)return;setBusy(true);const{error}=await db().from('internal_deadlines').insert({title:title.trim(),due_date:day,client_id:clientId||null});if(error)setError(error.message);else{setTitle('');await refresh()}setBusy(false)}
 async function toggle(item:Deadline){const{error}=await db().from('internal_deadlines').update({completed:!item.completed}).eq('id',item.id);if(error)setError(error.message);else await refresh()}
 async function remove(id:string){if(!confirm(lang==='pt'?'Excluir este prazo?':'Delete this deadline?'))return;const{error}=await db().from('internal_deadlines').delete().eq('id',id);if(error)setError(error.message);else await refresh()}
 const year=month.getFullYear(),m=month.getMonth(),count=new Date(year,m+1,0).getDate(),offset=(new Date(year,m,1).getDay()+6)%7;
 const monthName=new Intl.DateTimeFormat(lang==='pt'?'pt-BR':'en-US',{month:'long',year:'numeric'}).format(month);
 const visible=deadlines.filter(d=>d.due_date.startsWith(`${year}-${String(m+1).padStart(2,'0')}`));
 return <AuthGate><div className="row between"><div><p>{lang==='pt'?'Seu espaço de trabalho':'Your workspace'}</p><h1>{t('dashboard')}</h1></div><Link className="button secondary" href="/clients">{t('manage')}</Link></div>
 {error&&<p className="error">{error}</p>}
 <div className="dashboard-summary"><span>{lang==='pt'?'Clientes ativos':'Active clients'}</span><strong>{clients.length}</strong></div>
 <div className="dashboard-layout"><section className="panel calendar-panel">
 <div className="row between"><div><h2>{lang==='pt'?'Calendário de prazos':'Deadline calendar'}</h2><p className="muted">{monthName}</p></div><div className="row"><button className="button secondary" onClick={()=>setMonth(new Date(year,m-1,1))} aria-label="Previous month">‹</button><button className="button secondary" onClick={()=>setMonth(new Date(today.getFullYear(),today.getMonth(),1))}>{lang==='pt'?'Hoje':'Today'}</button><button className="button secondary" onClick={()=>setMonth(new Date(year,m+1,1))} aria-label="Next month">›</button></div></div>
 <div className="calendar-grid">{(lang==='pt'?['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).map(w=><div className="calendar-weekday" key={w}>{w}</div>)}
 {Array.from({length:offset},(_,i)=><div className="calendar-day empty" key={`empty-${i}`}/>)}
 {Array.from({length:count},(_,i)=>{const key=dateKey(year,m,i+1);const events=visible.filter(d=>d.due_date===key);return <div className={`calendar-day ${key===dateKey(today.getFullYear(),today.getMonth(),today.getDate())?'today':''}`} key={key}><span className="calendar-date">{i+1}</span>{events.map(d=><button title={d.title} onClick={()=>toggle(d)} className={`calendar-event ${d.completed?'done':''}`} key={d.id}>{d.completed?'✓ ':''}{d.title}</button>)}</div>})}</div>
 </section><aside className="stack"><form className="panel" onSubmit={add}><h2>{lang==='pt'?'Adicionar prazo':'Add deadline'}</h2><div className="field"><label>{lang==='pt'?'Entrega / tarefa':'Task'}</label><input required value={title} onChange={e=>setTitle(e.target.value)} placeholder={lang==='pt'?'Ex.: Aprovar planejamento':'e.g. Approve plan'}/></div><div className="field"><label>{lang==='pt'?'Data':'Date'}</label><input required type="date" value={day} onChange={e=>setDay(e.target.value)}/></div><div className="field"><label>{lang==='pt'?'Cliente (opcional)':'Client (optional)'}</label><select value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">{lang==='pt'?'Interno / geral':'Internal / general'}</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div><button className="button" disabled={busy}>{lang==='pt'?'Adicionar ao calendário':'Add to calendar'}</button></form>
 <div className="panel"><h2>{lang==='pt'?'Prazos do mês':'This month'}</h2>{visible.length===0?<p>{lang==='pt'?'Nenhum prazo cadastrado.':'No deadlines yet.'}</p>:visible.map(d=><div className="deadline-line" key={d.id}><input type="checkbox" checked={d.completed} onChange={()=>toggle(d)}/><div><strong className={d.completed?'done':''}>{d.title}</strong><small>{d.due_date.slice(8,10)}/{d.due_date.slice(5,7)} {clients.find(c=>c.id===d.client_id)?.name||''}</small></div><button className="text-button danger" onClick={()=>remove(d.id)} aria-label="Delete">×</button></div>)}</div></aside></div>
 <h2>{lang==='pt'?'Clientes ativos':'Active clients'}</h2><div className="grid">{clients.map(c=><Link className="panel card-link" href={`/clients/${c.id}`} key={c.id}><h3>{c.name}</h3><p>{c.industry||t('overview')}</p></Link>)}</div>
 </AuthGate>
}