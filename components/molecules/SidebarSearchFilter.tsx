'use client';
import { useState, type FC } from 'react';

import { Button } from '@/components/atoms/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/atoms/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/atoms/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

const frameworks = [
  {
    value: 'all',
    label: 'All Result',
  },
  {
    value: 'users',
    label: 'Users',
  },
  {
    value: 'messages',
    label: 'Messages',
  },
];

interface SidebarSearchFilterProps {
  keyword: string;
}

const SidebarSearchFilter: FC<SidebarSearchFilterProps> = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('all');

  return (
    <div className="uppercase text-xs text-muted-foreground py-2 border-b font-semibold">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            style={{ background: 'transparent' }}
          >
            {value
              ? frameworks.find((framework) => framework.value === value)?.label
              : 'Select Filter'}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search framework..." className="h-9" />
            <CommandList>
              <CommandEmpty>No framework found.</CommandEmpty>
              <CommandGroup>
                {frameworks.map((framework) => (
                  <CommandItem
                    key={framework.value}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    {framework.label}
                    <Check
                      className={cn(
                        'ml-auto',
                        value === framework.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SidebarSearchFilter;
