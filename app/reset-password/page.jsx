import { Suspense } from "react";
import { ResetPasswordClient } from "./ResetPasswordClient";
import ResetPasswordLoading from "./loading";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordClient />
    </Suspense>
  );
}
