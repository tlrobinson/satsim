import Head from "next/head";
import dynamic from "next/dynamic";

const SatSim = dynamic(() => import("../components/SatSim"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>SatSim</title>
      </Head>
      <main>{process.browser && <SatSim />}</main>
    </div>
  );
}
