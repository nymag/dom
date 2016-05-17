'use strict';
var domify = require('domify'),
  _ = require('lodash');

/**
 * Get url without _how_ to access it, creating a uri.
 *
 * Removes port and protocol.
 *
 * @returns {string}
 */
function uri() {
  var location = document.location;

  return location.hostname + location.pathname;
}

/**
 * get page uri
 * note: page uri should be in the data-uri attribute of the <html> element
 * @returns {string}
 */
function pageUri() {
  return document.firstElementChild.getAttribute('data-uri');
}

/**
 * This function can be minimized smaller than document.querySelector
 * @param {Element} [el]
 * @param {string} selector
 * @returns {Element}
 * @example find('ul') //finds globally
 * @example find(el, '.list') //finds within
 */
function find(el, selector) {
  if (!selector) {
    selector = el;
    el = document;
  }
  return el.querySelector(selector);
}

/**
 * This function can be minimized smaller than document.querySelector
 * @param {Element} [el]
 * @param {string} selector
 * @returns {NodeList}
 * @example findAll('ul') //finds globally
 * @example findAll(el, '.list') //finds within
 */
function findAll(el, selector) {
  if (!selector) {
    selector = el;
    el = document;
  }
  return el.querySelectorAll(selector);
}

/**
 * NOTE: nodeType of 1 means Element
 * @param {Element} parent
 * @returns {Element} cursor
 */
function getFirstChildElement(parent) {
  var cursor = parent.firstChild;

  while (cursor && cursor.nodeType !== 1) {
    cursor = cursor.nextSibling;
  }
  return cursor;
}

/**
 * Returns true if the element would be selected by the specified selector.
 * Essentially a polyfill, but necessary for `closest`.
 * @param {Node} node   preferably an Element for better performance, but it will accept any Node.
 * @param {string} selector
 * @returns {boolean}
 */
function matches(node, selector) {
  var parent, matches, i;

  if (node.matches) {
    return node.matches(selector);
  } else {
    parent = node.parentElement || document;
    matches = parent.querySelectorAll(selector);
    i = 0;
    while (matches[i] && matches[i] !== node) {
      i++;
    }
    return !!matches[i];
  }
}

/**
 * get closest element that matches selector starting with the element itself and traversing up through parents.
 * @param  {Element} node
 * @param  {string} parentSelector
 * @return {Element|null}
 */
function closest(node, parentSelector) {
  var cursor = node;

  if (!parentSelector || typeof parentSelector !== 'string') {
    throw new Error('Please specify a selector to match against!');
  }

  while (cursor && !matches(cursor, 'html') && !matches(cursor, parentSelector)) {
    cursor = cursor.parentNode;
  }

  if (!cursor || matches(cursor, 'html')) {
    return null;
  } else {
    return cursor;
  }
}

function prependChild(parent, child) {
  if (parent.firstChild) {
    parent.insertBefore(child, parent.firstChild);
  } else {
    parent.appendChild(child);
  }
}

function insertBefore(node, newNode) {
  if (node.parentNode) {
    node.parentNode.insertBefore(newNode, node);
  }
}

function insertAfter(node, newNode) {
  if (node.parentNode) {
    node.parentNode.insertBefore(newNode, node.nextSibling);
  }
}

/**
 * Fast way to clear all children
 * @see http://jsperf.com/innerhtml-vs-removechild/294
 * @param {Element} el
 */
function clearChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Remove a single element from its parent
 * @param {Element} el
 */
function removeElement(el) {
  el.parentNode.removeChild(el);
}

function preventDefault(e) {
  e.preventDefault ? e.preventDefault() : e.returnValue = false; // eslint-disable-line
}

function replaceElement(el, replacementEl) {
  var parent = el.parentNode;

  if (parent) {
    parent.replaceChild(replacementEl, el);
  }
}

/**
 * wrap elements in another element
 * @param {NodeList|Element} els
 * @param {string} wrapper
 * @returns {Element} wrapperEl
 */
function wrapElements(els, wrapper) {
  var wrapperEl = document.createElement(wrapper);

  // make sure elements are in an array
  if (els instanceof HTMLElement) {
    els = [els];
  } else {
    els = Array.prototype.slice.call(els);
  }

  _.each(els, function (el) {
    // put it into the wrapper, remove it from its parent
    el.parentNode.removeChild(el);
    wrapperEl.appendChild(el);
  });

  // return the wrapped elements
  return wrapperEl;
}

/**
 * unwrap elements from another element
 * @param {Element} parent
 * @param {Element} wrapper
 */
function unwrapElements(parent, wrapper) {
  var el = wrapper.childNodes[0];

  // ok, so this looks weird, right?
  // turns out, appending nodes to another node will remove them
  // from the live NodeList, so we can keep iterating over the
  // first item in that list and grab all of them. Nice!
  while (el) {
    parent.appendChild(el);
    el = wrapper.childNodes[0];
  }

  parent.removeChild(wrapper);
}

/**
 * Create a remove node handler that runs fn and removes the observer.
 * @param {Element} el
 * @param {Function} fn
 * @returns {Function}
 */
function createRemoveNodeHandler(el, fn) {
  return function (mutations, observer) {
    mutations.forEach(function (mutation) {
      if (_.includes(mutation.removedNodes, el)) {
        fn();
        observer.disconnect();
      }
    });
  };
}

/**
 * Run a function when an element is removed from the DOM.
 * Note: Observer is removed after the function is run once.
 * @param {Element} el    Element to observe.
 * @param {Function} fn   Function to execute when element is removed.
 */
function onRemove(el, fn) {
  var observer = new MutationObserver(this.createRemoveNodeHandler(el, fn));

  observer.observe(el.parentNode, {childList: true});
}

/**
 * Get the position of a DOM element
 * @param  {Element} el
 * @return {object}
 */
function getPos(el) {
  var rect = el.getBoundingClientRect(),
    scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;

  return {
    top: rect.top + scrollY,
    bottom: rect.top + rect.height + scrollY,
    height: rect.height
  };
}

// creating elements
module.exports.create = domify;

// getting uri stuff
module.exports.uri = uri;
module.exports.pageUri = pageUri;

// finding elements (these minify nicely)
module.exports.find = find;
module.exports.findAll = findAll;
module.exports.matches = matches;
module.exports.closest = closest;
module.exports.getFirstChildElement = getFirstChildElement;
module.exports.getPos = getPos;

// manipulating elements
module.exports.prependChild = prependChild;
module.exports.insertBefore = insertBefore;
module.exports.insertAfter = insertAfter;
module.exports.replaceElement = replaceElement;
module.exports.removeElement = removeElement;
module.exports.clearChildren = clearChildren;

// wrapping and unwrapping elements
module.exports.wrapElements = wrapElements;
module.exports.unwrapElements = unwrapElements;

// event handling
module.exports.preventDefault = preventDefault;
module.exports.createRemoveNodeHandler = createRemoveNodeHandler;
module.exports.onRemove = onRemove;
