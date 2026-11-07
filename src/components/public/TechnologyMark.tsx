import { technologyOption } from '@/lib/tech-stack';

export function TechnologyMark({ id, label }: { id?: string; label: string }) {
  const technology = id ? technologyOption(id) : undefined;
  return technology ? (
    // The visible name adjacent to this mark supplies its accessible label.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" aria-hidden="true" className="technology-mark" height={20} src={technology.iconPath} width={20} />
  ) : (
    <span aria-hidden="true" className="technology-mark technology-mark--legacy">{label.slice(0, 1).toUpperCase()}</span>
  );
}
