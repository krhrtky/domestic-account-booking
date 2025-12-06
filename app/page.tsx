export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Household Settlement</h1>
          <p className="text-gray-600 mb-8">
            家計・立替精算アプリ MVP
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">プロジェクトステータス</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Next.js 15 + TypeScript セットアップ完了
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Tailwind CSS 設定完了
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              精算ロジック実装 (13/13 tests passing)
            </li>
            <li className="flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              CSV パーサー実装完了
            </li>
            <li className="flex items-center">
              <span className="text-gray-400 mr-2">○</span>
              Supabase 統合 (保留中)
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>次のステップ:</strong> Supabase プロジェクトを作成し、
            .env.local に接続情報を設定してください。
          </p>
        </div>
      </div>
    </main>
  )
}
