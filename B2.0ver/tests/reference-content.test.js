import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { kelvinColor, lightingStyle } from '../app/iconLighting.js'

const { people } = JSON.parse(readFileSync(new URL('../app/exhibition.json', import.meta.url)))
const byId = Object.fromEntries(people.map(person => [person.id, person]))

test('reference thresholds preserve operators, precision and units', () => {
  // Independent transcription of the supplied table's numeric requirements.
  const expected = {
    'anti-aging': {light:['≥250EML','≤50EML'],air:['≤10µg/m³','≤0.30ppm'],temp:['22–23°C','50%'],sound:['≤30dB']},
    child: {light:['≥500Lux','<5%'],air:['≤600ppm','≤0.02ppm','0.1–0.5m'],temp:['24–26°C','45–55%','<2°C'],sound:['≤40dB']},
    elder: {light:['≥800Lux','≥90CRI'],air:['≤800ppm','≤10µg/m³'],temp:['26–28°C'],sound:['≤45dB']},
    pregnancy: {light:['1800–2700K','≤50EML'],air:['≤0.0135ppm'],temp:['25°C','50%'],sound:['~35dB']},
    nomad: {light:['500–1000Lux','5000–6500K'],air:['≤750ppm','2倍以上'],temp:['23–24°C'],sound:['≤35dB']},
  }
  for (const [id, dimensions] of Object.entries(expected)) for (const [dimension, targets] of Object.entries(dimensions)) {
    const actual = byId[id].dimensions[dimension].metrics.filter(metric => metric.kind !== 'note').map(metric => `${metric.operator}${metric.value}${metric.unit}`)
    assert.deepEqual(actual, targets, `${id}/${dimension}`)
  }
})

test('all core goals are supplied, without old fabricated health scores or comparisons', () => {
  for (const person of people) {
    assert.ok(person.goal)
    assert.equal(person.score, undefined)
    for (const dimension of Object.values(person.dimensions)) {
      assert.equal(dimension.metrics.length, 3)
      assert.ok(dimension.metrics.every(metric => metric.icon))
    }
  }
  assert.equal(byId.pregnancy.goal, '零毒害微環境，緩解懷孕後期的身心壓力')
  assert.ok(byId.child.dimensions.temp.metrics.some(metric => metric.icon === 'humid'))
  assert.ok(!byId.elder.dimensions.temp.metrics.some(metric => metric.icon === 'humid'))
})

test('specified color temperatures drive lamp colors independently of illuminance', () => {
  assert.deepEqual(byId.pregnancy.dimensions.light.kelvin, [1800,2700])
  assert.deepEqual(byId.nomad.dimensions.light.kelvin, [5000,6500])
  assert.equal(lightingStyle({kelvin:[1800,2700]})['--lamp-from'],kelvinColor(1800))
  assert.equal(lightingStyle({kelvin:[5000,6500]})['--lamp-to'],kelvinColor(6500))
  assert.notEqual(kelvinColor(1800),kelvinColor(6500))
  assert.equal(byId.child.dimensions.light.kelvin,undefined)
})
