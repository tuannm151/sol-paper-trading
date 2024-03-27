import { useTheme } from "@/components/theme-provider";
import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Token = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { theme } = useTheme();
  const { address } = useParams();
  const navigate = useNavigate();

  if (!address) {
    navigate("/");
  }

  return (
    <div id="dexscreener-embed" className={"w-full h-screen overflow-hidden"}>
      <iframe
        ref={iframeRef}
        className={"w-full h-[calc(100vh+32px)]"}
        src={`https://dexscreener.com/solana/${address}?embed=1&theme=${theme}`}
      ></iframe>
    </div>
  );
};

export default Token;
