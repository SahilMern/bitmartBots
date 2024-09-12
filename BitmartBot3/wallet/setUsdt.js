console.log("JAI SHREE RAM / JAI BAJARANG BALI");
require("dotenv").config({ path: "../../.env" });
const axios = require("axios");
const crypto = require("crypto");
var colors = require("colors");
const { query_order_details } = require("./orderDetails");

// Get current timestamp
function get_timestamp() {
  return new Date().getTime().toString();
}

// Credentials from environment variables
const API_KEY = process.env.API_KEY_3;
const API_SECRET = process.env.API_SECRET_3;
const API_MEMO = process.env.API_MEMO_3;
const BASE_URL = process.env.BASE_URL;

//? Generate signature for authenticated requests
function generate_signature(timestamp, body) {
  const message = `${timestamp}#${API_MEMO}#${body}`;
  return crypto.createHmac("sha256", API_SECRET).update(message).digest("hex");
}

// Place an order on the BitMart API
async function place_order(side, symbol, size, price) {
  console.log(side, symbol, size, price);
  const path = "/spot/v2/submit_order";
  const timestamp = get_timestamp();
  const body = {
    size: size,
    price: price,
    side: side,
    symbol: symbol,
    type: "limit",
  };
  const headers = {
    "Content-Type": "application/json",
    "X-BM-KEY": API_KEY,
    "X-BM-TIMESTAMP": timestamp,
    "X-BM-SIGN": generate_signature(timestamp, JSON.stringify(body)),
  };
  const url = BASE_URL + path;
  try {
    const response = await axios.post(url, body, { headers });
    return response.data;
  } catch (error) {
    console.log(error, "error");
    console.error("Error --", error.response.data);
  }
}

//? Fetch the current Buying price of DEOD
const getCurrentSellingPrice = async () => {
  try {
    const response = await axios.get(
      `${process.env.BASE_URL}/spot/quotation/v3/ticker?symbol=DEOD_USDT`
    );
    const bestBidPrice = response.data.data; //?Api Data
    const buyingPrice = parseFloat(bestBidPrice.bid_px); //?Buying Price
    return buyingPrice;
  } catch (error) {
    console.error("Error fetching current price:", error);
  }
};

const getUserWalletDetails = async () => {
  try {
    const response = await axios.get(
      "https://api-cloud.bitmart.com/account/v1/wallet",
      {
        headers: {
          "X-BM-KEY": API_KEY, // Use the actual API key from environment variable
          "X-BM-SIGN": generate_signature(get_timestamp(), ""), // Generate actual signature
          "X-BM-TIMESTAMP": get_timestamp(), // Use actual timestamp
        },
      }
    );

    const wallet = response.data.data.wallet;
    const usdtWallet = wallet.find((elem) => elem.currency === "USDT");
    const deodWallet = wallet.find((elem) => elem.currency === "DEOD");
    const usdtBalance = parseFloat(usdtWallet.available);
    const deodBalance = parseFloat(deodWallet.available);

    const deodBuyingPrice = await getCurrentSellingPrice();
    const sizeForSell = parseFloat((8 / deodBuyingPrice).toFixed(0));

    console.log(
      `My DEOD Balance ${deodBalance} And USDT Balanace ${usdtBalance} ----- Size requird ${sizeForSell}`
        .yellow
    );

    if (usdtBalance < 10) {
      if (deodBalance > sizeForSell) {
        const selldetails = await place_order(
          "sell",
          "DEOD_USDT",
          sizeForSell,
          deodBuyingPrice
        );
        const sellOrderIdToQuery = selldetails.data.order_id;
        await query_order_details(sellOrderIdToQuery);
      } else {
        console.log("You Dont Have DEOD AND USDT".red);
      }
    } else {
      console.log("You have sufficient USDT");
    }
  } catch (error) {
    console.error("Error fetching wallet details:", error);
  }
};

const setUsdt = async () => {
  while (true) {
    await getUserWalletDetails();
    console.log(`USER USDT WALLET BALANCING CHECKING AFTER 5 MIN`.underline);
    await new Promise((resolve) => setTimeout(resolve, 30000));
  }
};

setUsdt();
