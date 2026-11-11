import {createClient} from '@supabase/supabase-js';
import {randomBytes,timingSafeEqual} from 'node:crypto';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const EMAIL='maria@mella.agency';
const USER_ID='777bf022-0ca9-43f9-8cf6-8703c3bf7f63';
export async function POST(req:Request){
 const fail=()=>Response.json({error:'Invalid temporary access code.'},{status:401,headers:{'Cache-Control':'no-store'}});
 const configured=process.env.MELLA_TEMP_ACCESS_CODE;
 if(!configured||configured.length<12)return Response.json({error:'Temporary access is not configured. Use a code of at least 12 characters.'},{status:503});
 let body:{email?:string;code?:string};
 try{body=await req.json()}catch{return fail()}
 if(typeof body.email!=='string'||body.email.trim().toLowerCase()!==EMAIL||typeof body.code!=='string')return fail();
 const a=Buffer.from(body.code),b=Buffer.from(configured);
 if(a.length!==b.length||!timingSafeEqual(a,b))return fail();
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key||!anon)return Response.json({error:'Server authentication is not configured.'},{status:503});
 const admin=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const password=randomBytes(36).toString('base64url');
 const updated=await admin.auth.admin.updateUserById(USER_ID,{password,email_confirm:true});
 if(updated.error)return Response.json({error:'Unable to enable temporary access.'},{status:500});
 const client=createClient(url,anon,{auth:{autoRefreshToken:false,persistSession:false}});
 const signed=await client.auth.signInWithPassword({email:EMAIL,password});
 if(signed.error||!signed.data.session)return Response.json({error:'Unable to start temporary session.'},{status:500});
 return Response.json({access_token:signed.data.session.access_token,refresh_token:signed.data.session.refresh_token},{headers:{'Cache-Control':'no-store'}});
}
