'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export function ExpandableProjectDetails({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const [hasMore, setHasMore] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) return;
    const content = contentRef.current;
    if (!content) return;
    const measure = () => setHasMore(content.scrollHeight > content.clientHeight + 2);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => observer.disconnect();
  }, [children, expanded]);

  return <div className={`project-details-expander${expanded ? ' is-expanded' : ''}${hasMore ? ' has-more' : ''}`}>
    <div className="project-details-expander__content" id={contentId} ref={contentRef}>{children}</div>
    {hasMore ? <button aria-controls={contentId} aria-expanded={expanded} className="project-details-expander__toggle" onClick={() => setExpanded((current) => !current)} type="button">{expanded ? 'Show less ↑' : 'See more ↓'}</button> : null}
  </div>;
}
