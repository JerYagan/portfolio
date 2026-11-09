'use client';

import { useState } from 'react';
import type { ProfileSkill } from '@/lib/data/portfolio';
import { TechnologyMark } from '@/components/public/TechnologyMark';

export function TechnologyList({ skills }: { skills: ProfileSkill[] }) {
  const [expanded, setExpanded] = useState<Record<'known' | 'learning', boolean>>({ known: false, learning: false });
  if (skills.length === 0) return <p className="muted-note">Tools and technologies will appear here as they are added.</p>;

  const known = skills.filter((skill) => skill.status === 'known');
  const learning = skills.filter((skill) => skill.status === 'learning');
  const limit = 8;

  function renderSkills(group: ProfileSkill[], status: 'known' | 'learning') {
    const visible = expanded[status] ? group : group.slice(0, limit);
    return <>
      <ul className="technology-list">{visible.map((skill) => <li className={`technology-chip${status === 'learning' ? ' technology-chip--learning' : ''}`} key={skill.id}><TechnologyMark id={skill.catalogId} label={skill.name} /><span>{skill.name}</span>{status === 'learning' ? <span className="technology-chip__status">Learning</span> : null}</li>)}</ul>
      {group.length > limit ? <button aria-expanded={expanded[status]} className="technology-list__toggle" onClick={() => setExpanded((current) => ({ ...current, [status]: !current[status] }))} type="button">{expanded[status] ? 'Show less' : `See all ${group.length}`}</button> : null}
    </>;
  }

  return (
    <div className="technology-groups">
      {known.length > 0 ? <section aria-label="Technologies I use">
        <h3 className="technology-groups__label">In my toolkit</h3>
        {renderSkills(known, 'known')}
      </section> : null}
      {learning.length > 0 ? <section aria-label="Technologies I am learning">
        <h3 className="technology-groups__label">On my learning list</h3>
        {renderSkills(learning, 'learning')}
      </section> : null}
    </div>
  );
}
