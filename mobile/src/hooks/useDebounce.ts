import { useState, useEffect } from 'react';

/**
 * Custom hook debounce giá trị nhập liệu (Slide 26: Custom Hooks)
 * Giúp tối ưu hóa hiệu năng tìm kiếm phòng học, giảm thiểu re-render không cần thiết
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
