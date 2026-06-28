/** 水質状態（集計値・アクアリウム過去分） */
export interface WaterState {
  time: string
  minWaterTemperature: number
  lowerQuartileWaterTemperature: number
  medianWaterTemperature: number
  upperQuartileWaterTemperature: number
  maxWaterTemperature: number
  minTemperature: number
  lowerQuartileTemperature: number
  medianTemperature: number
  upperQuartileTemperature: number
  maxTemperature: number
  minHumidity: number
  lowerQuartileHumidity: number
  medianHumidity: number
  upperQuartileHumidity: number
  maxHumidity: number
}

/** 現在の水質状態（SignalR: aqua-state-changed） */
export interface CurrentWaterState {
  timeStamp: string
  waterTemperature: number
  temperature: number
  humidity: number
}
