import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import LoadingButton from './LoadingButton'

const meta: Meta<typeof LoadingButton> = {
  title: 'UI/LoadingButton',
  component: LoadingButton,
  tags: ['autodocs'],
  argTypes: {
    isLoading: { control: 'boolean' },
    loadingText: { control: 'text' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof LoadingButton>

export const Primary: Story = {
  args: {
    isLoading: false,
    children: 'ログイン',
    variant: 'primary',
  },
}

export const PrimaryLoading: Story = {
  args: {
    isLoading: true,
    loadingText: '処理中...',
    children: 'ログイン',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    isLoading: false,
    children: 'キャンセル',
    variant: 'secondary',
  },
}

export const SecondaryLoading: Story = {
  args: {
    isLoading: true,
    loadingText: '処理中...',
    children: 'キャンセル',
    variant: 'secondary',
  },
}

export const Disabled: Story = {
  args: {
    isLoading: false,
    children: '送信',
    disabled: true,
    variant: 'primary',
  },
}
