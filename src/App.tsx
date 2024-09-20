import { MosaicPlayground } from "./MosaicPlayground";
import { MosaicProvider } from "./MosaicPlot";

export const App = () => {
  return (
    <MosaicProvider>
      <MosaicPlayground />
    </MosaicProvider>
  );
};
