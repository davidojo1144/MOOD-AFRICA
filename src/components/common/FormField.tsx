import { type Control, Controller, type FieldPath, type FieldValues } from 'react-hook-form';

import { Input, type InputProps } from '@/components/ui/Input';

type FormFieldProps<T extends FieldValues> = Omit<InputProps, 'value' | 'onChangeText'> & {
  control: Control<T>;
  name: FieldPath<T>;
};

export function FormField<T extends FieldValues>({
  control,
  name,
  ...inputProps
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
        <Input
          ref={ref}
          value={value ?? ''}
          onChangeText={onChange}
          onBlur={onBlur}
          error={error?.message}
          {...inputProps}
        />
      )}
    />
  );
}
