/** @notice Local imports */
import { ERC20 } from "@/core/ERC20";
import { JsonRpcProvider } from "ethers";
import { Random } from "./core/Random";

const ERC20_ADDRESS = "0x9244212403a2E827cAdCa1f6fb68B43bc0C7A41F";
const provider = new JsonRpcProvider(
  "https://data-seed-prebsc-1-s1.binance.org:8545"
);

const erc20 = new ERC20(ERC20_ADDRESS, provider);
const random = new Random(erc20);

await random.start();
await erc20.start();
