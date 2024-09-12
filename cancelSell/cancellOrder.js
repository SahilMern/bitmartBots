require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");

const API_KEY = process.env.API_KEY_3;
const API_SECRET = process.env.API_SECRET_3;
const API_MEMO = process.env.API_MEMO_3;
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

//TODO: Cancel specific order by order_id
const cancel_Sell_Order = async (order_id) => {
  const path = `/spot/v3/cancel_order`;
  const timestamp = get_timestamp();

  const body = {
    symbol: "BTC_USDT",  // Change the symbol accordingly
    order_id: order_id,  // Using the provided order_id
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
    // console.log("Order canceled:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error canceling the order --", error.response.data);
  }
};

module.exports = cancel_Sell_Order;
