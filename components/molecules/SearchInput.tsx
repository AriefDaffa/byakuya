'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/atoms/input';

interface SearchInputProps {
  placeholder?: string;
  onChange?: (value: string) => void;
}

const SearchInput = ({
  placeholder = 'Search...',
  onChange,
}: SearchInputProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <Input
        placeholder={placeholder}
        className="pl-10 bg-gray-100 border-0 rounded-full"
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
};

export default SearchInput;
