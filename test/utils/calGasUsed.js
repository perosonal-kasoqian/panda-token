// cal gas used in translation
async function calGasUsed(txFunc, ...arg) {
    const tx = await txFunc(...arg);
    const txCal = await tx.wait();
  
    const gasUsed = txCal.cumulativeGasUsed.mul(txCal.effectiveGasPrice);
  
    return gasUsed;
  }
  
  module.exports = calGasUsed;