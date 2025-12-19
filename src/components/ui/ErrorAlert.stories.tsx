import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import ErrorAlert from './ErrorAlert'

const meta: Meta<typeof ErrorAlert> = {
  title: 'UI/ErrorAlert',
  component: ErrorAlert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['card', 'inline'],
    },
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
type Story = StoryObj<typeof ErrorAlert>

export const Card: Story = {
  args: {
    title: 'エラー',
    message: 'データの読み込みに失敗しました。しばらくしてから再度お試しください。',
    variant: 'card',
  },
}

export const CardWithRetry: Story = {
  args: {
    title: '接続エラー',
    message: 'サーバーとの接続に失敗しました。',
    variant: 'card',
    retry: fn(),
  },
}

export const Inline: Story = {
  args: {
    title: 'エラー',
    message: '入力内容に誤りがあります。',
    variant: 'inline',
  },
}

export const InlineWithRetry: Story = {
  args: {
    title: '保存エラー',
    message: 'データの保存に失敗しました。',
    variant: 'inline',
    retry: fn(),
  },
}

export const LongMessage: Story = {
  args: {
    title: 'システムエラー',
    message:
      '予期しないエラーが発生しました。問題が解決しない場合は、お手数ですがサポートまでお問い合わせください。エラーコード: E_INTERNAL_001',
    variant: 'card',
    retry: fn(),
  },
}
