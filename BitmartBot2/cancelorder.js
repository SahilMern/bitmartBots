require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const BASE_URL = process.env.BASE_URL;

//!Credentials
const symbol = "DEOD_USDT";
const API_KEY = process.env.API_KEY_2;
const API_SECRET = process.env.API_SECRET_2;
const API_MEMO = process.env.API_MEMO_2;

//?GET TIMESTAMP
function get_timestamp() {
  return new Date().getTime().toString();
}

//?GENRATING SIGNATURE
function generate_signature(timestamp, body) {
  const message = `${timestamp}#${API_MEMO}#${body}`;
  return crypto.createHmac("sha256", API_SECRET).update(message).digest("hex");
}

//TODO:-  CANCEL ALL ORDERS
async function cancel_All_orders() {
  const path = "/spot/v4/cancel_all";
  const timestamp = get_timestamp();
  const body = {
    symbol: symbol,
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
    console.error("Error cancelling orders --", error.response.data);
  }
}

module.exports = cancel_All_orders;
