import { createClient, type SupabaseClient } from '@supabase/supabase-js';
let instance: SupabaseClient | null = null;
export function db() {
  if (!instance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    instance = createClient(url, key);
  }
  return instance;
}
export type Client = { id:string; user_id:string; name:string; industry:string|null; description:string|null; website:string|null; contacts:string|null; links:string|null; notes:string|null; archived:boolean; updated_at:string };
export type Platform = {id:string; name:string};
export type Guideline = {id:string; client_id:string; positioning:string; value_proposition:string; audience:string; personality:string; tone:string; preferred_words:string; avoided_words:string; visual_identity:string; colors:string; fonts:string; logos:string; restrictions:string};
export type Strategy = {id:string;client_id:string;platform_id:string;objectives:string;audience:string;positioning:string;tone:string;content_pillars:string;formats:string;frequency:string;opportunities:string;competitors:string;best_practices:string;dos:string;donts:string;notes:string};
export const guidelineFields = ['positioning','audience','personality','tone','preferred_words','avoided_words','restrictions'] as const;
export const strategyFields = ['objectives','audience','positioning','tone','frequency','dos','donts','notes'] as const;
