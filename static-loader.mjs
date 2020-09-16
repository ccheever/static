import fetch from 'cross-fetch';

import staticlib from './staticlib.js';

/**
 * 

 https://
 static://
 app://
 npm://

 */

let Protocols = ['http', 'https', 'static', 'statici', 'app', 'appi', 'npm'];
export let remoteLoadRegex = _makeRemoteLoadRegex();

function _makeRemoteLoadRegex() {
  let s = '^(?<scheme>(?<protocol>';
  s += Protocols.join('|');
  s += ')(://))(?<address>[^#]*)(?<fragment>#?.*)$';
  return new RegExp(s);
}

function isRemoteLoadUrl(url) {
  if (url) {
    return !!url.match(remoteLoadRegex);
  }
}

function getRemoteLoadInfo(specifier) {
  let remoteLoad = specifier.match(remoteLoadRegex);
  if (remoteLoad) {
    let url = remoteLoadToUrl(remoteLoad);
    let { protocol, address, fragment } = remoteLoad.groups;

    let importType;
    switch (protocol) {
      case 'static':
      case 'statici':
        importType = 'static';
        break;
      case 'npm':
        importType = 'npm';
        break;
      case 'app':
      case 'appi':
        importType = 'app';
      case 'http':
      case 'https':
        importType = 'http';
        break;
      default:
        importType = null;
        break;
    }
    return {
      protocol,
      address,
      fragment,
      specifier,
      url,
      importType,
    };
  }
}

function remoteLoadToUrl(remoteLoad) {
  if (!remoteLoad) {
    return null;
  }
  let { protocol, address, fragment } = remoteLoad.groups;
  switch (protocol) {
    case 'https':
    case 'static':
    case 'app':
      return 'https://' + address;
      break;

    case 'http':
    case 'statici':
    case 'appi':
      return 'http://' + address;
      break;

    case 'npm':
      throw new Error('Not yet implemented!');
      break;

    default:
      throw new Error('Confused about how to import that! Bailing.');
      break;
  }
}

/**
 * @param {string} specifier
 * @param {{
 *   conditions: !Array<string>,
 *   parentURL: !(string | undefined),
 * }} context
 * @param {Function} defaultResolve
 * @returns {Promise<{ url: string }>}
 */

export async function resolve(specifier, context, defaultResolve) {
  let { parentURL = null } = context;

  let remoteLoad = specifier.match(remoteLoadRegex);
  let parentRemoteLoad = null;
  if (parentURL) {
    parentRemoteLoad = parentURL.match(remoteLoadRegex);
  }

  if (remoteLoad) {
    return {
      url: specifier,
    };
  } else if (parentRemoteLoad) {
    return {
      url: new URL(specifier, parentURL).href,
    };
  } else {
    return defaultResolve(specifier, context, defaultResolve);
  }
}

/**
 * @param {string} url
 * @param {Object} context (currently empty)
 * @param {Function} defaultGetFormat
 * @returns {Promise<{ format: string }>}
 */

export function getFormat(url, context, defaultGetFormat) {
  // This loader assumes all network-provided JavaScript is ES module code.
  if (isRemoteLoadUrl(url)) {
    return {
      format: 'module',
    };
  }

  // Let Node.js handle all other URLs.
  return defaultGetFormat(url, context, defaultGetFormat);
}
/*
export async function getFormat(url, context, defaultGetFormat) {
  // Some condition.
  // For some or all URLs, do some custom logic for determining format.
  // Always return an object of the form {format: <string>}, where the
  // format is one of the strings in the table above.
  return {
    format: "module",
  };
  // Defer to Node.js for all other URLs.
  return defaultGetFormat(url, context, defaultGetFormat);
}
*/

/*
/**
 * @param {string} specifier
 * @param {{
 *   conditions: !Array<string>,
 *   parentURL: !(string | undefined),
 * }} context
 * @param {Function} defaultResolve
 * @returns {Promise<{ url: string }>}
 */
/*
export async function resolve(specifier, context, defaultResolve) {
  const { parentURL = null } = context;
  if (Math.random() > 0.5) {
    // Some condition.
    // For some or all specifiers, do some custom logic for resolving.
    // Always return an object of the form {url: <string>}.
    return {
      url: parentURL
        ? new URL(specifier, parentURL).href
        : new URL(specifier).href,
    };
  }
  if (Math.random() < 0.5) {
    // Another condition.
    // When calling `defaultResolve`, the arguments can be modified. In this
    // case it's adding another value for matching conditional exports.
    return defaultResolve(specifier, {
      ...context,
      conditions: [...context.conditions, "another-condition"],
    });
  }
  // Defer to Node.js for all other specifiers.
  return defaultResolve(specifier, context, defaultResolve);
}
*/

/**
 * @param {string} url
 * @param {Object} context (currently empty)
 * @param {Function} defaultGetFormat
 * @returns {Promise<{ format: string }>}
 */
/*
export async function getFormat(url, context, defaultGetFormat) {
  if (Math.random() > 0.5) {
    // Some condition.
    // For some or all URLs, do some custom logic for determining format.
    // Always return an object of the form {format: <string>}, where the
    // format is one of the strings in the table above.
    return {
      format: "module",
    };
  }
  // Defer to Node.js for all other URLs.
  return defaultGetFormat(url, context, defaultGetFormat);
}
*/

export async function getSource(url, context, defaultGetSource) {
  // For JavaScript to be loaded over the network, we need to fetch and
  // return it.

  // let remoteLoad = url.match(remoteLoadRegex);
  let remoteLoadInfo = getRemoteLoadInfo(url);
  if (remoteLoadInfo) {
    // console.log({ remoteLoadInfo });
    // console.log(`Fetching ${remoteLoadInfo.url} because of ${url}`);
    let result = await staticlib.getFile({
      specifiedUrl: url,
      httpUrl: remoteLoadInfo.url,
      importType: remoteLoadInfo.importType,
    });
    // console.log({ result });

    return { source: result.content };
    // return { source: await response.text() };
  }

  // Let Node.js handle all other URLs.
  return defaultGetSource(url, context, defaultGetSource);
}

/**
 * @param {string} url
 * @param {{ format: string }} context
 * @param {Function} defaultGetSource
 * @returns {Promise<{ source: !(string | SharedArrayBuffer | Uint8Array) }>}
 */
/*
export async function getSource(url, context, defaultGetSource) {
  const { format } = context;
  if (Math.random() > 0.5) {
    // Some condition.
    // For some or all URLs, do some custom logic for retrieving the source.
    // Always return an object of the form {source: <string|buffer>}.
    return {
      source: "...",
    };
  }
  // Defer to Node.js for all other URLs.
  return defaultGetSource(url, context, defaultGetSource);
}
*/

/**
 * @param {!(string | SharedArrayBuffer | Uint8Array)} source
 * @param {{
 *   format: string,
 *   url: string,
 * }} context
 * @param {Function} defaultTransformSource
 * @returns {Promise<{ source: !(string | SharedArrayBuffer | Uint8Array) }>}
 */
/*
export async function transformSource(source, context, defaultTransformSource) {
  const { url, format } = context;
  if (Math.random() > 0.5) {
    // Some condition.
    // For some or all URLs, do some custom logic for modifying the source.
    // Always return an object of the form {source: <string|buffer>}.
    return {
      source: "...",
    };
  }
  // Defer to Node.js for all other sources.
  return defaultTransformSource(source, context, defaultTransformSource);
}
*/

/**
 * @returns {string} Code to run before application startup
 */
/*
export function getGlobalPreloadCode() {
  return `\
  globalThis.someInjectedProperty = 42;
  console.log('I just set some globals!');
  
  const { createRequire } = getBuiltin('module');
  
  const require = createRequire(process.cwd() + '/<preload>');
  // [...]
  `;
}
*/
