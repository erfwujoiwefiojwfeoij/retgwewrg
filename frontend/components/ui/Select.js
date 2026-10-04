'use client';

import { Children, useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

function textOf(node) {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'object' && node.props) return textOf(node.props.children);
  return '';
}

function readOptions(children) {
  return Children.toArray(children).flatMap((child) => {
    if (!child || typeof child !== 'object' || !child.props) return [];
    const label = textOf(child.props.children).trim();
    const hasValue = Object.prototype.hasOwnProperty.call(child.props, 'value');
    const value = hasValue ? String(child.props.value) : label;
    if (!label && !value) return [];
    return [{ value, label: label || value }];
  });
}

export default function Select({ value, onChange, children, className = '', id }) {
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  const options = readOptions(children);
  const current = options.find((option) => option.value === String(value ?? '')) || options[0];
  const auto = className.includes('w-auto');
  const plain = !className.includes('field');

  useEffect(() => {
    function onPointer(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function choose(next) {
    onChange?.({ target: { value: next } });
    setOpen(false);
  }

  function toggle(event) {
    event.preventDefault();
    event.stopPropagation();
    setOpen((next) => !next);
  }

  return (
    <div ref={root} className={`relative ${auto ? 'inline-block' : 'block w-full'}`}>
      <button
        id={id}
        type="button"
        className={`${className} ${plain ? 'h-11 rounded-full border border-lunea-line bg-white px-4' : ''} flex items-center justify-between gap-3 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
      >
        <span className="truncate">{current?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-lunea-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <ul className="absolute left-0 z-40 mt-2 min-w-full overflow-hidden rounded-[28px] border border-lunea-line bg-white p-2 shadow-lift" role="listbox">
          {options.map((option) => {
            const selected = option.value === String(value ?? '');
            return (
              <li key={`${option.value}:${option.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`w-full rounded-full px-4 py-2.5 text-left text-sm hover:bg-lunea-blush ${selected ? 'bg-lunea-blush' : ''}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    choose(option.value);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
