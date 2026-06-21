import { Suspense } from "react";
import { LoginClient } from "./LoginClient";
import LoginLoading from "./loading";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginClient />
    </Suspense>
  );
}
