import { double } from 'http://ccheever.com/expo/static/double.mjs';
import { triple } from './triple.mjs';
import * as crossFetch from 'https://cdn.skypack.dev/cross-fetch@^3.0.4';

let x = 2;
let y = double(x);
let z = triple(x);
console.log({ x, y, z, crossFetch });
