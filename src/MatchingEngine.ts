import { Order, OrderSide, Trade } from './types'

const sortByPriceMaxToMin = (a: Order, b: Order) => b.price - a.price
const sortByPriceMinToMax = (a: Order, b: Order) => a.price - b.price

// one trading instrument
// no performance optimisations
// only limit orders
// only full execution
// trade gets bid price
export class MatchingEngine {
  public orders: Order[] = []

  public createOrder(order: Order): Trade | undefined {
    this.orders.push(order)
    return this.match()
  }

  private getSideOrders(side: OrderSide): Order[] {
    return this.orders.filter((order) => order.side === side)
  }

  public deleteOrder(orderId: Order['id']) {
    this.orders = this.orders.filter((x) => x.id !== orderId)
  }

  private match(): Trade | undefined {
    const asks = this.getSideOrders(OrderSide.ASK)
    const bids = this.getSideOrders(OrderSide.BID)
    if (!asks.length || !bids.length) return
    const [minPriceAskOrder] = asks.sort(sortByPriceMinToMax)
    const [maxPriceBidOrder] = bids.sort(sortByPriceMaxToMin)
    if (minPriceAskOrder.price > maxPriceBidOrder.price) return
    const askOrderId = minPriceAskOrder.id
    const bidOrderId = maxPriceBidOrder.id
    const tradePrice = maxPriceBidOrder.price
    const trade: Trade = { askOrderId, bidOrderId, price: tradePrice }
    this.deleteOrder(minPriceAskOrder.id)
    this.deleteOrder(maxPriceBidOrder.id)
    console.log(trade)
    return trade
  }
}
