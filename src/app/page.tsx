'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
export default function HomePage(){
 const router=useRouter();
 useEffect(()=>{
  const hash=new URLSearchParams(window.location.hash.slice(1));
  const query=new URLSearchParams(window.location.search);
  const invitation=['invite','recovery'].includes(hash.get('type')||'')||query.has('code');
  router.replace(invitation?'/auth/set-password'+window.location.search+window.location.hash:'/dashboard');
 },[router]);
 return <p>Carregando…</p>;
}
