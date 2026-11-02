/** In-page tabs for long edit screens: jump links to each section card. */
export function SectionNav({ sections }: { sections: Array<{ id: string; label: string }> }) {
  return (
    <nav aria-label="Sections" className="sticky top-16 z-20 -mx-4 mb-6 overflow-x-auto bg-plum-50/90 px-4 py-2 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:top-0">
      <ul className="flex gap-2">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-plum-800 ring-1 ring-plum-950/10 hover:bg-plum-100"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
