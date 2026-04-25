import { Text } from 'react-native';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

export function AnimatedNumber({
  decimals = 0,
  prefix = '',
  style,
  suffix = '',
  value,
}) {
  const animatedValue = useAnimatedNumber(value);
  return (
    <Text style={style}>
      {prefix}
      {animatedValue.toFixed(decimals)}
      {suffix}
    </Text>
  );
}
