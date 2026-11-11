// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom does not implement window.scrollTo. The Layout component scrolls to
// the top on route changes, so stub it to keep test output free of
// "Not implemented" errors.
beforeAll(() => {
  window.scrollTo = jest.fn();
});
