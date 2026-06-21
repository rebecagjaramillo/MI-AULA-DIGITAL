export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden p-4">
      <div className="relative z-10 w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-pulse">
        <div className="h-1.5 w-full bg-slate-200"></div>
        <div className="p-8 sm:p-12">
          <div className="w-14 h-14 rounded-2xl bg-slate-200 mb-6"></div>
          <div className="h-8 bg-slate-200 rounded mb-2 w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded mb-8 w-2/3"></div>
          <div className="space-y-5">
             <div className="h-11 bg-slate-200 rounded-md w-full"></div>
             <div className="h-11 bg-slate-200 rounded-md w-full"></div>
             <div className="h-11 bg-slate-200 rounded-md w-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
