import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { fn, expect, userEvent, within } from 'storybook/test'
import PaginationControls from '../transactions/PaginationControls'

/**
 * PaginationControls はページネーションを制御するためのUIコンポーネントです。
 *
 * ## L-CX-002 準拠
 * 表示件数は「{開始}-{終了} / {合計}件」形式で表示されます。
 *
 * ## 機能
 * - ページの切り替え（前へ/次へ）
 * - ページ番号の直接選択
 * - 表示件数の変更（10/25/50件）
 * - 多ページ時の省略記号（...）表示
 * - アクセシビリティ対応（aria-label、aria-current）
 */
const meta: Meta<typeof PaginationControls> = {
  title: 'UI/PaginationControls',
  component: PaginationControls,
  tags: ['autodocs'],
  argTypes: {
    pagination: {
      control: 'object',
      description: 'ページネーション状態（totalCount, totalPages, currentPage, pageSize）',
    },
    onPageChange: {
      action: 'page changed',
      description: 'ページが変更されたときに呼ばれるコールバック',
    },
    onPageSizeChange: {
      action: 'page size changed',
      description: '表示件数が変更されたときに呼ばれるコールバック',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-50 min-h-[100px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'responsive',
    },
  },
}

export default meta
type Story = StoryObj<typeof PaginationControls>

/**
 * 標準的なページネーション表示。
 * 10件表示 / 100件合計 / 1ページ目の状態です。
 */
export const Default: Story = {
  args: {
    pagination: {
      totalCount: 100,
      totalPages: 10,
      currentPage: 1,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
}

/**
 * 少ページ数時の表示。
 * 7ページ以下の場合は省略記号（...）が表示されません。
 */
export const FewPages: Story = {
  args: {
    pagination: {
      totalCount: 35,
      totalPages: 4,
      currentPage: 2,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '7ページ以下の場合、すべてのページ番号がそのまま表示されます。省略記号は使用されません。',
      },
    },
  },
}

/**
 * 多ページ時の省略記号表示。
 * 8ページ以上の場合、省略記号（...）が表示されます。
 * この例では1ページ目を表示しており、末尾に省略記号が表示されます。
 */
export const ManyPages: Story = {
  args: {
    pagination: {
      totalCount: 500,
      totalPages: 50,
      currentPage: 1,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '50ページ中の1ページ目。先頭5ページと最終ページが表示され、間に省略記号が入ります。',
      },
    },
  },
}

/**
 * 中間ページ選択時の両端省略表示。
 * 中間のページを選択すると、先頭と末尾の両方に省略記号が表示されます。
 */
export const MiddlePage: Story = {
  args: {
    pagination: {
      totalCount: 500,
      totalPages: 50,
      currentPage: 25,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '50ページ中の25ページ目。先頭(1)...中間(24-26)...末尾(50)の形式で表示されます。',
      },
    },
  },
}

/**
 * 先頭ページ（1ページ目）の状態。
 * 「前へ」ボタンが非活性（disabled）になります。
 */
export const FirstPage: Story = {
  args: {
    pagination: {
      totalCount: 100,
      totalPages: 10,
      currentPage: 1,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '1ページ目では「前へ」ボタンが非活性になり、クリックできません。',
      },
    },
  },
}

/**
 * 最終ページの状態。
 * 「次へ」ボタンが非活性（disabled）になります。
 */
export const LastPage: Story = {
  args: {
    pagination: {
      totalCount: 100,
      totalPages: 10,
      currentPage: 10,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: '最終ページでは「次へ」ボタンが非活性になり、クリックできません。',
      },
    },
  },
}

/**
 * 表示件数のバリエーション（10/25/50件）。
 * 各表示件数でのページネーション状態を比較できます。
 */
export const PageSizeVariants: Story = {
  render: () => {
    const [pageSize10, setPageSize10] = useState({ currentPage: 1, pageSize: 10 })
    const [pageSize25, setPageSize25] = useState({ currentPage: 1, pageSize: 25 })
    const [pageSize50, setPageSize50] = useState({ currentPage: 1, pageSize: 50 })

    const totalCount = 100

    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm text-gray-600 mb-2 font-medium">10件表示（10ページ）:</p>
          <PaginationControls
            pagination={{
              totalCount,
              totalPages: Math.ceil(totalCount / pageSize10.pageSize),
              currentPage: pageSize10.currentPage,
              pageSize: pageSize10.pageSize,
            }}
            onPageChange={(page) => setPageSize10((prev) => ({ ...prev, currentPage: page }))}
            onPageSizeChange={(size) => setPageSize10({ currentPage: 1, pageSize: size })}
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2 font-medium">25件表示（4ページ）:</p>
          <PaginationControls
            pagination={{
              totalCount,
              totalPages: Math.ceil(totalCount / pageSize25.pageSize),
              currentPage: pageSize25.currentPage,
              pageSize: pageSize25.pageSize,
            }}
            onPageChange={(page) => setPageSize25((prev) => ({ ...prev, currentPage: page }))}
            onPageSizeChange={(size) => setPageSize25({ currentPage: 1, pageSize: size })}
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2 font-medium">50件表示（2ページ）:</p>
          <PaginationControls
            pagination={{
              totalCount,
              totalPages: Math.ceil(totalCount / pageSize50.pageSize),
              currentPage: pageSize50.currentPage,
              pageSize: pageSize50.pageSize,
            }}
            onPageChange={(page) => setPageSize50((prev) => ({ ...prev, currentPage: page }))}
            onPageSizeChange={(size) => setPageSize50({ currentPage: 1, pageSize: size })}
          />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '表示件数（pageSize）を変更すると、総ページ数が再計算されます。',
      },
    },
  },
}

/**
 * データ0件時の状態。
 * ページネーションは「0-0 / 0件」と表示され、ナビゲーションボタンは非活性になります。
 */
export const EmptyState: Story = {
  args: {
    pagination: {
      totalCount: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'データがない場合の表示。前へ/次へボタンは両方とも非活性になります。',
      },
    },
  },
}

/**
 * インタラクションテスト用のStory。
 * ページ変更と表示件数変更のイベントが正しく発火することを検証します。
 */
export const Interactions: Story = {
  args: {
    pagination: {
      totalCount: 100,
      totalPages: 10,
      currentPage: 1,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // 「次のページ」ボタンをクリック
    const nextButton = canvas.getByRole('button', { name: '次のページ' })
    await userEvent.click(nextButton)

    // onPageChangeが呼ばれたことを確認
    expect(args.onPageChange).toHaveBeenCalledWith(2)

    // ページ番号ボタンをクリック（3ページ目）
    const page3Button = canvas.getByRole('button', { name: '3ページ目' })
    await userEvent.click(page3Button)

    // onPageChangeが呼ばれたことを確認
    expect(args.onPageChange).toHaveBeenCalledWith(3)
    expect(args.onPageChange).toHaveBeenCalledTimes(2)

    // 表示件数の変更
    const pageSizeSelect = canvas.getByRole('combobox', { name: '表示件数' })
    await userEvent.selectOptions(pageSizeSelect, '25')

    // onPageSizeChangeが呼ばれたことを確認
    expect(args.onPageSizeChange).toHaveBeenCalledWith(25)
  },
}

/**
 * アクセシビリティ検証用Story。
 * aria-label、aria-currentなどのアクセシビリティ属性を確認します。
 */
export const AccessibilityCheck: Story = {
  args: {
    pagination: {
      totalCount: 100,
      totalPages: 10,
      currentPage: 5,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 前へボタンのaria-label確認
    const prevButton = canvas.getByRole('button', { name: '前のページ' })
    expect(prevButton).toBeInTheDocument()

    // 次へボタンのaria-label確認
    const nextButton = canvas.getByRole('button', { name: '次のページ' })
    expect(nextButton).toBeInTheDocument()

    // 現在のページのaria-current確認
    const currentPageButton = canvas.getByRole('button', { name: '5ページ目' })
    expect(currentPageButton).toHaveAttribute('aria-current', 'page')

    // 表示件数のaria-label確認
    const pageSizeSelect = canvas.getByRole('combobox', { name: '表示件数' })
    expect(pageSizeSelect).toBeInTheDocument()
  },
  parameters: {
    docs: {
      description: {
        story: 'アクセシビリティ属性（aria-label、aria-current）が正しく設定されていることを検証します。',
      },
    },
  },
}

/**
 * レスポンシブ表示の確認用Story。
 * モバイル/デスクトップで異なるレイアウトになります。
 */
export const Responsive: Story = {
  args: {
    pagination: {
      totalCount: 100,
      totalPages: 10,
      currentPage: 5,
      pageSize: 10,
    },
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'モバイル表示では縦方向にレイアウトが変わります。sm breakpoint以上でflex-rowに変化します。',
      },
    },
  },
}
