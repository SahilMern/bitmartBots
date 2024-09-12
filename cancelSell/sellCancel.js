console.log("JAI SHREE RAM / JAI BAJARANG BALI");
require("dotenv").config({ path: "../.env" });
const axios = require("axios");
const crypto = require("crypto");
const colors = require("colors");
const cancel_All_orders = require("./cancelorder");
const { query_order_details } = require("./querySellCancel");

//?Credentials
const API_KEY = process.env.API_KEY_3;
const API_SECRET = process.env.API_SECRET_3;
const API_MEMO = process.env.API_MEMO_3;
const BASE_URL = process.env.BASE_URL;

//?RANDOM NUMBER FOR DOLLOR
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//?USED FOR RANDOM PRICE FOR BUY AND SELLING
function randomPrice(min, max) {
  return Math.random() * (max - min) + min;
}

//? Get current timestamp FOR Signature
function get_timestamp() {
  return new Date().getTime().toString();
}

//? Generate signature
function generate_signature(timestamp, body) {
  const message = `${timestamp}#${API_MEMO}#${body}`;
  return crypto.createHmac("sha256", API_SECRET).update(message).digest("hex");
}

//TODO:-- PLACE ORDER MAIN PROCESS
async function place_order(side, symbol, size, price) {
  console.log(side, symbol, size, price, "Current Order Details");
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
    // console.log(response.data);
    return response.data;
  } catch (error) {
    console.error(error.response.data, "Error in place Order".red);
  }
}

const sellCancel = async () => {
  while (true) {
    try {
      const response = await axios.get(
        `https://api-cloud.bitmart.com/spot/quotation/v3/ticker?symbol=DEOD_USDT`
      );
      const bestBidPrice = response.data.data; //?Api Data

      const sellingPrice = parseFloat(bestBidPrice.ask_px); //?Selling Price
      const buyingPrice = parseFloat(bestBidPrice.bid_px); //?Buying Price

      //!Finding Diffrence
      const differencePriceRange = parseFloat(
        (sellingPrice - buyingPrice).toFixed(6)
      );

      if (differencePriceRange > 0.000005) {
        let sizeforBuy;
        let buyDeodPrice;
        const randomUsdtPrice = await randomNumber(6, 9);
        // console.log(randomUsdtPrice, "randomUsdtPrice");

        const size = Math.floor(randomUsdtPrice / sellingPrice);
        sizeforBuy = size;
        const finalPrice = sellingPrice + 0.00002;
        const selldetails = await place_order(
          "sell",
          "DEOD_USDT",
          size,
          finalPrice
        );

        // console.log(selldetails.message, "Sell order details");

        const sellOrderIdToQuery = selldetails.data.order_id;

        //TODO:-  Checking status
        await query_order_details(
          sellOrderIdToQuery,
          "Sell",
          API_KEY,
          API_SECRET,
          API_MEMO
        );
      } else {
        console.log("Price Range is Low".red);
      }

      const delay = randomNumber(3, 4) * 1000;
      console.log(
        `----Next Order After ${delay}, Make some patience---`.bgYellow
      );

      // TODO:- WAITING
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.error(error, "Error In Main".underline.red);
      await cancel_All_orders();
    }
  }
};

// main();
module.exports = sellCancel;
