const { main1 } = require("./BitmartBot1");
const { setDeod1 } = require("./BitmartBot1/wallet/setDeod");
const { setUsdt1 } = require("./BitmartBot1/wallet/setUsdt");
const { main2 } = require("./BitmartBot2");
const { setDeod2 } = require("./BitmartBot2/wallet/setDeod");
const { setUsdt2 } = require("./BitmartBot2/wallet/setUsdt");
const sellCancel = require("./cancelSell/sellCancel");


(async () => {
  try {
    //Bot Run 1 And 2
    main1();
    main2();

    //Set Balance for 1
    setDeod1();
    setUsdt1();

    setDeod2();
    setUsdt2();

    sellCancel()

  } catch (error) {
    console.log(error);
  }
})();
