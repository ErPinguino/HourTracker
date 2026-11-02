const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const Module = require('node:module')
const originalResolve = Module._resolveFilename
Module._resolveFilename = function (request, ...args) {
  return originalResolve.call(this, request.startsWith('@/') ? path.resolve(__dirname, '../src', request.slice(2)) : request, ...args)
}
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  module._compile(output, filename)
}
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { generateMonthlyPdf } = require('../src/utils/generateMonthlyPdf.ts')
const { MonthlyImageTemplate } = require('../src/components/share/MonthlyImageTemplate.tsx')
const profile = { worker_name: 'Prueba', payment_type: 'hourly', daily_goal_minutes: 480, hourly_rate: 12, overtime_rate: 15, currency: 'EUR', default_break_minutes: 30, theme: 'light', daily_rate: 90 }
const logs = [undefined, '', 'Oficina', 'Hotel PortAventura Tarragona '.repeat(4)].map((work_location, index) => ({ id: String(index), date: `2026-11-0${index + 1}`, start_time: '20:21', end_time: '22:21', break_minutes: 30, worked_minutes: 90, work_location }))
for (const payment_type of ['hourly', 'daily']) {
  for (const entries of [logs.slice(2, 3), logs]) test(`${payment_type}: PDF and image template with ${entries.length} rows`, () => {
    const config = { ...profile, payment_type }
    const pdf = generateMonthlyPdf(new Date(2026, 10, 1), entries, config)
    const content = pdf.output()
    assert.ok(content.includes('(Lugar)'))
    assert.ok(content.includes('(Oficina)'))
    assert.ok(Math.abs(pdf.internal.pageSize.getWidth() - 210) < 1)
    const html = renderToStaticMarkup(React.createElement(MonthlyImageTemplate, { month: new Date(2026, 10, 1), workLogs: entries, profile: config }))
    assert.ok(html.includes('>Lugar</span>'))
    assert.ok(html.includes('Oficina'))
    assert.equal(html.includes('<small'), false)
    if (entries.length > 1) assert.ok(html.includes(logs[3].work_location))
    if (payment_type === 'hourly') {
      const headers = ['>Día<', '>Jornada<', '>Total<', '>Ganado<', '>Lugar<'].map(value => html.indexOf(value))
      assert.ok(headers.every((value, index) => value >= 0 && (index === 0 || value > headers[index - 1])))
      assert.ok(html.includes('20:21 - 22:21'))
    }
  })
}
