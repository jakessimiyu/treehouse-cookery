import './globals.css';
import {Young_Serif,Plus_Jakarta_Sans,Barlow_Condensed,Caveat} from 'next/font/google';
import {CartProvider} from '@/lib/Cart';import CartDrawer from '@/components/CartDrawer';
import Nav from '@/components/Nav';import Motion from '@/components/Motion';import BottomNav from '@/components/BottomNav';
import Footer from '@/components/Footer';
import {s} from '@/lib/store';
export const dynamic='force-dynamic';
const d=Young_Serif({subsets:['latin'],weight:'400',variable:'--display',display:'swap'});
const b=Plus_Jakarta_Sans({subsets:['latin'],variable:'--body',display:'swap'});
const lb=Barlow_Condensed({subsets:['latin'],weight:['500','600','700'],variable:'--label',display:'swap'});
const sc=Caveat({subsets:['latin'],variable:'--script',display:'swap'});
export const metadata={title:'Treehouse: order ahead, skip the queue',description:'Fast food, ready when you arrive.'};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover' as const};
const NAV:[string,string][]=[['Home','/'],['Menu','/menu'],['Order','/order'],['Reserve','/reserve'],['Catering','/catering'],['Our Story','/story'],['Visit','/visit']];
export default function L({children}:{children:React.ReactNode}){
 return <html lang="en" className={`${d.variable} ${b.variable} ${lb.variable} ${sc.variable}`}><body><CartProvider initialMenu={s.menu}>
 <noscript><style>{'.tx-rv,.tx-stg>*{opacity:1!important;transform:none!important}.tx-mask .tx-sigimg{clip-path:none!important}'}</style></noscript>
 <a className="tx-skip" href="#main">Skip to content</a><Motion/>
 <Nav links={NAV}/>
 <main id="main">{children}</main><Footer/><CartDrawer/><BottomNav/></CartProvider></body></html>;}