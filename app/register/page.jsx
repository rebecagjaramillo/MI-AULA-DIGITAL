import { Suspense } from "react";
import { RegisterClient } from "./RegisterClient";
import RegisterLoading from "./loading";

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterClient />
    </Suspense>
  );
}
