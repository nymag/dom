'use strict';
var lib = require('./index'),
  sinon = require('sinon'),
  expect = require('chai').expect,
  jsdom = require('mocha-jsdom');

describe('@nymag/dom', function () {
  var el, childEl, secondChildEl, headEl, sandbox;

  jsdom(); // set up fake DOM

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    // create el
    el = document.createElement('section');
    el.classList.add('parent-el');
    el.textContent = 'I am a section.';
    document.body.appendChild(el);

    // create child el
    childEl = document.createElement('div');
    childEl.classList.add('child-el');
    el.appendChild(childEl);

    // create second child el
    secondChildEl = document.createElement('div');
    secondChildEl.classList.add('second-child-el');
    el.appendChild(secondChildEl);

    // create el in head
    headEl = document.createElement('title');
    document.querySelector('head').appendChild(headEl);
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('find()', function () {
    it('finds selector in el', function () {
      expect(lib.find(el, 'div')).to.eql(el.querySelector('div'));
    });

    it('finds selector in document if no el passed in', function () {
      expect(lib.find('.child-el')).to.eql(document.querySelector('.child-el'));
    });

    it('returns null if no element found', function () {
      expect(lib.find('.foo')).to.eql(null);
    });
  });

  describe('findAll()', function () {
    it('finds selector in el', function () {
      expect(lib.findAll(el, 'div')).to.eql(el.querySelectorAll('div'));
    });

    it('finds selector in document if no el passed in', function () {
      expect(lib.findAll('.child-el')).to.eql(document.querySelectorAll('.child-el'));
    });

    it('returns empty NodeList if no elements found', function () {
      expect(lib.findAll('.foo')).to.eql(document.querySelectorAll('.foo'));
    });
  });

  describe('getFirstChildElement()', function () {
    it('gets the first child element', function () {
      expect(lib.getFirstChildElement(el)).to.eql(childEl);
    });

    it('does not get the second child element', function () {
      expect(lib.getFirstChildElement(el)).to.not.eql(secondChildEl);
    });
  });

  describe('closest()', function () {
    it('returns itself if it matches', function () {
      expect(lib.closest(childEl, '.child-el')).to.eql(childEl);
    });

    it('returns parent that matches', function () {
      expect(lib.closest(childEl, '.parent-el')).to.eql(el);
      expect(lib.closest(childEl, 'section')).to.eql(el);
    });

    it('returns null if no parent matches in body', function () {
      expect(lib.closest(childEl, '.something.that.doesnt.match')).to.eql(null);
    });

    it('returns null if no parent matches in head', function () {
      expect(lib.closest(headEl, '.something.that.doesnt.match')).to.eql(null);
    });

    it('throws error if no selector passed in as second arg', function () {
      function noSelector() { return lib.closest(childEl); }
      function nonStringSelector() { return lib.closest(childEl, 1); }

      expect(noSelector).to.throw(Error);
      expect(nonStringSelector).to.throw(Error);
    });
  });

  describe('prependChild()', function () {
    it('adds a child to an empty element', function () {
      var tmpEl = document.createDocumentFragment();

      lib.prependChild(tmpEl, childEl);
      expect(lib.find(tmpEl, 'div')).to.eql(childEl);
    });

    it('adds a child to an element with children', function () {
      var tmpEl = document.createDocumentFragment();

      tmpEl.appendChild(childEl);

      lib.prependChild(tmpEl, secondChildEl);
      expect(lib.find(tmpEl, 'div')).to.eql(secondChildEl);
    });
  });

  describe('clearChildren()', function () {
    it('removed all children', function () {
      lib.clearChildren(el);
      expect(lib.find(el, 'div')).to.eql(null);
    });
  });

  describe('removeElement()', function () {
    it('removes the element', function () {
      var tmpEl = document.createDocumentFragment();

      tmpEl.appendChild(childEl);

      lib.removeElement(childEl);
      expect(lib.find(tmpEl, 'div')).to.eql(null);
    });
  });

  describe('replaceElement()', function () {
    it('replaces in place', function () {
      var tmpEl = document.createDocumentFragment();

      tmpEl.appendChild(childEl);

      lib.replaceElement(childEl, secondChildEl);
      expect(lib.find(tmpEl, 'div')).to.eql(secondChildEl);
    });
  });

  describe('wrapElements', function () {
    it('wraps a single element', function () {
      var els = childEl,
        wrapper = 'span',
        result = document.createElement('span');

      result.appendChild(childEl.cloneNode(true));

      expect(lib.wrapElements(els, wrapper).outerHTML).to.equal(result.outerHTML);
    });

    it('wraps an array of elements', function () {
      var els = [childEl, secondChildEl],
        wrapper = 'span',
        result = document.createElement('span');

      result.appendChild(childEl.cloneNode(true));
      result.appendChild(secondChildEl.cloneNode(true));

      expect(lib.wrapElements(els, wrapper).outerHTML).to.equal(result.outerHTML);
    });

    it('doesn\'t wrap a live node list', function () {
      var els = el.children,
        wrapper = 'span',
        result = document.createElement('span');

      result.appendChild(childEl);
      result.appendChild(secondChildEl);

      expect(lib.wrapElements(els, wrapper).outerHTML).to.not.equal(result.outerHTML);
    });
  });

  describe('createRemoveNodeHandler', function () {
    it('runs a function when the element is a removed node and then disconnects the observer', function () {
      var mockMutationObserver = {disconnect: sandbox.spy(function () {})},
        mockMutations = [{removedNodes: [el]}],
        fn = sandbox.spy(function () {}),
        removeNodeHandler = lib.createRemoveNodeHandler(el, fn);

      removeNodeHandler(mockMutations, mockMutationObserver);

      expect(fn.callCount).to.equal(1);
      expect(mockMutationObserver.disconnect.callCount).to.equal(1);
    });
  });
});
