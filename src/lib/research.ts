export type Source={title:string;url:string;content:string;published_date:string;category:string;market:string};
type TavilyResult={title?:string;url?:string;content?:string;published_date?:string;score?:number};
const endpoint='https://api.tavily.com/search';
function topic(name:string,industry:string,description:string){const context=[industry,description].filter(Boolean).join(' ').slice(0,210);return context||name}
export async function collectResearch(name:string,industry:string,description:string,competitors:string){
 const key=process.env.TAVILY_API_KEY;if(!key)throw new Error('Tavily API not configured');
 const subject=topic(name,industry,description);
 const rival=competitors.trim().slice(0,150);
 const jobs=[
  {market:'Brasil',category:'Notícias do setor',query:`${subject} Brasil notícias novidades mercado últimas semanas`,topic:'news',time_range:'month'},
  {market:'Internacional',category:'Notícias do setor',query:`${subject} industry news latest developments global`,topic:'news',time_range:'month'},
  {market:'Brasil',category:'Tendências e comportamento',query:`${subject} tendências comportamento consumidor inovação Brasil 2026`,topic:'general',time_range:'month',country:'brazil'},
  {market:'Internacional',category:'Tendências e comportamento',query:`${subject} emerging trends consumer behavior cultural shifts 2026`,topic:'general',time_range:'month'},
  {market:'Brasil e internacional',category:'Concorrentes e oportunidades',query:rival?`${rival} ${industry} lançamentos campanhas novidades 2026`:`${subject} marcas campanhas projetos cases inovação 2026`,topic:'general',time_range:'month'}
 ];
 const responses=await Promise.allSettled(jobs.map(async job=>{
  const {market,category,...args}=job;
  const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:key,search_depth:'basic',max_results:6,...args}),cache:'no-store'});
  if(!res.ok)throw new Error('Search '+res.status);
  const data=await res.json();
  return {market,category,items:(Array.isArray(data.results)?data.results:[]) as TavilyResult[]};
 }));
 const found=new Map<string,Source>();let failures=0;
 for(const r of responses){if(r.status==='rejected'){failures++;continue}
  for(const x of r.value.items){if(!x.url||!/^https?:\/\//.test(x.url)||!x.title)continue;
   const url=x.url.split('#')[0].replace(/\/$/,'');const canonical=url.replace(/([?&])(utm_[^=&]+|fbclid|gclid)=[^&]*/g,'').replace(/[?&]$/,'');
   if(found.has(canonical))continue;
   found.set(canonical,{title:x.title,url:x.url,content:(x.content||'').slice(0,1100),published_date:x.published_date||'',category:r.value.category,market:r.value.market});
  }
 }
 const sources=[...found.values()].slice(0,24);
 const groups=[...new Set(sources.map(s=>s.category+'|'+s.market))];
 const content=(groups.map(group=>{const [category,market]=group.split('|');return `## ${category} · ${market}\n\n`+sources.filter(s=>s.category===category&&s.market===market).map(s=>`• ${s.title}${s.published_date?' ('+s.published_date+')':''}\n${s.content}\nFonte: ${s.url}`).join('\n\n')}).join('\n\n')||'Nenhuma fonte relevante encontrada nesta rodada.')+(failures?'\n\nNota: '+failures+' buscas não foram concluídas.':'');
 return {sources,content,failures,searches:jobs.length};
}
