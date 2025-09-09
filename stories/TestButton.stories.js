import { fn } from 'storybook/test';
import { createTestButton } from './TestButton';

export default {
  title: 'Example/TestButton',
  tags: ['autodocs'],
  render: ({ label, ...args }) => createTestButton({ label, ...args }),
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    onClick: { action: 'onClick' },
  },
  args: { onClick: fn(), label: 'Test Button' },
};

export const Default = {};

export const Disabled = {
  args: {
    disabled: true,
  },
};

