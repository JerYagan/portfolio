import type { ProfileSkill } from '@/lib/data/portfolio';
import { TechnologyMark } from '@/components/public/TechnologyMark';

export function TechnologyList({ skills }: { skills: ProfileSkill[] }) {
  if (skills.length === 0) return <p className="muted-note">Tools and technologies will appear here as they are added.</p>;

  const known = skills.filter((skill) => skill.status === 'known');
  const learning = skills.filter((skill) => skill.status === 'learning');
  return (
    <div className="technology-groups">
      {known.length > 0 ? <section aria-label="Technologies I use">
        <h3 className="technology-groups__label">In my toolkit</h3>
        <ul className="technology-list">{known.map((skill) => <li className="technology-chip" key={skill.id}><TechnologyMark id={skill.catalogId} label={skill.name} /><span>{skill.name}</span></li>)}</ul>
      </section> : null}
      {learning.length > 0 ? <section aria-label="Technologies I am learning">
        <h3 className="technology-groups__label">On my learning list</h3>
        <ul className="technology-list">{learning.map((skill) => <li className="technology-chip technology-chip--learning" key={skill.id}><TechnologyMark id={skill.catalogId} label={skill.name} /><span>{skill.name}</span><span className="technology-chip__status">Learning</span></li>)}</ul>
      </section> : null}
    </div>
  );
}
