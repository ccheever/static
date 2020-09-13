import { double } from 'http://ccheever.com/expo/static/double.mjs';
import { triple } from './triple.mjs';

let x = 2;
let y = double(x);
let z = triple(x);
console.log({ x, y, z });
