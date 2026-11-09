import type { PublicCaseStudySection } from '@/lib/data/portfolio';
import { SafeMarkdown } from '@/components/public/SafeMarkdown';

export function CaseStudySections({ sections }: { sections: PublicCaseStudySection[] }) {
  const completeSections = sections.filter((section) => section.heading.trim() && section.bodyMarkdown.trim());
  if (completeSections.length === 0) return null;

  return (
    <div className="case-study-sections">
      {completeSections.map((section, index) => <section aria-labelledby={`case-study-section-${index}`} className="case-study-section" key={`${index}-${section.heading}`}>
        <p className="eyebrow">{String(index + 1).padStart(2, '0')}</p>
        <h2 id={`case-study-section-${index}`}>{section.heading}</h2>
        <SafeMarkdown source={section.bodyMarkdown} />
      </section>)}
    </div>
  );
}
