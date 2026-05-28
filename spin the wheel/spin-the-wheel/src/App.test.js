import { render, screen } from '@testing-library/react';
import App from './App';

test('renders IMedOne spin wheel heading', () => {
  render(<App />);
  expect(screen.getByText(/imedone spin the wheel/i)).toBeInTheDocument();
  expect(screen.getByText(/suhas sir/i)).toBeInTheDocument();
  expect(screen.getByText(/single winner/i)).toBeInTheDocument();
  expect(screen.getByText(/^group$/i)).toBeInTheDocument();
  expect(screen.getByText(/members/i)).toBeInTheDocument();
});
