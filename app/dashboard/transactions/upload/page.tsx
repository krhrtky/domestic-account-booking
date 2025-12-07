import CSVUploadForm from '@/components/transactions/CSVUploadForm'
import Link from 'next/link'

export default function UploadTransactionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/transactions"
            className="text-blue-600 hover:text-blue-700"
          >
            &larr; Back to Transactions
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Upload CSV</h1>
          <CSVUploadForm />
        </div>
      </div>
    </div>
  )
}
