import { Suspense } from "react";
import { OnboardingClient } from "./OnboardingClient";
import OnboardingLoading from "./loading";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingClient />
    </Suspense>
  );
}
