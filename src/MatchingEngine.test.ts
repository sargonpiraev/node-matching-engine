import assert from 'node:assert'
import {MatchingEngine} from './MatchingEngine'
import {randomUUID} from 'node:crypto'
import {Order, OrderSide, Trade} from './types'

describe('MarchingEngine Tests', () => {

  test(`
    given
      there are no orders
    when
      new order added
    then
      no trade should happen and
      order should be added to orders
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const order: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 1, time: 1}
    // act
    const result = matchingEngine.addOrder(order)
    // assert
    assert.deepEqual(result, [])
    assert.strictEqual(matchingEngine.bids.length, 1)
  })

  test(`
    given
      there is one bid order
    when
      new bid order added
    then
      no trade should happen and
      order should be added to bids
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const bidOrder1: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 1, time: 1}
    const bidOrder2: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 1, time: 1}
    matchingEngine.addOrder(bidOrder1)
    // act
    const result = matchingEngine.addOrder(bidOrder2)
    // assert
    assert.deepEqual(result, [])
    assert.strictEqual(matchingEngine.bids.length, 2)
  })

  test(`
    given
      there is one ask order
    when
      new ask order added
    then
      no trade should happen and
      order should be added to asks
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const askOrder1: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 1, time: 1}
    const askOrder2: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 1, time: 1}
    matchingEngine.addOrder(askOrder1)
    // act
    const result = matchingEngine.addOrder(askOrder2)
    // assert
    assert.deepEqual(result, [])
    assert.strictEqual(matchingEngine.asks.length, 2)
  })

  test(`
    given
      there is one bid order
    when
      new ask order added and
      new ask order price is bigger bid order price
    then
      trade should not happen and
      new ask order should be added to orders
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const bidOrder: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 1, time: 1}
    const askOrder: Order = {id: randomUUID(), side: OrderSide.ASK, price: 2, quantity: 1, time: 1}
    matchingEngine.addOrder(bidOrder)
    // act
    const result = matchingEngine.addOrder(askOrder)
    // assert
    assert.deepEqual(result, [])
    assert.strictEqual(matchingEngine.bids.length, 1)
    assert.strictEqual(matchingEngine.asks.length, 1)
  })

  test(`
    given
      there is one bid order
    when
      new ask order added and
      new ask order price and bid order price are same
    then
      trade should happen and
      trade price should be bid order price and
      no order should be in orders in the end
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const bidOrder: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 1, time: 1}
    const askOrder: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 1, time: 1}
    matchingEngine.addOrder(bidOrder)
    // act
    const result = matchingEngine.addOrder(askOrder)
    // assert
    const trade: Trade = {bidOrderId: bidOrder.id, askOrderId: askOrder.id, price: 1, quantity: 1}
    assert.deepEqual(result, [trade])
    assert.strictEqual(matchingEngine.bids.length, 0)
    assert.strictEqual(matchingEngine.asks.length, 0)
  })

  test(`
    given
      there is one bid order
    when
      new ask order added and
      new ask order price is less than bid order price
    then
      trade should happen and
      trade price should be bid order price and
      no order should be in orders in the end
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const bidOrder: Order = {id: randomUUID(), side: OrderSide.BID, price: 2, quantity: 1, time: 1}
    const askOrder: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 1, time: 1}
    matchingEngine.addOrder(bidOrder)
    // act
    const result = matchingEngine.addOrder(askOrder)
    // assert
    const trade: Trade = {
      bidOrderId: bidOrder.id,
      askOrderId: askOrder.id,
      price: bidOrder.price,
      quantity: 1,
    }
    assert.deepEqual(result, [trade])
    assert.strictEqual(matchingEngine.bids.length, 0)
    assert.strictEqual(matchingEngine.asks.length, 0)
  })

  test(`
    given
      there are two bid orders and
      one bid order price is higher
    when
      new ask order added and
      new ask order price greater than highest bid order price
    then
      trade should happen and
      price should be the highest bid order price and
      bid order with less price should be in orders in the end
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const bidOrderMinPrice: Order = {
      id: randomUUID(),
      side: OrderSide.BID,
      price: 1,
      quantity: 1,
      time: 1
    }
    const bidOrderMaxPrice: Order = {
      id: randomUUID(),
      side: OrderSide.BID,
      price: 2,
      quantity: 1,
      time: 1
    }
    const askOrder: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 1, time: 1}
    matchingEngine.addOrder(bidOrderMinPrice)
    matchingEngine.addOrder(bidOrderMaxPrice)
    // act
    const result = matchingEngine.addOrder(askOrder)
    // assert
    const trade: Trade = {
      bidOrderId: bidOrderMaxPrice.id,
      askOrderId: askOrder.id,
      price: bidOrderMaxPrice.price,
      quantity: 1,
    }
    assert.deepEqual(result, [trade])
    assert.strictEqual(matchingEngine.bids.length, 1)
    assert.strictEqual(matchingEngine.asks.length, 0)
  })

  test(`
    given
      there are two bid orders and
      bid orders have same price and
      one bid order was added before the another
    when
      new ask order added and
      new ask order price greater than highest bid order price
    then
      trade should happen and
      price should be the highest bid order price and
      bid order created earlier should be matched and
      bid order created later should be in orders in the end
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const bidOrderOldest: Order = {
      id: randomUUID(),
      side: OrderSide.BID,
      price: 1,
      quantity: 1,
      time: 1
    }
    const bidOrderRecent: Order = {
      id: randomUUID(),
      side: OrderSide.BID,
      price: 1,
      quantity: 1,
      time: 2
    }
    matchingEngine.addOrder(bidOrderOldest)
    matchingEngine.addOrder(bidOrderRecent)
    const askOrder: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 1, time: 1}
    // act
    const result = matchingEngine.addOrder(askOrder)
    // assert
    const trade: Trade = {
      bidOrderId: bidOrderOldest.id,
      askOrderId: askOrder.id,
      price: bidOrderOldest.price,
      quantity: 1,
    }
    assert.deepEqual(result, [trade])
    assert.strictEqual(matchingEngine.bids.length, 1)
    assert.strictEqual(matchingEngine.asks.length, 0)
  })

  test(`
    given
      there are two ask orders and
      one ask order price is higher
    when
      new bid order added and
      new bid order price less than highest ask order price
    then
      trade should happen and
      price should be the bid order price and
      ask order with highest price should be in orders in the end
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const askOrderLowestPrice: Order = {
      id: randomUUID(),
      side: OrderSide.ASK,
      price: 1,
      quantity: 1,
      time: 1
    }
    const askOrderBigestPrice: Order = {
      id: randomUUID(),
      side: OrderSide.ASK,
      price: 2,
      quantity: 1,
      time: 1
    }
    const bidOrder: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 1, time: 1}
    matchingEngine.addOrder(askOrderLowestPrice)
    matchingEngine.addOrder(askOrderBigestPrice)
    // act
    const result = matchingEngine.addOrder(bidOrder)
    // assert
    const trade: Trade = {
      bidOrderId: bidOrder.id,
      askOrderId: askOrderLowestPrice.id,
      price: bidOrder.price,
      quantity: 1,
    }
    assert.deepEqual(result, [trade])
    assert.strictEqual(matchingEngine.asks.length, 1)
    assert.strictEqual(matchingEngine.bids.length, 0)
  })

  test(`
    given
      there are two ask orders and
      ask orders have same price and
      one ask order was added before the another
    when
      new bid order added and
      new bid order price less than highest ask order price
    then
      trade should happen and
      price should be the bid order price and
      ask order created earlier should be matched and
      ask order created later should be in orders in the end
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const askOrderOldest: Order = {
      id: randomUUID(),
      side: OrderSide.ASK,
      price: 1,
      quantity: 1,
      time: 1
    }
    const askOrderRecent: Order = {
      id: randomUUID(),
      side: OrderSide.ASK,
      price: 1,
      quantity: 1,
      time: 2
    }
    matchingEngine.addOrder(askOrderOldest)
    matchingEngine.addOrder(askOrderRecent)
    const bidOrder: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 1, time: 1}
    // act
    const result = matchingEngine.addOrder(bidOrder)
    // assert
    const trade: Trade = {
      bidOrderId: bidOrder.id,
      askOrderId: askOrderOldest.id,
      price: bidOrder.price,
      quantity: 1,
    }
    assert.deepEqual(result, [trade])
    assert.strictEqual(matchingEngine.bids.length, 0)
    assert.strictEqual(matchingEngine.asks.length, 1)
  })

  test(`
    given
      there is one bid order with quantity 10
    when
      new ask order added with quantity 5 and
      ask order price matches bid order price
    then
      trade should happen for quantity 5 and
      remaining quantity of bid order should be 5
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const bidOrder: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 10, time: 1}
    const askOrder: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 5, time: 1}
    matchingEngine.addOrder(bidOrder)
    // act
    const result = matchingEngine.addOrder(askOrder)
    // assert
    const trade: Trade = {bidOrderId: bidOrder.id, askOrderId: askOrder.id, price: 1, quantity: 5}
    assert.deepEqual(result, [trade])
    assert.strictEqual(matchingEngine.bids.length, 1)
    assert.strictEqual(matchingEngine.asks.length, 0)
    assert.strictEqual(matchingEngine.bids[0].quantity, 5)
  })

  test(`
    given
      there is one ask order with quantity 10
    when
      new bid order added with quantity 5 and
      bid order price matches ask order price
    then
      trade should happen for quantity 5 and
      remaining quantity of ask order should be 5
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const askOrder: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 10, time: 1}
    const bidOrder: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 5, time: 1}
    matchingEngine.addOrder(askOrder)
    // act
    const result = matchingEngine.addOrder(bidOrder)
    // assert
    const trade: Trade = {bidOrderId: bidOrder.id, askOrderId: askOrder.id, price: 1, quantity: 5}
    assert.deepEqual(result, [trade])
    assert.strictEqual(matchingEngine.asks.length, 1)
    assert.strictEqual(matchingEngine.bids.length, 0)
    assert.strictEqual(matchingEngine.asks[0].quantity, 5)
  })

  test(`
    given
      there is one bid order with quantity 5
    when
      new ask order added with quantity 10 and
      ask order price matches bid order price
    then
      trade should happen for quantity 5 and
      remaining quantity of ask order should be 5
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const bidOrder: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 5, time: 1}
    const askOrder: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 10, time: 1}
    matchingEngine.addOrder(bidOrder)
    // act
    const result = matchingEngine.addOrder(askOrder)
    // assert
    const trade: Trade = {bidOrderId: bidOrder.id, askOrderId: askOrder.id, price: 1, quantity: 5}
    assert.deepEqual(result, [trade])
    assert.strictEqual(matchingEngine.bids.length, 0)
    assert.strictEqual(matchingEngine.asks.length, 1)
    assert.strictEqual(matchingEngine.asks[0].quantity, 5)
  })

  test(`
    given
      there are two bid orders with quantities 5 and 10 respectively
    when
      new ask order added with quantity 12 and
      ask order price matches bid order prices
    then
      trade should happen for quantity 12 and
      first bid order should fully execute and
      second bid order should have remaining quantity 3
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const bidOrder1: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 5, time: 1}
    const bidOrder2: Order = {
      id: randomUUID(),
      side: OrderSide.BID,
      price: 1,
      quantity: 10,
      time: 1
    }
    const askOrder: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 12, time: 1}
    matchingEngine.addOrder(bidOrder1)
    matchingEngine.addOrder(bidOrder2)
    // act
    const result = matchingEngine.addOrder(askOrder)
    // assert
    const trade1: Trade = {
      bidOrderId: bidOrder1.id,
      askOrderId: askOrder.id,
      price: 1,
      quantity: 5,
    }
    const trade2: Trade = {
      bidOrderId: bidOrder2.id,
      askOrderId: askOrder.id,
      price: 1,
      quantity: 7,
    }
    assert.deepEqual(result, [trade1, trade2])
    assert.strictEqual(matchingEngine.bids.length, 1)
    assert.strictEqual(matchingEngine.bids[0].quantity, 3)
  })

  test(`
    given
      there are two ask orders with quantities 5 and 10 respectively
    when
      new bid order added with quantity 12 and
      bid order price matches ask order prices
    then
      trade should happen for quantity 12 and
      first ask order should fully execute and
      second ask order should have remaining quantity 3
  `, () => {
    //assign
    const matchingEngine = new MatchingEngine()
    const askOrder1: Order = {id: randomUUID(), side: OrderSide.ASK, price: 1, quantity: 5, time: 1}
    const askOrder2: Order = {
      id: randomUUID(),
      side: OrderSide.ASK,
      price: 1,
      quantity: 10,
      time: 1
    }
    const bidOrder: Order = {id: randomUUID(), side: OrderSide.BID, price: 1, quantity: 12, time: 1}
    matchingEngine.addOrder(askOrder1)
    matchingEngine.addOrder(askOrder2)
    // act
    const result = matchingEngine.addOrder(bidOrder)
    // assert
    const trade1: Trade = {
      bidOrderId: bidOrder.id,
      askOrderId: askOrder1.id,
      price: 1,
      quantity: 5,
    }
    const trade2: Trade = {
      bidOrderId: bidOrder.id,
      askOrderId: askOrder2.id,
      price: 1,
      quantity: 7,
    }
    assert.deepEqual(result, [trade1, trade2])
    assert.strictEqual(matchingEngine.asks.length, 1)
    assert.strictEqual(matchingEngine.asks[0].quantity, 3)
  })
})
