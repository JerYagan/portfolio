import type { ReactNode } from 'react';

function safeHttpsUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function inlineContent(value: string): ReactNode[] {
  const tokenPattern = /\*\*(.+?)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/gu;
  const result: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = tokenPattern.exec(value)) !== null) {
    if (match.index > cursor) result.push(value.slice(cursor, match.index));
    const tokenKey = `inline-${key++}`;
    if (match[1]) result.push(<strong key={tokenKey}>{match[1]}</strong>);
    else if (match[2]) result.push(<em key={tokenKey}>{match[2]}</em>);
    else if (match[3]) result.push(<code key={tokenKey}>{match[3]}</code>);
    else if (match[4] && match[5]) {
      const href = safeHttpsUrl(match[5]);
      result.push(href
        ? <a href={href} key={tokenKey} rel="noreferrer noopener" target="_blank">{match[4]}</a>
        : match[4]);
    }
    cursor = tokenPattern.lastIndex;
  }

  if (cursor < value.length) result.push(value.slice(cursor));
  return result;
}

export function SafeMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```(?:[a-zA-Z0-9_-]+)?\s*$/);
    if (fence) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push(<pre key={`block-${blocks.length}`}><code>{codeLines.join('\n')}</code></pre>);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const content = inlineContent(heading[2]);
      const key = `block-${blocks.length}`;
      if (heading[1].length === 1) blocks.push(<h2 key={key}>{content}</h2>);
      else if (heading[1].length === 2) blocks.push(<h3 key={key}>{content}</h3>);
      else blocks.push(<h4 key={key}>{content}</h4>);
      index += 1;
      continue;
    }

    const listMarker = line.match(/^\s*([-*]|\d+\.)\s+(.+)$/);
    if (listMarker) {
      const isOrdered = /^\d+\.$/.test(listMarker[1]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*([-*]|\d+\.)\s+(.+)$/);
        if (!item || /^\d+\.$/.test(item[1]) !== isOrdered) break;
        items.push(item[2]);
        index += 1;
      }
      const listItems = items.map((item, itemIndex) => <li key={`item-${itemIndex}`}>{inlineContent(item)}</li>);
      blocks.push(isOrdered
        ? <ol key={`block-${blocks.length}`}>{listItems}</ol>
        : <ul key={`block-${blocks.length}`}>{listItems}</ul>);
      continue;
    }

    if (line.startsWith('> ')) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith('> ')) quote.push(lines[index++].slice(2));
      blocks.push(<blockquote key={`block-${blocks.length}`}>{inlineContent(quote.join(' '))}</blockquote>);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+/.test(lines[index]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[index]) && !lines[index].startsWith('> ') && !/^```/.test(lines[index])) {
      paragraph.push(lines[index++]);
    }
    blocks.push(<p key={`block-${blocks.length}`}>{inlineContent(paragraph.join(' '))}</p>);
  }

  return <div className="markdown-content">{blocks}</div>;
}
