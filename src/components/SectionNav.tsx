'use client';

import { useEffect, useState } from 'react';

interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: 'today', label: 'Today' },
  { id: 'trends', label: 'Trends' },
  { id: 'activity', label: 'Activity' },
  { id: 'entries', label: 'Entries' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'review', label: 'Review' },
];

export function SectionNav() {
  const [active, setActive] = useState<string>('today');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(e.target.id);
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );

    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80; // offset for sticky nav
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-background/80 backdrop-blur-md border-b border-border/60"
      aria-label="Dashboard sections"
    >
      <ul className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={handleClick(s.id)}
                className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
