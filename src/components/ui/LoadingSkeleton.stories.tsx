import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import LoadingSkeleton from './LoadingSkeleton'

const meta: Meta<typeof LoadingSkeleton> = {
  title: 'UI/LoadingSkeleton',
  component: LoadingSkeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['card', 'table-row', 'dashboard-stats'],
    },
    count: { control: 'number' },
  },
}

export default meta
type Story = StoryObj<typeof LoadingSkeleton>

export const Card: Story = {
  args: {
    variant: 'card',
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-4">
        <Story />
      </div>
    ),
  ],
}

export const TableRow: Story = {
  args: {
    variant: 'table-row',
    count: 3,
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">日付</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">説明</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">金額</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">種別</th>
            </tr>
          </thead>
          <tbody>
            <Story />
          </tbody>
        </table>
      </div>
    ),
  ],
}

export const DashboardStats: Story = {
  args: {
    variant: 'dashboard-stats',
    count: 3,
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
}

export const DashboardStatsSingle: Story = {
  args: {
    variant: 'dashboard-stats',
    count: 1,
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm p-4">
        <Story />
      </div>
    ),
  ],
}
