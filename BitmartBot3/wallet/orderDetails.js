require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const cancel_All_orders = require("./cancelorder");

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

const query_order_details = async (orderIdToQuery) => {
  const path = `/spot/v4/query/order`;
  const timestamp = get_timestamp();
  const body = {
    orderId: orderIdToQuery,
    queryState: "open",
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
    const orderStatus = response.data.data.state;
    // console.log(orderStatus, "Order Status");
    if (
      orderStatus === "new" ||
      orderStatus === "partially_filled" ||
      orderStatus === "partially_canceled"
    ) {
      await cancel_All_orders();
    } else if (orderStatus === "filled") {
      return response.data;
    } else if (orderStatus === "canceled") {
      console.log("Order is already canceled.");
    } else {
      console.log("Unknown order status:", orderStatus);
    }

    return response.data;
  } catch (error) {
    return true;
  }
};

module.exports = { query_order_details };
