// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import axios from 'axios';

// Mock axios
const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  defaults: {
    headers: {
      common: {},
    },
  },
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxios),
}));

// Export mock for use in tests
export const mockedAxios = mockAxios;

// Mock window.alert
window.alert = jest.fn();
