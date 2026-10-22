import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import ChatInput from '../../src/components/shared/ChatComponents/ChatInput';
import ChatMessage from '../../src/components/shared/ChatComponents/ChatMessage';

vi.stubGlobal('ResizeObserver', class {
  observe() {}
  disconnect() {}
  unobserve() {}
});

describe('ChatInput', () => {
  test('clicking send calls onSend without the click event', async () => {
    const onSend = vi.fn();
    render(
      <ChatInput
        value="Patient has molar pain"
        onChange={() => {}}
        onSend={onSend}
        onKeyPress={() => {}}
        placeholder="Ask"
        isLoading={false}
      />,
    );

    await userEvent.click(screen.getByRole('button'));

    // sendMessage(messageContent?) would otherwise receive the event as the message
    expect(onSend).toHaveBeenCalledWith();
  });
});

describe('ChatMessage', () => {
  test('streaming indicator is valid phrasing content inside the message paragraph', () => {
    const { container } = render(
      <ChatMessage
        message={{ id: 1, type: 'ai', content: 'Hello', timestamp: new Date(), isStreaming: true }}
        aiAvatar="AI"
      />,
    );

    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(container.querySelector('p div')).toBeNull();
  });
});
