const Token = artifacts.require('Token')
const Dex = artifacts.require('Dex')

require('chai')
  .use(require('chai-as-promised'))
  .should()

function tokens(n) {
  return web3.utils.toWei(n, 'ether');
}

contract('Dex', ([deployer, investor]) => {
  let token, dex

  before(async () => {
    token = await Token.new()
    dex = await Dex.new(token.address)
    // Transfer all tokens to Dex (1 million)
    await token.transfer(dex.address, tokens('1000000'))
  })

  describe('Token deployment', async () => {
    it('contract has a name', async () => {
      const name = await token.name()
      assert.equal(name, 'BCT Token')
    })
  })

  describe('Dex deployment', async () => {
    it('contract has a name', async () => {
      const name = await dex.name()
      assert.equal(name, 'Cryptocurrency Exchange')
    })

    it('contract has tokens', async () => {
      let balance = await token.balanceOf(dex.address)
      assert.equal(balance.toString(), tokens('1000000'))
    })
  })

  describe('buyTokens()', async () => {
    let result

    before(async () => {
      // Purchase tokens before each example
      result = await dex.buyTokens({ from: investor, value: web3.utils.toWei('1', 'ether')})
    })

    it('Allows user to instantly purchase tokens from dex for a fixed price', async () => {
      // Check investor token balance after purchase
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('100'))

      // Check dex balance after purchase
      let dexBalance
      dexBalance = await token.balanceOf(dex.address)
      assert.equal(dexBalance.toString(), tokens('999900'))
      dexBalance = await web3.eth.getBalance(dex.address)
      assert.equal(dexBalance.toString(), web3.utils.toWei('1', 'Ether'))

      // Check logs to ensure event was emitted with correct data
      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')
    })
  })

  describe('sellTokens()', async () => {
    let result

    before(async () => {
      // Investor must approve tokens before the purchase
      await token.approve(dex.address, tokens('100'), { from: investor })
      // Investor sells tokens
      result = await dex.sellTokens(tokens('100'), { from: investor })
    })

    it('Allows user to instantly sell tokens to dex for a fixed price', async () => {
      // Check investor token balance after purchase
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('0'))

      // Check dex balance after purchase
      let dexBalance
      dexBalance = await token.balanceOf(dex.address)
      assert.equal(dexBalance.toString(), tokens('1000000'))
      dexBalance = await web3.eth.getBalance(dex.address)
      assert.equal(dexBalance.toString(), web3.utils.toWei('0', 'Ether'))

      // Check logs to ensure event was emitted with correct data
      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')

      // FAILURE: investor can't sell more tokens than they have
      await dex.sellTokens(tokens('500'), { from: investor }).should.be.rejected;
    })
  })

})
