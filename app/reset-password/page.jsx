import { Suspense } from "react";
import { ResetPasswordClient } from "./ResetPasswordClient";
import ResetPasswordLoading from "./loading";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordClient />
      </Suspense>
    </div>
  );
}
