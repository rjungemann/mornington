import { AppProps } from "next/app";
import '../app/global.css';
import { GoogleAnalytics } from "@next/third-parties/google";

export default function App({ Component, pageProps }: AppProps) {
  const gaId = process.env.GA_ID
  return (
    <>
      <Component {...pageProps} />
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </>
  )
}
