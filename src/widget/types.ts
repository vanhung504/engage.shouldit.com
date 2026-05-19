export type ProductMeta = {
  type:          'product'
  productId:     string
  name:          string
  category:      string
  intent:        string
  layout:        string
  currentPrice:  string
  historicalLow: string
  priceStatus:   string
}

export type PlacementMeta = {
  type:     'placement'
  category: string
  intent:   string
  layout:   string
}

export type WidgetMeta = ProductMeta | PlacementMeta
