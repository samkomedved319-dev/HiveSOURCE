/**
 * Mock DOM and Browser Environment for ProjectHive Node Tests
 */

export class MockCanvasContext2D {
  public fillStyle: string | any = '#000000'
  public strokeStyle: string | any = '#000000'
  public lineWidth = 1
  public lineCap = 'butt'
  public lineJoin = 'miter'
  public globalAlpha = 1
  public font = '10px sans-serif'
  public textAlign = 'left'
  public textBaseline = 'alphabetic'
  public shadowColor = 'transparent'
  public shadowBlur = 0
  public shadowOffsetX = 0
  public shadowOffsetY = 0

  public calls: Array<{ method: string; args: any[] }> = []

  beginPath() { this.calls.push({ method: 'beginPath', args: [] }) }
  closePath() { this.calls.push({ method: 'closePath', args: [] }) }
  moveTo(x: number, y: number) { this.calls.push({ method: 'moveTo', args: [x, y] }) }
  lineTo(x: number, y: number) { this.calls.push({ method: 'lineTo', args: [x, y] }) }
  arc(x: number, y: number, r: number, sa: number, ea: number, ccw?: boolean) {
    this.calls.push({ method: 'arc', args: [x, y, r, sa, ea, ccw] })
  }
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
    this.calls.push({ method: 'arcTo', args: [x1, y1, x2, y2, radius] })
  }
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
    this.calls.push({ method: 'bezierCurveTo', args: [cp1x, cp1y, cp2x, cp2y, x, y] })
  }
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
    this.calls.push({ method: 'quadraticCurveTo', args: [cpx, cpy, x, y] })
  }
  rect(x: number, y: number, w: number, h: number) { this.calls.push({ method: 'rect', args: [x, y, w, h] }) }
  fill() { this.calls.push({ method: 'fill', args: [] }) }
  stroke() { this.calls.push({ method: 'stroke', args: [] }) }
  save() { this.calls.push({ method: 'save', args: [] }) }
  restore() { this.calls.push({ method: 'restore', args: [] }) }
  scale(x: number, y: number) { this.calls.push({ method: 'scale', args: [x, y] }) }
  translate(x: number, y: number) { this.calls.push({ method: 'translate', args: [x, y] }) }
  rotate(angle: number) { this.calls.push({ method: 'rotate', args: [angle] }) }
  setTransform(...args: any[]) { this.calls.push({ method: 'setTransform', args }) }
  transform(...args: any[]) { this.calls.push({ method: 'transform', args }) }
  resetTransform() { this.calls.push({ method: 'resetTransform', args: [] }) }
  clip() { this.calls.push({ method: 'clip', args: [] }) }
  ellipse(...args: any[]) { this.calls.push({ method: 'ellipse', args }) }
  clearRect(x: number, y: number, w: number, h: number) { this.calls.push({ method: 'clearRect', args: [x, y, w, h] }) }
  fillRect(x: number, y: number, w: number, h: number) { this.calls.push({ method: 'fillRect', args: [x, y, w, h] }) }
  strokeRect(x: number, y: number, w: number, h: number) { this.calls.push({ method: 'strokeRect', args: [x, y, w, h] }) }
  fillText(text: string, x: number, y: number, maxWidth?: number) {
    this.calls.push({ method: 'fillText', args: [text, x, y, maxWidth] })
  }
  strokeText(text: string, x: number, y: number, maxWidth?: number) {
    this.calls.push({ method: 'strokeText', args: [text, x, y, maxWidth] })
  }
  measureText(text: string) {
    return { width: text.length * 7, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }
  }
  drawImage(...args: any[]) { this.calls.push({ method: 'drawImage', args }) }
  createLinearGradient() {
    return { addColorStop: () => {} }
  }
  createRadialGradient() {
    return { addColorStop: () => {} }
  }
  setLineDash(d: number[]) { this.calls.push({ method: 'setLineDash', args: [d] }) }
}

export class MockHTMLElement {
  public tagName: string
  public id = ''
  public className = ''
  public textContent = ''
  public innerHTML = ''
  public style: Record<string, any> = {}
  public classList = {
    classes: new Set<string>(),
    add: (c: string) => this.classList.classes.add(c),
    remove: (c: string) => this.classList.classes.delete(c),
    contains: (c: string) => this.classList.classes.has(c),
    toggle: (c: string) => {
      if (this.classList.classes.has(c)) {
        this.classList.classes.delete(c)
        return false
      }
      this.classList.classes.add(c)
      return true
    },
  }
  public children: MockHTMLElement[] = []
  public parentNode: MockHTMLElement | null = null
  public offsetWidth = 200
  public offsetHeight = 160
  public width = 200
  public height = 160
  private eventListeners: Record<string, Function[]> = {}
  public ctx = new MockCanvasContext2D()

  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase()
  }

  getContext(type: string) {
    if (type === '2d') return this.ctx
    return null
  }

  appendChild(child: MockHTMLElement) {
    this.children.push(child)
    child.parentNode = this
    return child
  }

  removeChild(child: MockHTMLElement) {
    const idx = this.children.indexOf(child)
    if (idx !== -1) {
      this.children.splice(idx, 1)
      child.parentNode = null
    }
    return child
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this)
    }
  }

  addEventListener(event: string, fn: Function) {
    if (!this.eventListeners[event]) this.eventListeners[event] = []
    this.eventListeners[event].push(fn)
  }

  removeEventListener(event: string, fn: Function) {
    if (!this.eventListeners[event]) return
    this.eventListeners[event] = this.eventListeners[event].filter((f) => f !== fn)
  }

  dispatchEvent(event: { type: string; [key: string]: any }) {
    const listeners = this.eventListeners[event.type] || []
    for (const fn of listeners) {
      fn(event)
    }
    return true
  }

  getBoundingClientRect() {
    return {
      top: 0,
      left: 0,
      bottom: this.offsetHeight,
      right: this.offsetWidth,
      width: this.offsetWidth,
      height: this.offsetHeight,
      x: 0,
      y: 0,
    }
  }

  querySelector(sel: string): MockHTMLElement | null {
    if (sel.startsWith('.')) {
      const cls = sel.slice(1)
      for (const ch of this.children) {
        if (ch.classList.contains(cls) || ch.className.includes(cls)) return ch
        const nested = ch.querySelector(sel)
        if (nested) return nested
      }
    }
    return null
  }
}

export class MockAudioContext {
  public currentTime = 0
  public state = 'running'
  public destination = {}
  public oscillatorsCreated: any[] = []

  createOscillator() {
    const osc = {
      type: 'sine',
      frequency: {
        value: 440,
        setValueAtTime: (val: number, _time: number) => { osc.frequency.value = val },
        exponentialRampToValueAtTime: (val: number, _time: number) => { osc.frequency.value = val },
        linearRampToValueAtTime: (val: number, _time: number) => { osc.frequency.value = val },
      },
      connect: (target: any) => target,
      start: (_time?: number) => {},
      stop: (_time?: number) => {},
    }
    this.oscillatorsCreated.push(osc)
    return osc
  }

  createGain() {
    return {
      gain: {
        value: 1,
        setValueAtTime: (_val: number, _time: number) => {},
        exponentialRampToValueAtTime: (_val: number, _time: number) => {},
        linearRampToValueAtTime: (_val: number, _time: number) => {},
      },
      connect: (target: any) => target,
    }
  }

  close() {
    this.state = 'closed'
    return Promise.resolve()
  }
}

export function setupDOMEnvironment() {
  const g = globalThis as any

  if (!g.window) {
    g.window = g
  }

  // Global window event listeners
  const windowListeners: Record<string, Function[]> = {}
  g.addEventListener = (event: string, fn: Function) => {
    if (!windowListeners[event]) windowListeners[event] = []
    windowListeners[event].push(fn)
  }
  g.removeEventListener = (event: string, fn: Function) => {
    if (!windowListeners[event]) return
    windowListeners[event] = windowListeners[event].filter((f) => f !== fn)
  }
  g.window.addEventListener = g.addEventListener
  g.window.removeEventListener = g.removeEventListener

  // Canvas element mock reference (global cv for mascot engine)
  g.cv = { style: { cursor: 'default' } }
  g.window.cv = g.cv

  // Storage
  const storageMap = new Map<string, string>()
  g.localStorage = {
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, val: string) => storageMap.set(key, String(val)),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  }
  g.window.localStorage = g.localStorage

  // Document
  const head = new MockHTMLElement('head')
  const body = new MockHTMLElement('body')
  const elementsById = new Map<string, MockHTMLElement>()

  g.document = {
    head,
    body,
    createElement: (tag: string) => {
      const el = new MockHTMLElement(tag)
      return el
    },
    getElementById: (id: string) => elementsById.get(id) || null,
    addEventListener: (evt: string, fn: Function) => body.addEventListener(evt, fn),
    removeEventListener: (evt: string, fn: Function) => body.removeEventListener(evt, fn),
    body,
  }
  g.window.document = g.document

  // Animation frame
  let rafId = 0
  g.requestAnimationFrame = (fn: FrameRequestCallback) => {
    rafId++
    const id = rafId
    setTimeout(() => fn(Date.now()), 16)
    return id
  }
  g.cancelAnimationFrame = (_id: number) => {}
  g.window.requestAnimationFrame = g.requestAnimationFrame
  g.window.cancelAnimationFrame = g.cancelAnimationFrame

  // Audio Context
  g.AudioContext = MockAudioContext
  g.webkitAudioContext = MockAudioContext
  g.window.AudioContext = MockAudioContext
  g.window.webkitAudioContext = MockAudioContext

  // Mock electronAPI
  g.window.electronAPI = {
    minimize: () => {},
    maximize: () => {},
    close: () => {},
    show: () => {},
    isMaximized: async () => false,
    system: {
      exec: async (cmd: string) => ({ ok: true, stdout: `Executed: ${cmd}` }),
      openApp: async (url: string) => ({ ok: true, message: `Opened: ${url}` }),
      getVersion: async () => '1.0.0',
    },
    app: {
      getVersion: async () => '1.0.0',
    },
    search: {
      query: async (query: string) => ({
        ok: true,
        query,
        content: `Search results for ${query}`,
        citations: [
          { url: 'https://example.com/source1', title: 'Example Title 1', content: 'Snippet 1', domain: 'example.com' },
          { url: 'https://wiki.org/page', title: 'Wiki Page', content: 'Snippet 2', domain: 'wiki.org' },
        ],
      }),
    },
    ai: {
      chat: async (_msgs: any[], _model?: string, _opts?: any) => ({
        ok: true,
        content: 'AI synthesized response with verified facts.',
        citations: [
          { url: 'https://hive.app/doc', title: 'Hive Documentation', content: 'Verified doc' },
        ],
      }),
      models: async () => ({
        ok: true,
        models: [{ id: 'minimax/minimax-m3:free', name: 'Minimax M3 Free' }],
      }),
    },
  }

  // Device Pixel Ratio
  g.window.devicePixelRatio = 1
}
