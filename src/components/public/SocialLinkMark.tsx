import Image from 'next/image';
import { useId } from 'react';

const localMarks: Array<{ match: RegExp; path: string }> = [
  { match: /linkedin/i, path: '/technologies/linkedin.svg' },
  { match: /behance/i, path: '/technologies/behance.svg' },
  { match: /github/i, path: '/technologies/github.svg' },
  { match: /dribbble/i, path: '/technologies/dribbble.svg' },
  { match: /youtube/i, path: '/technologies/youtube.svg' },
];

export function SocialLinkMark({ label, url }: { label: string; url: string }) {
  const instagramGradientId = useId().replace(/:/g, '');
  const mark = localMarks.find((item) => item.match.test(label) || item.match.test(url));
  if (mark) return <Image alt="" aria-hidden="true" className="social-link-mark" height={24} src={mark.path} width={24} />;

  if (/email|gmail/i.test(label) || url.startsWith('mailto:')) {
    return <svg aria-hidden="true" className="social-link-mark social-link-mark--line" fill="none" viewBox="0 0 24 24"><rect height="15" rx="2" width="19" x="2.5" y="4.5" /><path d="m3 6 9 7 9-7" /></svg>;
  }

  if (/instagram/i.test(label) || /instagram\.com/i.test(url)) {
    return <svg aria-hidden="true" className="social-link-mark" viewBox="0 0 24 24"><defs><linearGradient id={instagramGradientId} x1="2" x2="22" y1="22" y2="2" gradientUnits="userSpaceOnUse"><stop stopColor="#FEDA75" /><stop offset=".45" stopColor="#D62976" /><stop offset="1" stopColor="#4F5BD5" /></linearGradient></defs><rect fill="none" height="18" rx="5" stroke={`url(#${instagramGradientId})`} strokeWidth="2" width="18" x="3" y="3" /><circle cx="12" cy="12" r="4" fill="none" stroke={`url(#${instagramGradientId})`} strokeWidth="2" /><circle cx="17.5" cy="6.8" r="1.2" fill="#D62976" /></svg>;
  }

  return <svg aria-hidden="true" className="social-link-mark social-link-mark--line" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9s-1.1 6.6-3.3 9c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" /></svg>;
}
