import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import FormField from './FormField'

const meta: Meta<typeof FormField> = {
  title: 'UI/FormField',
  component: FormField,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password'],
    },
    required: { control: 'boolean' },
    error: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof FormField>

function FormFieldWithState(props: Omit<React.ComponentProps<typeof FormField>, 'value' | 'onChange'>) {
  const [value, setValue] = useState('')
  return (
    <FormField
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

export const Default: Story = {
  render: (args) => <FormFieldWithState {...args} />,
  args: {
    label: 'メールアドレス',
    name: 'email',
    type: 'email',
    required: true,
  },
}

export const WithValue: Story = {
  args: {
    label: 'メールアドレス',
    name: 'email',
    type: 'email',
    required: true,
    value: 'user@example.com',
    onChange: () => {},
  },
}

export const WithError: Story = {
  args: {
    label: 'メールアドレス',
    name: 'email',
    type: 'email',
    required: true,
    value: 'invalid',
    error: '有効なメールアドレスを入力してください',
    onChange: () => {},
  },
}

export const Password: Story = {
  render: (args) => <FormFieldWithState {...args} />,
  args: {
    label: 'パスワード',
    name: 'password',
    type: 'password',
    required: true,
    minLength: 8,
  },
}

export const Optional: Story = {
  render: (args) => <FormFieldWithState {...args} />,
  args: {
    label: '表示名',
    name: 'displayName',
    type: 'text',
    required: false,
  },
}
