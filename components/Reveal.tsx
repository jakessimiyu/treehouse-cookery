'use client';
import {useEffect} from 'react';
// Fades in any element with class "tx-rv" as it scrolls into view.
export default function Reveal(){
 useEffect(()=>{const els=document.querySelectorAll('.tx-rv:not(.in)');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){els.forEach(e=>e.classList.add('in'));return}
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
  els.forEach(e=>io.observe(e));return()=>io.disconnect()},[]);
 return null;}