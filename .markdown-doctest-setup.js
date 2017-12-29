const cycleDOM = {
  makeDOMDriver: () => () => {}
}

const cycleTime = {
  timeDriver: () => {}
}

const cycleRun = {
  run: () => {}
}

module.exports = {
  require: {
    'cycle-remote-data': require('.'),
    '@cycle/dom': cycleDOM,
    '@cycle/time': cycleTime,
    '@cycle/run': cycleRun,
    'xstream': require('xstream')
  },

  globals: {
    ...cycleDOM,

    document: {body: {}}
  }
}
