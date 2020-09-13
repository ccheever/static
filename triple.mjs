import { double } from 'http://ccheever.com/expo/static/double.mjs';

export function triple(x) {
  console.log('triple-ing');
  return double(x) * 1.5;
}
