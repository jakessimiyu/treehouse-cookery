import Image from 'next/image';
import Link from 'next/link';

type Props={
 variant?:'mark'|'full';   // mark = rooster only, full = rooster + name + tagline
 height?:number;           // rendered height in px; width follows the image shape
 href?:string|null;        // link target; pass null for no link
 priority?:boolean;        // true for the logo at the top of the page
 className?:string;
};

const SRC={
 mark:{src:'/images/treehouse-mark.png',w:640,h:640},
 full:{src:'/images/treehouse-logo.png',w:720,h:960},
};

export default function Logo({variant='mark',height=48,href='/',priority=false,className}:Props){
 const s=SRC[variant];
 const width=Math.round(height*s.w/s.h);
 const img=<Image src={s.src} alt="Tree House Cookery" width={width} height={height} priority={priority}
  style={{display:'block',width:width,height:height,objectFit:'contain'}}/>;
 if(href===null)return <span className={className} style={{display:'inline-block',lineHeight:0}}>{img}</span>;
 return <Link href={href} className={className} aria-label="Tree House Cookery, home" style={{display:'inline-block',lineHeight:0}}>{img}</Link>;
}