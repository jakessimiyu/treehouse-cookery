'use client';
import {useCart} from '@/lib/Cart';
export default function NavCart(){
 const {count,setOpen}=useCart();
 return <button className="tx-navcart" onClick={()=>setOpen(true)} aria-label={`Open your order, ${count} items`}>Cart{count>0?` · ${count}`:''}</button>;}