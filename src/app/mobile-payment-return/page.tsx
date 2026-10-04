import ReturnToApp from "./ReturnToApp";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function MobilePaymentReturnPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawReturnTo = typeof params.returnTo === "string" ? params.returnTo : "";
  const reference = typeof params.reference === "string"
    ? params.reference
    : typeof params.trxref === "string"
      ? params.trxref
      : "";

  const returnUrl = buildSafeReturnUrl(rawReturnTo, reference);
  if (!returnUrl) {
    return (
      <main className="login-page">
        <p className="design-eyebrow">ÈRÈ FÍDÍÒ</p>
        <h1>Return link unavailable.</h1>
        <p>Open Expo Go again. Your Paystack payment reference has not been changed.</p>
      </main>
    );
  }

  return <ReturnToApp returnUrl={returnUrl} />;
}

function buildSafeReturnUrl(rawReturnTo: string, reference: string) {
  try {
    const url = new URL(rawReturnTo);
    const isExpoTunnel = url.protocol === "exp:" && url.hostname.endsWith(".exp.direct");
    const isNativeApp = url.protocol === "erefidio:";
    if (!reference || (!isExpoTunnel && !isNativeApp)) return null;
    url.searchParams.set("reference", reference);
    return url.toString();
  } catch {
    return null;
  }
}
