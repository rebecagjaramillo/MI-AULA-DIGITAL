export default function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 relative overflow-hidden">
      <div className="z-10 w-full max-w-md p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl animate-pulse">
        <div className="h-8 bg-slate-800 rounded mx-auto mb-2 w-3/4"></div>
        <div className="h-4 bg-slate-800 rounded mx-auto mb-8 w-5/6"></div>
        <div className="space-y-5">
          <div>
            <div className="h-4 bg-slate-800 rounded w-1/3 mb-1.5"></div>
            <div className="h-12 bg-slate-800 rounded-xl w-full"></div>
          </div>
          <div>
            <div className="h-4 bg-slate-800 rounded w-1/3 mb-1.5"></div>
            <div className="h-12 bg-slate-800 rounded-xl w-full"></div>
          </div>
          <div className="h-12 bg-slate-800 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  )
}
