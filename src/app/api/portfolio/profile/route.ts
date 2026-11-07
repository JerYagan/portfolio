import { getPublicProfile } from '@/lib/data/portfolio';
import { apiFailure, mediaExpirationMeta, publicCacheHeaders } from '@/lib/http/public-response';
import { technologyOption } from '@/lib/tech-stack';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profile = await getPublicProfile();
    return Response.json({
      data: {
        display_name: profile.displayName,
        headline: profile.headline,
        bio: profile.bio,
        location: profile.location,
        contact_url: profile.contactUrl,
        avatar: profile.avatar,
        skills: profile.skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          ...(skill.group ? { group: skill.group } : {}),
          status: skill.status,
          icon_path: skill.catalogId ? technologyOption(skill.catalogId)?.iconPath ?? null : null,
        })),
        social_links: profile.socialLinks,
      },
      ...(profile.avatar ? { meta: mediaExpirationMeta(true) } : {}),
    }, { headers: publicCacheHeaders });
  } catch {
    return apiFailure();
  }
}
