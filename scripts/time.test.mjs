import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTime, timeRegex } from '../src/utils/time.ts'
import { calculateWorkedMinutes } from '../src/utils/calculateWorkedMinutes.ts'
import { hourlySchema, dailySchema } from '../src/utils/dayValidation.ts'

test('the actual hourly form schema accepts the reported values and normalizes seconds', () => {
  const result = hourlySchema.parse({ start_time: '20:20:00', end_time: '21:11', break_minutes: 30 })
  assert.equal(result.start_time, '20:20')
  assert.equal(calculateWorkedMinutes(result.start_time, result.end_time, result.break_minutes), 21)
  for (const [start_time, end_time, break_minutes] of [['22:00', '06:00', 0], ['20:20', '21:11', 51], ['20:20', '21:11', 60], ['20:', '21:11', 0], ['08:00', '17:00', NaN]]) {
    assert.equal(hourlySchema.safeParse({ start_time, end_time, break_minutes }).success, false)
  }
  assert.ok(dailySchema.safeParse({ worked_day: true, worked_extra: false }).success)
  assert.equal(dailySchema.safeParse({ worked_day: true, worked_extra: true, extra_hours: 0 }).success, false)
})

test('accepts native minute values and zero-second database values', () => {
  for (const time of ['08:00', '15:30', '20:20', '21:11', '08:00:00', '08:00:00.000']) {
    assert.ok(timeRegex.test(normalizeTime(time)), time)
  }
  for (const time of ['', '8:0', '24:00', '12:60', '20:', '20:20:15']) assert.equal(timeRegex.test(normalizeTime(time)), false)
})
test('calculates the reported regression and updates for changed values', () => {
  assert.equal(calculateWorkedMinutes('20:20', '21:11', 30), 21)
  assert.equal(calculateWorkedMinutes('20:20', '21:11', 0), 51)
  assert.equal(calculateWorkedMinutes('08:00:00', '17:00:00', 60), 480)
  assert.equal(calculateWorkedMinutes('08:00', '15:30', 30), 420)
})
test('never produces negative or NaN results; preserves same-day rule', () => {
  for (const [start, end, rest] of [['22:00', '06:00', 0], ['08:00', '08:00', 0], ['20:20', '21:11', 60], ['', '21:11', 30], ['invalid', '21:11', 0], ['08:00', '17:00', NaN], ['08:00', '17:00', -1]]) {
    assert.equal(calculateWorkedMinutes(start, end, rest), 0)
  }
})
