const Token = artifacts.require("Token");
const Dex = artifacts.require("Dex");

module.exports = async function(deployer) {
  // Deploy Token
  await deployer.deploy(Token);
  const token = await Token.deployed()

  // Deploy Dex
  await deployer.deploy(Dex, token.address);
  const dex = await Dex.deployed()

  // Transfer all tokens to Dex (1 million)
  await token.transfer(dex.address, '1000000000000000000000000')
};
