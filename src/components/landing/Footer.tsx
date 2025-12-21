export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white py-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">家計精算アプリ</h2>
          <p className="text-neutral-400 mb-6">
            二人暮らしの家計管理を、もっとシンプルに
          </p>
          <p className="text-sm text-neutral-500">
            本アプリの計算結果は参考値としてご利用ください。<br />
            税務や法務に関する判断は、専門家にご相談ください。
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-neutral-800 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} 家計精算アプリ. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
