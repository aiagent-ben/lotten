// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from './Button';
import { Select } from './Select';
import { Badge } from './Badge';

describe('UI Primitives Standard', () => {
  describe('Button', () => {
    it('always applies the base .btn class alongside variant and size classes', () => {
      render(<Button variant="primary" size="lg">Enquire Now</Button>);
      const btn = screen.getByRole('button', { name: /enquire now/i });
      expect(btn).toHaveClass('btn');
      expect(btn).toHaveClass('btn-primary');
      expect(btn).toHaveClass('btn-lg');
    });

    it('supports outline variant and sm size', () => {
      render(<Button variant="outline" size="sm">Browse</Button>);
      const btn = screen.getByRole('button', { name: /browse/i });
      expect(btn).toHaveClass('btn');
      expect(btn).toHaveClass('btn-outline');
      expect(btn).toHaveClass('btn-sm');
    });

    it('renders with asChild when wrapping an anchor link', () => {
      render(
        <Button asChild variant="secondary">
          <a href="/products">Shop Link</a>
        </Button>
      );
      const link = screen.getByRole('link', { name: /shop link/i });
      expect(link).toHaveAttribute('href', '/products');
      expect(link).toHaveClass('btn');
      expect(link).toHaveClass('btn-secondary');
    });
  });

  describe('Select', () => {
    it('renders select with stone border and chevron container', () => {
      render(
        <Select aria-label="Category Select" defaultValue="tables">
          <option value="tables">Tables</option>
          <option value="chairs">Chairs</option>
        </Select>
      );
      const select = screen.getByRole('combobox', { name: /category select/i });
      expect(select).toHaveClass('border-stone-200');
      expect(select).toHaveClass('text-stone-800');
      expect(select).toHaveValue('tables');
    });
  });

  describe('Badge', () => {
    it('renders warm badge styles without cold grays', () => {
      render(<Badge variant="amber">Malaysian Oak</Badge>);
      const badge = screen.getByText(/malaysian oak/i);
      expect(badge).toHaveClass('bg-amber-50');
      expect(badge).toHaveClass('text-amber-900');
      expect(badge).toHaveClass('border-amber-200');
    });
  });
});
