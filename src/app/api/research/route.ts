import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
export const runtime='nodejs';
export const maxDuration=60;
import {collectResearch} from '@/lib/research';
function client(token:string){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}})}
export async function POST(request:NextRequest){
 try{const auth=request.headers.get('authorization')||'';if(!auth.startsWith('Bearer '))return NextResponse.json({error:'Unauthorized'},{status:401});
 const sup=client(auth.slice(7));const {data:{user},error:userError}=await sup.auth.getUser(auth.slice(7));if(userError||!user)return NextResponse.json({error:'Unauthorized'},{status:401});
 const {clientId}=await request.json();if(typeof clientId!=='string')return NextResponse.json({error:'Invalid client'},{status:400});
 const {data:c,error:e}=await sup.from('clients').select('id,name,industry,description').eq('id',clientId).eq('archived',false).is('deleted_at',null).single();
 if(e||!c)return NextResponse.json({error:'Client not found'},{status:404});
 const {data:strategies}=await sup.from('platform_strategies').select('competitors').eq('client_id',clientId);
 const competitors=(strategies||[]).map((s:{competitors:string|null})=>s.competitors||'').filter(Boolean).join(' ');
 const result=await collectResearch(c.name,c.industry||'',c.description||'',competitors);
 const title='Radar de pesquisa · '+new Date().toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'});
 const {data:report,error:saveError}=await sup.from('research_reports').insert({client_id:c.id,user_id:user.id,report_type:'manual',title,content:result.content,sources:result.sources}).select('id').single();
 if(saveError)throw new Error('Could not save research: '+saveError.message);
 return NextResponse.json({id:report.id});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Search failed'},{status:500})}
}
