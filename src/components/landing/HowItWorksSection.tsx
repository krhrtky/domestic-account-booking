export default function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      title: 'アカウント登録',
      description: 'メールアドレスとパスワードで無料登録'
    },
    {
      number: '2',
      title: '支出を記録',
      description: 'CSVファイルのアップロードまたは手動入力で支出を登録'
    },
    {
      number: '3',
      title: '精算結果を確認',
      description: '負担割合に応じた精算金額が自動で計算されます'
    }
  ]

  return (
    <section className="py-16 md:py-24 bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-neutral-900 mb-12">
          使い方
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-brand-primary text-white font-bold text-xl flex items-center justify-center mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-neutral-600">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-brand-primary/20">
                  <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary/40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
