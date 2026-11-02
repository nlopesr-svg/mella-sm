import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';export const maxDuration=60;
export async function GET(request:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||request.headers.get('authorization')!==`Bearer ${secret}`)return NextResponse.json({error:'Unauthorized'},{status:401});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,tavily=process.env.TAVILY_API_KEY;
 if(!url||!key||!tavily)return NextResponse.json({error:'Missing server configuration'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:clients,error}=await db.from('clients').select('id,user_id,name,industry').eq('archived',false).is('deleted_at',null);
 if(error)return NextResponse.json({error:'Database query failed'},{status:500});
 let saved=0,failed=0;const week=new Date().toISOString().slice(0,10);
 for(const c of clients||[]){
  const {data:existing}=await db.from('research_reports').select('id').eq('client_id',c.id).eq('report_type','weekly').gte('created_at',week+'T00:00:00Z').limit(1);
  if(existing?.length)continue;
  try{
   const res=await fetch('https://api.tavily.com/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({api_key:tavily,query:`${c.name} ${c.industry||''} news trends competitors latest`,topic:'news',time_range:'week',search_depth:'basic',max_results:5}),cache:'no-store'});
   if(!res.ok)throw new Error('Search failed');
   const data=await res.json();const sources=(data.results||[]).map((x:{title?:string;url?:string;content?:string})=>({title:x.title||'Fonte',url:x.url||'',content:(x.content||'').slice(0,1000)})).filter((x:{url:string})=>x.url.startsWith('https://'));
   const content=sources.map((x:{title:string;url:string;content:string},i:number)=>`${i+1}. ${x.title}\n${x.content}\n${x.url}`).join('\n\n')||'Nenhuma fonte recente encontrada.';
   const {error:insertError}=await db.from('research_reports').insert({client_id:c.id,user_id:c.user_id,report_type:'weekly',title:'Radar semanal · '+week,content,sources});if(insertError)throw insertError;saved++;
  }catch{failed++}
 }
 return NextResponse.json({saved,failed,checked:clients?.length||0},{status:failed?207:200});
}
