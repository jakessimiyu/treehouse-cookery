import ReserveWizard from '@/components/ReserveWizard';
export const metadata={title:'Reserve a table | Treehouse'};
export default function ReservePage(){
 return <>
  <header className="tx-mhead"><h1>Reserve a <em>table</em></h1><p>Pick a day and time, tell us how many, and we&apos;ll have your table ready.</p></header>
  <ReserveWizard/>
 </>;}