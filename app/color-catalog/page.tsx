'use client'

import { useState } from 'react'

const colorSchemes = {
  current: {
    name: '現状 (Purple & Gold)',
    emoji: '💜',
    description: 'エレガントで落ち着いた高級感',
    colors: {
      primary: '#5B4B8A',
      primaryDark: '#483D6B',
      primaryLight: '#7B6BA8',
      accent: '#C4A77D',
      accentLight: '#E8DCC8',
      background: '#FAF8F5',
      backgroundEnd: '#F5F2ED',
      success: '#4A7C59',
      warning: '#C4A35A',
      error: '#B5495B',
      info: '#4A6B8A',
    },
  },
  natureCam: {
    name: 'Nature Calm',
    emoji: '🌿',
    description: '安心感・ナチュラル・健康的',
    colors: {
      primary: '#3D7A5D',
      primaryDark: '#2C5A44',
      primaryLight: '#5A9A7D',
      accent: '#E8B86D',
      accentLight: '#F5E6C8',
      background: '#F8FAF7',
      backgroundEnd: '#F0F5EE',
      success: '#4A7C59',
      warning: '#D4A84B',
      error: '#C45B5B',
      info: '#5A8A9A',
    },
  },
  oceanTrust: {
    name: 'Ocean Trust',
    emoji: '🌊',
    description: '信頼性・清潔感・モダン',
    colors: {
      primary: '#2D6A8A',
      primaryDark: '#1D4A6A',
      primaryLight: '#4D8AAA',
      accent: '#F4A261',
      accentLight: '#FCE4C8',
      background: '#F5F9FC',
      backgroundEnd: '#EAF2F8',
      success: '#2E8B6E',
      warning: '#E9A84B',
      error: '#D9534F',
      info: '#5DADE2',
    },
  },
  softRose: {
    name: 'Soft Rose',
    emoji: '🌸',
    description: '親しみやすい・優しい・家庭的',
    colors: {
      primary: '#8B6B7B',
      primaryDark: '#6B4B5B',
      primaryLight: '#AB8B9B',
      accent: '#A8C4A0',
      accentLight: '#D8E8D4',
      background: '#FBF8F9',
      backgroundEnd: '#F5F0F2',
      success: '#7AB892',
      warning: '#D4B86A',
      error: '#C97878',
      info: '#7BA3B8',
    },
  },
  modernMinimal: {
    name: 'Modern Minimal',
    emoji: '🌙',
    description: 'プロフェッショナル・シンプル・信頼',
    colors: {
      primary: '#2C3E50',
      primaryDark: '#1A252F',
      primaryLight: '#34495E',
      accent: '#27AE60',
      accentLight: '#D4EFDF',
      background: '#FAFBFC',
      backgroundEnd: '#F4F6F7',
      success: '#27AE60',
      warning: '#F39C12',
      error: '#E74C3C',
      info: '#3498DB',
    },
  },
}

type SchemeKey = keyof typeof colorSchemes

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-lg shadow-sm border border-black/10"
        style={{ backgroundColor: color }}
      />
      <div className="text-xs">
        <div className="text-gray-600">{label}</div>
        <div className="font-mono text-gray-400">{color}</div>
      </div>
    </div>
  )
}

function MockUI({ scheme }: { scheme: (typeof colorSchemes)[SchemeKey] }) {
  const { colors } = scheme

  return (
    <div
      className="rounded-2xl p-4 border border-gray-200 shadow-lg overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.backgroundEnd} 100%)`,
      }}
    >
      {/* Header */}
      <div
        className="rounded-xl p-4 text-white mb-4"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
        }}
      >
        <div className="text-lg font-bold">家計精算アプリ</div>
        <div className="text-sm opacity-80">二人暮らしの家計管理</div>
      </div>

      {/* Card */}
      <div className="bg-white/90 rounded-xl p-4 mb-4 shadow-sm">
        <div className="text-sm font-medium text-gray-700 mb-3">今月の精算</div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500 text-sm">あなたの支出</span>
          <span className="font-bold" style={{ color: colors.primary }}>
            ¥45,000
          </span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-500 text-sm">パートナーの支出</span>
          <span className="font-bold" style={{ color: colors.primaryLight }}>
            ¥38,000
          </span>
        </div>
        <div
          className="h-px my-3"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-gray-600 text-sm font-medium">精算金額</span>
          <span className="font-bold text-lg" style={{ color: colors.accent }}>
            ¥3,500
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          className="flex-1 py-2 px-4 rounded-lg text-white text-sm font-medium transition-all"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
          }}
        >
          支出を追加
        </button>
        <button
          className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all"
          style={{
            borderColor: colors.primary,
            color: colors.primary,
            backgroundColor: 'white',
          }}
        >
          履歴を見る
        </button>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors.success + '20', color: colors.success }}
        >
          完了
        </span>
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors.warning + '20', color: colors.warning }}
        >
          確認中
        </span>
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors.error + '20', color: colors.error }}
        >
          要対応
        </span>
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors.info + '20', color: colors.info }}
        >
          情報
        </span>
      </div>
    </div>
  )
}

function SchemeCard({
  schemeKey,
  scheme,
  isSelected,
  onSelect,
}: {
  schemeKey: string
  scheme: (typeof colorSchemes)[SchemeKey]
  isSelected: boolean
  onSelect: () => void
}) {
  const { colors } = scheme

  return (
    <div
      className={`rounded-2xl p-6 transition-all cursor-pointer ${
        isSelected ? 'ring-4 ring-blue-500 scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
      style={{
        background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.backgroundEnd} 100%)`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{scheme.emoji}</span>
        <div>
          <h3 className="text-lg font-bold text-gray-800">{scheme.name}</h3>
          <p className="text-sm text-gray-500">{scheme.description}</p>
        </div>
        {isSelected && (
          <span className="ml-auto px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
            選択中
          </span>
        )}
      </div>

      {/* Color Palette */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <ColorSwatch color={colors.primary} label="Primary" />
        <ColorSwatch color={colors.primaryLight} label="Primary Light" />
        <ColorSwatch color={colors.accent} label="Accent" />
        <ColorSwatch color={colors.background} label="Background" />
      </div>

      {/* Mini Preview */}
      <MockUI scheme={scheme} />
    </div>
  )
}

export default function ColorCatalogPage() {
  const [selectedScheme, setSelectedScheme] = useState<SchemeKey>('current')

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">
            🎨 カラーカタログ
          </h1>
          <p className="text-gray-600 text-lg">
            家計精算アプリのカラートーンを比較してください
          </p>
          <p className="text-gray-400 text-sm mt-2">
            カードをクリックして選択 → 下部で大きく比較
          </p>
        </div>

        {/* Color Scheme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {(Object.entries(colorSchemes) as [SchemeKey, (typeof colorSchemes)[SchemeKey]][]).map(
            ([key, scheme]) => (
              <SchemeCard
                key={key}
                schemeKey={key}
                scheme={scheme}
                isSelected={selectedScheme === key}
                onSelect={() => setSelectedScheme(key)}
              />
            )
          )}
        </div>

        {/* Full Comparison Section */}
        <div className="bg-white rounded-3xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📊 詳細比較: 現状 vs {colorSchemes[selectedScheme].emoji}{' '}
            {colorSchemes[selectedScheme].name}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current */}
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">
                💜 現状 (Purple & Gold)
              </h3>
              <MockUI scheme={colorSchemes.current} />
            </div>

            {/* Selected */}
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-4 text-center">
                {colorSchemes[selectedScheme].emoji} {colorSchemes[selectedScheme].name}
              </h3>
              <MockUI scheme={colorSchemes[selectedScheme]} />
            </div>
          </div>

          {/* Color Details Table */}
          <div className="mt-8 overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-700 mb-4">カラーコード比較</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">用途</th>
                  <th className="text-left py-2 px-3">現状</th>
                  <th className="text-left py-2 px-3">{colorSchemes[selectedScheme].name}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Primary', 'primary'],
                  ['Primary Dark', 'primaryDark'],
                  ['Primary Light', 'primaryLight'],
                  ['Accent', 'accent'],
                  ['Accent Light', 'accentLight'],
                  ['Background', 'background'],
                  ['Success', 'success'],
                  ['Warning', 'warning'],
                  ['Error', 'error'],
                  ['Info', 'info'],
                ].map(([label, key]) => (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-2 px-3 font-medium text-gray-600">{label}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-black/10"
                          style={{
                            backgroundColor:
                              colorSchemes.current.colors[
                                key as keyof (typeof colorSchemes)['current']['colors']
                              ],
                          }}
                        />
                        <span className="font-mono text-gray-500">
                          {
                            colorSchemes.current.colors[
                              key as keyof (typeof colorSchemes)['current']['colors']
                            ]
                          }
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-black/10"
                          style={{
                            backgroundColor:
                              colorSchemes[selectedScheme].colors[
                                key as keyof (typeof colorSchemes)[SchemeKey]['colors']
                              ],
                          }}
                        />
                        <span className="font-mono text-gray-500">
                          {
                            colorSchemes[selectedScheme].colors[
                              key as keyof (typeof colorSchemes)[SchemeKey]['colors']
                            ]
                          }
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p>気に入ったカラースキームがあれば教えてください。実装します。</p>
        </div>
      </div>
    </div>
  )
}
