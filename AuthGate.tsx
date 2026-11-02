'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {db} from '@/lib/supabase';
export default function AuthGate({children}:{children:React.ReactNode}){
 const router=useRouter();const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 useEffect(()=>{let alive=true;try{db().auth.getSession().then(({data})=>{if(!alive)return;if(!data.session)router.replace('/login');else setStatus('ready')});const {data:{subscription}}=db().auth.onAuthStateChange((_event,session)=>{if(!session)router.replace('/login')});return()=>{alive=false;subscription.unsubscribe()}}catch{setStatus('error')}},[router]);
 if(status==='error')return <div className="panel">Supabase is not configured. See README.md.</div>;
 if(status!=='ready')return <p>Checking your session…</p>;
 return <div className="shell"><aside className="side"><div className="brand"><i/>Social Media OS</div><nav className="nav"><Link href="/dashboard">Dashboard</Link><Link href="/clients">Clients</Link><Link href="/settings">Settings</Link></nav><div className="divider"/><button className="button secondary" onClick={async()=>{await db().auth.signOut();router.replace('/login')}}>Sign out</button></aside><main>{children}</main></div>
}
