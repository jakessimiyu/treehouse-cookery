import {s} from '@/lib/store';
export const dynamic='force-dynamic';
export const GET=()=>Response.json(s.menu);