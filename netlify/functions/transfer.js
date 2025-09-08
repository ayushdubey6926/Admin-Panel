const { ethers } = require("ethers");

exports.handler = async (event) => {
  try {
    const { fromAddress, recipientAddress, amount } = JSON.parse(event.body || "{}");
    if (!fromAddress || !recipientAddress || !amount) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC || "https://bsc-dataseed.binance.org/");
    const signer = new ethers.Wallet(process.env.COMPANY_WALLET_PRIVATE_KEY, provider);

    const usdtAbi = [
      "function transferFrom(address,address,uint256) returns (bool)",
      "function allowance(address,address) view returns (uint256)",
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)"
    ];
    const usdt = new ethers.Contract(process.env.USDT_ADDRESS, usdtAbi, signer);

    const decimals = await usdt.decimals();
    const value = ethers.utils.parseUnits(amount.toString(), decimals);

    // helpful debug logs
    const allowance = await usdt.allowance(fromAddress, signer.address);
    const balance   = await usdt.balanceOf(fromAddress);
    console.log("From:", fromAddress);
    console.log("Spender:", signer.address);
    console.log("Allowance:", ethers.utils.formatUnits(allowance, decimals));
    console.log("Balance:", ethers.utils.formatUnits(balance, decimals));

    if (allowance.lt(value)) throw new Error(`Allowance too low`);
    if (balance.lt(value)) throw new Error(`Balance too low`);

    const tx = await usdt.transferFrom(fromAddress, recipientAddress, value);
    await tx.wait();

    return { statusCode: 200, body: JSON.stringify({ hash: tx.hash }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
