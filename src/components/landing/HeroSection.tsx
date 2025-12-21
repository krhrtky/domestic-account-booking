import Link from 'next/link'

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-brand-primary to-brand-primary-light text-white py-20 md:py-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
          家計精算アプリ
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8">
          二人暮らしの家計管理を、もっとシンプルに
        </p>
        <p className="text-base md:text-lg text-white/80 mb-12 max-w-2xl mx-auto">
          支出を記録して、負担割合に応じた精算金額を自動計算。
          明細はいつでも確認できるので、お互いに納得できる家計管理が実現できます。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-white text-brand-primary rounded-lg font-semibold text-lg hover:bg-white/90 transition-colors shadow-lg hover:shadow-xl"
          >
            無料で始める
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-colors border-2 border-white/30"
          >
            ログイン
          </Link>
        </div>

        <p className="mt-8 text-sm text-white/70">
          参考値としてご利用ください。税務や法務については専門家にご相談ください。
        </p>
      </div>
    </section>
  )
}
