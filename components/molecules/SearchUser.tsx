import { motion } from 'framer-motion';
import { Search, SquarePen, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../atoms/button';

const items = [
  'Open Finder',
  'Open Safari',
  'Open Terminal',
  'Open VS Code',
  'Open Notes',
  'Open System Preferences',
];

export default function SearchUser() {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setFilteredItems(
      items.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    );
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="absolute bottom-5 right-5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        <SquarePen size={18} className="inline-block" />
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex justify-center items-start pt-20"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-neutral-800 text-white rounded-md shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-neutral-600 pb-2">
              <Search className="text-neutral-400" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-lg outline-none"
              />
              <button onClick={() => setIsOpen(false)}>
                <X
                  size={18}
                  className="text-neutral-400 hover:text-white transition"
                />
              </button>
            </div>

            <ul className="mt-2">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <li
                    key={item}
                    className={`px-3 py-2 rounded-lg cursor-pointer ${
                      index === selectedIndex
                        ? 'bg-blue-600'
                        : 'hover:bg-neutral-700'
                    } transition`}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => alert(`Opening: ${item}`)}
                  >
                    {item}
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-neutral-400">No results found</li>
              )}
            </ul>
          </motion.div>
        </div>
      )}
    </>
  );
}
