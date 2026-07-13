import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';

// Type definitions for test components
interface GreetingComponentProps {
  name: string;
}

interface ConditionalComponentProps {
  showMessage: boolean;
}

// Test basic React functionality
describe('React Components', () => {
  test('renders simple component', () => {
    function SimpleComponent(): JSX.Element {
      return <div>Hello World</div>;
    }
    
    render(<SimpleComponent />);
    const element = screen.getByText(/hello world/i);
    expect(element).toBeInTheDocument();
  });

  test('renders component with props', () => {
    function GreetingComponent({ name }: GreetingComponentProps): JSX.Element {
      return <div>Hello {name}!</div>;
    }
    
    render(<GreetingComponent name="React" />);
    const element = screen.getByText(/hello react!/i);
    expect(element).toBeInTheDocument();
  });

  test('renders component with conditional content', () => {
    function ConditionalComponent({ showMessage }: ConditionalComponentProps): JSX.Element {
      return (
        <div>
          {showMessage && <span>Message is visible</span>}
          {!showMessage && <span>Message is hidden</span>}
        </div>
      );
    }
    
    render(<ConditionalComponent showMessage />);
    expect(screen.getByText(/message is visible/i)).toBeInTheDocument();
    
    render(<ConditionalComponent showMessage={false} />);
    expect(screen.getByText(/message is hidden/i)).toBeInTheDocument();
  });
});
