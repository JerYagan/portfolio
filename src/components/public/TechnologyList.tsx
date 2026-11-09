'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProfileSkill } from '@/lib/data/portfolio';
import { TechnologyMark } from '@/components/public/TechnologyMark';

export function TechnologyList({ skills }: { skills: ProfileSkill[] }) {
  const [activeGroup, setActiveGroup] = useState<'known' | 'learning' | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const known = skills.filter((skill) => skill.status === 'known');
  const learning = skills.filter((skill) => skill.status === 'learning');
  const limit = 8;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (activeGroup && dialog && !dialog.open) dialog.showModal();
  }, [activeGroup]);

  if (skills.length === 0) return <p className="muted-note">Tools and technologies will appear here as they are added.</p>;

  function renderSkills(group: ProfileSkill[], status: 'known' | 'learning') {
    const visible = group.slice(0, limit);
    return <>
      <ul className="technology-list">{visible.map((skill) => <li className={`technology-chip${status === 'learning' ? ' technology-chip--learning' : ''}`} key={skill.id}><TechnologyMark id={skill.catalogId} label={skill.name} /><span>{skill.name}</span>{status === 'learning' ? <span className="technology-chip__status">Learning</span> : null}</li>)}</ul>
      {group.length > limit ? <button aria-haspopup="dialog" className="technology-list__toggle" onClick={() => setActiveGroup(status)} type="button">See all {group.length}</button> : null}
    </>;
  }

  const activeSkills = activeGroup === 'known' ? known : activeGroup === 'learning' ? learning : [];
  const activeTitle = activeGroup === 'known' ? 'In my toolkit' : 'On my learning list';

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
      <dialog aria-labelledby="technology-dialog-title" className="technology-dialog" onClick={(event) => { if (event.target === event.currentTarget) dialogRef.current?.close(); }} onClose={() => setActiveGroup(null)} ref={dialogRef}>
        <div className="technology-dialog__header">
          <div><p className="eyebrow">Things I work with</p><h2 id="technology-dialog-title">{activeTitle}</h2></div>
          <button aria-label="Close tools list" className="technology-dialog__close" onClick={() => dialogRef.current?.close()} type="button">×</button>
        </div>
        <ul className="technology-list technology-dialog__list">{activeSkills.map((skill) => <li className={`technology-chip${activeGroup === 'learning' ? ' technology-chip--learning' : ''}`} key={skill.id}><TechnologyMark id={skill.catalogId} label={skill.name} /><span>{skill.name}</span>{activeGroup === 'learning' ? <span className="technology-chip__status">Learning</span> : null}</li>)}</ul>
      </dialog>
    </div>
  );
}
