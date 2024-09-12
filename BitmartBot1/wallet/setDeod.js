console.log("JAI SHREE RAM / JAI BAJARANG BALI");
require("dotenv").config({ path:"../../.env" });
const axios = require("axios");
const crypto = require("crypto");
const { query_order_details } = require("./orderDetails");
let colors = require('colors');

//? Credentials from environment variables
const API_KEY = process.env.API_KEY_1;
const API_SECRET = process.env.API_SECRET_1;
const API_MEMO = process.env.API_MEMO_1;
const BASE_URL = process.env.BASE_URL;

//? Get current timestamp
function get_timestamp() {
  return new Date().getTime().toString();
}

//? Generate signature
function generate_signature(timestamp, body) {
  const message = `${timestamp}#${API_MEMO}#${body}`;
  return crypto.createHmac("sha256", API_SECRET).update(message).digest("hex");
}

const getCurrentSellingPrice = async () => {
  try {
    const response = await axios.get(
      `${process.env.BASE_URL}/spot/quotation/v3/ticker?symbol=DEOD_USDT`
    );
    const bestBidPrice = response.data.data; //?Api Data
    const sellingPrice = parseFloat(bestBidPrice.ask_px); //?Selling Price
    return sellingPrice;
  } catch (error) {
    console.error("Error fetching current price:", error);
  }
};

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
    console.error("Error --", error.response.data);
  }
}

//?USER WALLET DETAILS
const getUserWalletDetails = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/account/v1/wallet`, {
      headers: {
        "X-BM-KEY": API_KEY,
        "X-BM-SIGN": generate_signature(get_timestamp(), ""),
        "X-BM-TIMESTAMP": get_timestamp(),
      },
    });

    const wallet = response.data.data.wallet;
    const usdtWallet = wallet.find((elem) => elem.currency === "USDT");
    const deodWallet = wallet.find((elem) => elem.currency === "DEOD");
    const usdtBalance = parseFloat(usdtWallet.available);
    const deodBalance = parseFloat(deodWallet.available);

    const deodBuyingPrice = await getCurrentSellingPrice();
    const SizeOFDeod = parseFloat((6 / deodBuyingPrice).toFixed(0));

    console.log(`My DEOD Balance ${deodBalance} And USDT Balanace ${usdtBalance} ----- Size requird ${SizeOFDeod}`.yellow);
    
    if (deodBalance < SizeOFDeod) {
      if (usdtBalance > 20) {
        const buydetails = await place_order(
          "buy",
          "DEOD_USDT",
          SizeOFDeod,
          deodBuyingPrice
        );
        const buyOrderIdToQuery = buydetails.data.order_id;
        await query_order_details(buyOrderIdToQuery, "BUY");
      } else {
        console.log("Insufficeint Fund DEOD And USDT");
      }
    } else {
      console.log("You have sufficient Deod");
    }
  } catch (error) {
    console.error("Error fetching wallet details:", error);
  }
};

const setDeod1 = async () => {
  while (true) {
    await getUserWalletDetails();
    console.log(`USER DEOD WALLET BALANCING CHECKING AFTER 5 MIN`.underline);
    await new Promise((resolve) => setTimeout(resolve, 300000)); //? 5 Min
  }
};

// setDeod();
module.exports = {setDeod1}

//! Note:- ISME USDT AND DEOD CHECK HOGA PAHLE AGAR DEOD KAM HUA TO USDT DEKE LEGA OR USDT BHI NAHI HUA TO ERROR DEGA MAIN AIM YE HAI KI DEOD KO BALANCE RAKHNA USDT SELL KARKE