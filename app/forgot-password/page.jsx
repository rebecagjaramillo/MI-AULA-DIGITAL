import { Suspense } from "react";
import { ForgotPasswordClient } from "./ForgotPasswordClient";
import ForgotPasswordLoading from "./loading";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordLoading />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
