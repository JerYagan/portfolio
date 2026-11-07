import type { Metadata } from 'next';
import { ProfileEditor } from '@/components/admin/ProfileEditor';
import { signAdminPath } from '@/lib/data/admin-media';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeStoredTechnologies } from '@/lib/tech-stack';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Profile' };

export default async function AdminProfilePage() {
  const client = await createSupabaseServerClient();
  const { data, error } = await client.from('profile').select('display_name,headline,bio,location,contact_url,avatar_path,avatar_alt,skills,social_links').eq('id', 1).maybeSingle();
  if (error || !data) return <main className="admin-page" id="main-content"><h1>Profile</h1><p className="admin-alert" role="alert">Profile information could not be loaded.</p></main>;
  const initialProfile = { ...data, skills: normalizeStoredTechnologies(data.skills), avatar_preview_url: await signAdminPath(client, data.avatar_path) };
  return <main className="admin-page" id="main-content"><header className="admin-page-heading"><div><p className="admin-eyebrow">Public information</p><h1>Profile</h1><p className="admin-page-intro">These details appear on the public portfolio. Use placeholders until you are ready to publish them.</p></div></header><ProfileEditor initialProfile={initialProfile} /></main>;
}
