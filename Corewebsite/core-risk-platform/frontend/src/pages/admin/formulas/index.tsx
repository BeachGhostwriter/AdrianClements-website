import { AppLayout } from '../../../components/layout/AppLayout'
export default function Page() {
  return (
    <AppLayout>
      <div className="card p-8 text-center text-gray-500">
        <p className="text-lg font-semibold text-gray-700 mb-2">Formula Reference</p>
        <p className="text-sm">Scaffolded — ready for Phase 2 implementation.</p>
        <p className="text-xs mt-2 text-gray-400">Route: /admin/formulas</p>
      </div>
    </AppLayout>
  )
}
