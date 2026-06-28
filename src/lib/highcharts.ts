import Highcharts from 'highcharts'
import HighchartsMore from 'highcharts/highcharts-more'
import HighchartsSunburst from 'highcharts/modules/sunburst'

// boxplot / columnrange 等の追加チャートタイプを有効化する（Angular 版 highcharts-more 相当）
HighchartsMore(Highcharts)
// sunburst（支出割合・投資ポートフォリオの円階層チャート）を有効化する
HighchartsSunburst(Highcharts)

/** Highcharts の既定カラーパレット（Angular 版から移植） */
export const highChartsColors: string[] = [
  '#7cb5ec',
  '#636368',
  '#90ed7d',
  '#f7a35c',
  '#8085e9',
  '#f15c80',
  '#e4d354',
  '#2b908f',
  '#f45b5b',
  '#91e8e1',
]

/** インデックスに対応する系列カラーを取得する */
export function getHighChartsColor(num: number): string {
  const id = num % highChartsColors.length
  return highChartsColors[id]
}

/**
 * 全チャート共通の既定オプション（ダークテーマ）。
 * 各チャートはこのオプションをベースにマージして利用する。
 */
export const defaultHighchartsOptions: Highcharts.Options = {
  chart: {
    backgroundColor: '#FFF3',
    animation: {
      duration: 200,
    },
  },
  colors: highChartsColors,
  time: {
    useUTC: false,
  },
  title: {
    style: {
      color: '#EEE',
      fontSize: '20px',
    },
  },
  tooltip: {
    dateTimeLabelFormats: {
      year: '%Y',
      month: '%Y/%m',
      week: '%Y/%m/%d',
      day: '%Y/%m/%d',
      hour: '%Y/%m/%d %H',
      minute: '%Y/%m/%d %H:%M',
      second: '%Y/%m/%d %H:%M:%S',
    },
  },
  subtitle: {
    style: {
      color: '#EEE',
      fontSize: '16px',
    },
  },
  xAxis: {
    labels: {
      style: {
        color: '#E0E0E3',
      },
    },
    lineColor: '#707073',
    minorGridLineColor: '#505053',
    tickColor: '#707073',
    title: {
      style: {
        color: '#A0A0A3',
      },
    },
  },
  yAxis: {
    gridLineColor: '#707073',
    labels: {
      style: {
        color: '#E0E0E3',
      },
    },
    lineColor: '#707073',
    minorGridLineColor: '#505053',
    tickColor: '#707073',
    tickWidth: 1,
    minorTicks: true,
    title: {
      style: {
        color: '#A0A0A3',
      },
    },
  },
  plotOptions: {
    area: {
      stacking: 'normal',
    },
    series: {
      dataLabels: {
        color: '#F0F0F3',
        style: {
          fontSize: '13px',
        },
      },
      marker: {
        enabled: false,
      },
    },
  },
  legend: {
    backgroundColor: '#FFF3',
    itemStyle: {
      color: '#DDD',
    },
    itemHoverStyle: {
      color: '#FFF',
    },
    itemHiddenStyle: {
      color: '#666',
    },
    title: {
      style: {
        color: '#CCC',
      },
    },
  },
  credits: {
    enabled: false,
  },
  drilldown: {
    activeAxisLabelStyle: {
      color: '#F0F0F3',
    },
    activeDataLabelStyle: {
      color: '#F0F0F3',
    },
  },
}
