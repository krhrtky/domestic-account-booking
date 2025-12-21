import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import AppNavigation from './AppNavigation'

const meta: Meta<typeof AppNavigation> = {
  title: 'Navigation/AppNavigation',
  component: AppNavigation,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/dashboard',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof AppNavigation>

export const Dashboard: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/dashboard',
      },
    },
  },
}

export const Transactions: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/dashboard/transactions',
      },
    },
  },
}

export const Settings: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: '/settings',
      },
    },
  },
}

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    nextjs: {
      navigation: {
        pathname: '/dashboard',
      },
    },
  },
}
