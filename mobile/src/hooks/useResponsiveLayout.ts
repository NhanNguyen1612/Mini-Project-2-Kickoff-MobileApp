import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isTablet = width >= 768;
  const columns = width >= 768 ? 3 : width >= 480 ? 2 : 1;

  // Slide 26 responsive card width calculation with padding consideration
  const cardWidth =
    width >= 768
      ? (width - 48 - 24) / 3
      : width >= 480
      ? (width - 48 - 12) / 2
      : width - 32;

  return {
    width,
    height,
    isLandscape,
    isTablet,
    columns,
    cardWidth,
  };
}
