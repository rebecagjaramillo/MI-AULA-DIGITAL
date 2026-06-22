export default function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 relative overflow-hidden p-4">
      <div className="z-10 w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl animate-pulse">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-200 mb-5"></div>
          <div className="h-6 bg-slate-200 rounded mx-auto mb-2 w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded mx-auto w-full"></div>
        </div>
        <div className="space-y-4 mt-6">
          <div>
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-1.5"></div>
            <div className="h-11 bg-slate-200 rounded-xl w-full"></div>
          </div>
          <div>
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-1.5"></div>
            <div className="h-11 bg-slate-200 rounded-xl w-full"></div>
          </div>
          <div className="h-11 bg-slate-200 rounded-xl w-full mt-2"></div>
        </div>
      </div>
    </div>
  )
}
