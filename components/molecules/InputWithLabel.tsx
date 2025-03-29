import type { FC, HTMLInputTypeAttribute } from 'react';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';

interface InputWithLabelProps {
  label: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute | undefined;
}

const InputWithLabel: FC<InputWithLabelProps> = ({
  label,
  type,
  placeholder,
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Input id={label} type={type} placeholder={placeholder} />
    </div>
  );
};

export default InputWithLabel;
