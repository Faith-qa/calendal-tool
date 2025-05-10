import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HelloWorld } from './HelloWorld';

describe('HelloWorld', () => {
  it('renders hello world message', () => {
    render(<HelloWorld />);
    const heading = screen.getByRole('heading', { name: /hello world!/i });
    expect(heading).toBeInTheDocument();
  });
}); 