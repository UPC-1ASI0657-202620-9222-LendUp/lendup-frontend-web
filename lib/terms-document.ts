export interface TermsSection {
  title: string;
  blocks: { list: boolean; lines: string[] }[];
}
export function parseTermsDocument(content: string): TermsSection[] {
  const sections: TermsSection[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^\d+\. /.test(line)) {
      sections.push({ title: line, blocks: [] });
      continue;
    }
    const section = sections.at(-1);
    if (!section) continue;
    const list = line.startsWith('• ');
    const text = list ? line.slice(2) : line;
    const previous = section.blocks.at(-1);
    if (list && previous?.list) previous.lines.push(text);
    else section.blocks.push({ list, lines: [text] });
  }
  return sections;
}
