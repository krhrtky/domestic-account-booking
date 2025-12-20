import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { fn, expect, userEvent, within } from 'storybook/test'
import MonthSelector from '../settlement/MonthSelector'

/**
 * MonthSelector は月を選択するためのドロップダウンコンポーネントです。
 *
 * ## L-CX-002 準拠
 * 日付フォーマットは「YYYY年MM月」形式で表示されます。
 *
 * ## 機能
 * - 月の一覧からの選択
 * - 選択変更時のコールバック
 * - アクセシビリティ対応（aria-label）
 */
const meta: Meta<typeof MonthSelector> = {
  title: 'UI/MonthSelector',
  component: MonthSelector,
  tags: ['autodocs'],
  argTypes: {
    months: {
      control: 'object',
      description: '選択可能な月の配列（YYYY-MM形式）',
    },
    selectedMonth: {
      control: 'text',
      description: '現在選択されている月（YYYY-MM形式）',
    },
    onChange: {
      action: 'month changed',
      description: '月が変更されたときに呼ばれるコールバック',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-gray-50 min-h-[100px]">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MonthSelector>

// ヘルパー関数: 月の配列を生成
const generateMonths = (count: number, startYear: number = 2025, startMonth: number = 1): string[] => {
  const months: string[] = []
  let year = startYear
  let month = startMonth

  for (let i = 0; i < count; i++) {
    months.push(`${year}-${month.toString().padStart(2, '0')}`)
    month++
    if (month > 12) {
      month = 1
      year++
    }
  }

  return months
}

/**
 * 基本的な月選択コンポーネント。12ヶ月分の選択肢を表示します。
 */
export const Default: Story = {
  args: {
    months: generateMonths(12),
    selectedMonth: '2025-01',
    onChange: fn(),
  },
}

/**
 * 特定の月が選択された状態を表示します。
 * この例では2025年6月が選択されています。
 */
export const SelectedMonth: Story = {
  args: {
    months: generateMonths(12),
    selectedMonth: '2025-06',
    onChange: fn(),
  },
}

/**
 * 異なる月数での表示バリエーション。
 * 3ヶ月、6ヶ月、24ヶ月の範囲に対応できることを示します。
 */
export const CustomMonthRange: Story = {
  render: () => {
    const [selected3, setSelected3] = useState('2025-01')
    const [selected6, setSelected6] = useState('2025-01')
    const [selected24, setSelected24] = useState('2025-01')

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">3ヶ月範囲:</p>
          <MonthSelector
            months={generateMonths(3)}
            selectedMonth={selected3}
            onChange={setSelected3}
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">6ヶ月範囲:</p>
          <MonthSelector
            months={generateMonths(6)}
            selectedMonth={selected6}
            onChange={setSelected6}
          />
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">24ヶ月範囲:</p>
          <MonthSelector
            months={generateMonths(24)}
            selectedMonth={selected24}
            onChange={setSelected24}
          />
        </div>
      </div>
    )
  },
}

/**
 * ラベル「対象月」が表示された標準的な状態です。
 * コンポーネントには組み込みのラベルが含まれています。
 */
export const WithLabel: Story = {
  args: {
    months: generateMonths(12),
    selectedMonth: '2025-03',
    onChange: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'コンポーネントには「対象月」ラベルが組み込まれており、アクセシビリティ対応のaria-labelも設定されています。',
      },
    },
  },
}

/**
 * インタラクションテスト用のStory。
 * 月を変更したときにonChangeコールバックが正しく呼ばれることを検証します。
 */
export const Interactions: Story = {
  args: {
    months: generateMonths(12),
    selectedMonth: '2025-01',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // セレクトボックスを取得
    const select = canvas.getByRole('combobox', { name: '精算対象月を選択' })

    // 初期値が正しく表示されていることを確認
    expect(select).toHaveValue('2025-01')

    // 月を変更
    await userEvent.selectOptions(select, '2025-06')

    // onChangeが正しく呼ばれたことを確認
    expect(args.onChange).toHaveBeenCalledWith('2025-06')

    // 別の月に変更
    await userEvent.selectOptions(select, '2025-12')

    // onChangeが再度呼ばれたことを確認
    expect(args.onChange).toHaveBeenCalledWith('2025-12')
    expect(args.onChange).toHaveBeenCalledTimes(2)
  },
}
