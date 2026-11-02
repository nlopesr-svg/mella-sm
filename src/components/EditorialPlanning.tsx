'use client';
import {useEffect,useState} from 'react';
import {db} from '@/lib/supabase';
import {useLanguage} from '@/components/LanguageProvider';

type LinkRow={id:string;year:number;month:number;chat_url:string};
type GenericRow=Record<string,unknown>;
const pt=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const en=['January','February','March','April','May','June','July','August','September','October','November','December'];
const fields=(record:GenericRow|null,omit:string[]=[])=>(record?Object.entries(record).filter(([k,v])=>!omit.includes(k)&&v!==null&&v!==undefined&&String(v).trim()!=='').map(([k,v])=>k.replaceAll('_',' ')+': '+String(v)).join('\n'):'');
const hidden=['id','client_id','user_id','created_at','updated_at','deleted_at','archived','platform_id'];
export default function EditorialPlanning({clientId,clientName}:{clientId:string;clientName:string}){
 const {lang}=useLanguage();const months=lang==='pt'?pt:en;
 const now=new Date();const[month,setMonth]=useState(now.getMonth()+1);const[year,setYear]=useState(now.getFullYear());
 const[links,setLinks]=useState<LinkRow[]>([]);const[guidelines,setGuidelines]=useState<string|null>(null);const[url,setUrl]=useState('');const[busy,setBusy]=useState(false);const[message,setMessage]=useState('');
 const active=links.find(x=>x.year===year&&x.month===month);
 useEffect(()=>{let mounted=true;Promise.all([db().from('editorial_global_settings').select('guidelines').eq('id',1).maybeSingle(),db().from('editorial_planning_links').select('id,year,month,chat_url').eq('client_id',clientId).order('year',{ascending:false}).order('month',{ascending:false})]).then(([g,l])=>{if(!mounted)return;if(g.error||l.error)setMessage(g.error?.message||l.error?.message||'');setGuidelines(g.data?.guidelines??'');setLinks((l.data||[]) as LinkRow[])});return()=>{mounted=false}},[clientId]);
 useEffect(()=>{setUrl(active?.chat_url||'')},[active?.id,active?.chat_url,month,year]);
 async function buildBriefing(){
  if(!guidelines?.trim())throw new Error(lang==='pt'?'Configure as diretrizes editoriais globais em Settings antes de copiar.':'Set the global editorial guidelines in Settings first.');
  const q=await Promise.all([
   db().from('clients').select('*').eq('id',clientId).single(),
   db().from('brand_guidelines').select('*').eq('client_id',clientId).maybeSingle(),
   db().from('platform_strategies').select('*').eq('client_id',clientId),
   db().from('client_platforms').select('platform_id').eq('client_id',clientId),
   db().from('platforms').select('id,name'),
   db().from('client_competitors').select('title,link,notes').eq('client_id',clientId),
   db().from('client_resource_links').select('*').eq('client_id',clientId),
   db().from('knowledge_items').select('title,category,content,kind').eq('client_id',clientId).eq('kind','text'),
   db().from('feedback_entries').select('entry_type,content,entry_date').eq('client_id',clientId).order('entry_date',{ascending:false}).limit(10)
  ]);
  for(const x of q){if(x.error)throw new Error(x.error.message)}
  if(!q[0].data)throw new Error('Client not found');
  const platformNames=new Map((q[4].data||[]).map((p:GenericRow)=>[p.id,p.name]));
  const assigned=(q[3].data||[]).map((p:GenericRow)=>String(platformNames.get(p.platform_id)||p.platform_id)).join(', ');
  const strategies=(q[2].data||[]).map((p:GenericRow)=>'### '+String(platformNames.get(p.platform_id)||'Platform')+'\n'+fields(p,hidden)).join('\n\n');
  const competitors=(q[5].data||[]).map((p:GenericRow)=>fields(p,hidden)).join('\n\n');
  const references=(q[6].data||[]).map((p:GenericRow)=>fields(p,hidden)).join('\n\n');
  const notes=(q[7].data||[]).map((p:GenericRow)=>fields(p,hidden)).join('\n\n');
  const feedback=(q[8].data||[]).map((p:GenericRow)=>fields(p,hidden)).join('\n\n');
  return ['# MELLA | EDITORIAL PLANNING','## LAYER 1 | GLOBAL EDITORIAL GUIDELINES',guidelines,
   '## LAYER 2 | CLIENT CONTEXT','### Client',fields(q[0].data,hidden),
   '### Brand Guidelines',fields(q[1].data,hidden)||'Não cadastradas.',
   '### Platforms',assigned||'Não cadastradas.',
   '### Platform Strategies',strategies||'Não cadastradas.',
   '### Competitors',competitors||'Não cadastrados.',
   '### Reference links',references||'Não cadastrados.',
   '### Knowledge notes',notes||'Não cadastradas.',
   '### Recent feedback and meeting notes (reference only)',feedback||'Não cadastrados.',
   '## LAYER 3 | PLANNING CONTEXT','Client: '+clientName,'Period: '+months[month-1]+' '+year,
   'Use the client context above as reference, respecting confirmed facts and current decisions. Treat meeting notes as strategic source material, not text to reproduce. Do not assume file contents from names or links. I will provide the monthly briefing and materials in this conversation. Confirm the client and period briefly and wait for my instructions before creating content.'
  ].join('\n\n');
 }
 async function copy(){setBusy(true);setMessage('');try{const text=await buildBriefing();await navigator.clipboard.writeText(text);setMessage(lang==='pt'?'Briefing copiado! Cole em uma nova conversa no ChatGPT.':'Briefing copied! Paste it into a new ChatGPT conversation.')}catch(e){setMessage(e instanceof Error?e.message:'Could not copy')}finally{setBusy(false)}}
 async function saveLink(e:React.FormEvent){e.preventDefault();const clean=url.trim();if(clean){try{const u=new URL(clean);if(u.protocol!=='https:'||!['chatgpt.com','www.chatgpt.com','chat.openai.com'].includes(u.hostname))throw Error();}catch{setMessage(lang==='pt'?'Use um link válido de conversa do ChatGPT.':'Use a valid ChatGPT conversation URL.');return}}
 setBusy(true);const result=clean?await db().from('editorial_planning_links').upsert({client_id:clientId,month,year,chat_url:clean},{onConflict:'client_id,year,month'}):active?await db().from('editorial_planning_links').delete().eq('id',active.id):null;
 if(result?.error)setMessage(result.error.message);else{const {data,error}=await db().from('editorial_planning_links').select('id,year,month,chat_url').eq('client_id',clientId).order('year',{ascending:false}).order('month',{ascending:false});if(error)setMessage(error.message);else{setLinks((data||[]) as LinkRow[]);setMessage(lang==='pt'?'Link salvo.':'Link saved.')}}setBusy(false)}
 return <div className="stack"><div className="row between"><div><h2>Editorial Planning</h2><p>{lang==='pt'?'Prepare o contexto da marca para trabalhar no ChatGPT.':'Prepare brand context for ChatGPT.'}</p></div></div>
 <div className="panel"><div className="row" style={{flexWrap:'wrap',gap:12}}><div className="field" style={{minWidth:170,flex:1}}><label>{lang==='pt'?'Mês':'Month'}</label><select value={month} onChange={e=>setMonth(Number(e.target.value))}>{months.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select></div><div className="field" style={{minWidth:120,flex:1}}><label>{lang==='pt'?'Ano':'Year'}</label><select value={year} onChange={e=>setYear(Number(e.target.value))}>{Array.from({length:8},(_,i)=>2025+i).map(y=><option key={y}>{y}</option>)}</select></div></div>
 <h3>{clientName} · {months[month-1]} {year}</h3><p>{lang==='pt'?'O briefing reúne as diretrizes globais e os dados atuais cadastrados para este cliente.':'The briefing combines global guidelines and current client data.'}</p>
 <div className="row" style={{flexWrap:'wrap',gap:10}}><button type="button" className="button" disabled={busy||guidelines===null} onClick={copy}>{busy?'…':lang==='pt'?'Copy Editorial Briefing':'Copy Editorial Briefing'}</button><a className="button secondary" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">{lang==='pt'?'Abrir ChatGPT':'Open ChatGPT'} ↗</a></div>
 <div className="divider"/><form onSubmit={saveLink}><div className="field"><label>{lang==='pt'?'Link da conversa (opcional)':'Conversation link (optional)'}</label><input type="url" placeholder="https://chatgpt.com/c/..." value={url} onChange={e=>setUrl(e.target.value)}/></div><div className="row" style={{flexWrap:'wrap',gap:10}}><button className="button secondary" disabled={busy} type="submit">{lang==='pt'?'Salvar link':'Save link'}</button>{active&&<a className="button secondary" href={active.chat_url} target="_blank" rel="noopener noreferrer">{lang==='pt'?'Continuar conversa':'Continue conversation'} ↗</a>}</div></form>
 {message&&<p role="status">{message}</p>}</div>
 {links.length>0&&<div className="panel"><h3>{lang==='pt'?'Conversas salvas':'Saved conversations'}</h3><div className="stack">{links.map(l=><div key={l.id} className="row between" style={{gap:12}}><button type="button" className="text-button" onClick={()=>{setMonth(l.month);setYear(l.year)}}>{months[l.month-1]} {l.year}</button><a href={l.chat_url} target="_blank" rel="noopener noreferrer">{lang==='pt'?'Abrir conversa':'Open conversation'} ↗</a></div>)}</div></div>}
 </div>;
}
