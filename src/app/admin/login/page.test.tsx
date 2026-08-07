// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLoginPage from './page';

const push = vi.fn();
const refresh = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => searchParams,
}));

const signInWithPassword = vi.fn();

vi.mock('@/lib/db/client-browser', () => ({
  createBrowserClient: () => ({ auth: { signInWithPassword } }),
}));

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams = new URLSearchParams();
  });

  it('renders email and password fields', () => {
    render(<AdminLoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows an access-denied message from the URL error param', () => {
    searchParams = new URLSearchParams({ error: 'Access denied' });
    render(<AdminLoginPage />);

    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });

  it('redirects to the redirect param on successful sign-in', async () => {
    searchParams = new URLSearchParams({ redirect: '/admin/products' });
    signInWithPassword.mockResolvedValue({ error: null });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/products'));
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'correct-password',
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('defaults to /admin when there is no redirect param', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin'));
  });

  it('shows an error and does not navigate on failed sign-in', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText('Invalid login credentials')).toBeInTheDocument());
    expect(push).not.toHaveBeenCalled();
  });
});
