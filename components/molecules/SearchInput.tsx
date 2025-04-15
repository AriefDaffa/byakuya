'use client';

import { Input } from '@/components/atoms/input';
import { ChangeEvent, ReactNode } from 'react';

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: ChangeEvent<HTMLInputElement>) => void;
  children?: ReactNode;
  showDropdown?: boolean;
}

const SearchInput = ({
  placeholder = 'Search message or user...',
  value = '',
  onChange,
  children,
  showDropdown = false,
}: SearchInputProps) => {
  // const { setTheme, theme } = useTheme();

  return (
    <div className="w-full flex justify-center items-center gap-2">
      <div className="relative w-full max-w-[500px]">
        {/* <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" /> */}
        <Input
          value={value}
          placeholder={placeholder}
          className="pl-10 bg-gray-100 border-0"
          onChange={(e) => onChange?.(e)}
        />
        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 w-full e border rounded-md shadow-lg z-10">
            {children}
          </div>
        )}
      </div>
      {/* <div className="flex">
        <Button
          variant={'secondary'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="cursor-pointer bg-input/50"
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div> */}
    </div>
  );
};

export default SearchInput;
