// Hive Browser Bridge - Manus-style extension service worker
// Connects Chrome to Hive Desktop for full autonomous browser usage and live monitoring

let liveSteps = []

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Hive Extension] Initialized and connected.')
})

// Listen to commands from popup or Hive WebSocket/HTTP bridge
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_ACTIVE_TAB_CONTENT') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        sendResponse({ ok: false, error: 'No active tab found' })
        return
      }

      const activeTab = tabs[0]

      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => {
            return {
              url: window.location.href,
              title: document.title,
              text: document.body.innerText.slice(0, 15000), // Clean readable text for AI analysis
              htmlSnippet: document.documentElement.outerHTML.slice(0, 25000)
            }
          }
        })

        const data = results[0]?.result
        sendResponse({
          ok: true,
          tab: {
            id: activeTab.id,
            title: activeTab.title,
            url: activeTab.url,
            ...data
          }
        })
      } catch (err) {
        sendResponse({ ok: false, error: err.message })
      }
    })
    return true
  }

  // Autonomous Manus-style Navigation
  if (request.action === 'NAVIGATE_TO') {
    if (typeof request.url !== 'string' || !request.url) {
      sendResponse({ ok: false, error: 'Missing url' })
      return true
    }
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.update(tabs[0].id, { url: request.url }, (updatedTab) => {
          if (chrome.runtime.lastError) {
            sendResponse({ ok: false, error: chrome.runtime.lastError.message })
          } else {
            sendResponse({ ok: true, tab: updatedTab })
          }
        })
      } else {
        chrome.tabs.create({ url: request.url }, (newTab) => {
          sendResponse({ ok: true, tab: newTab })
        })
      }
    })
    return true
  }

  // Autonomous Manus-style Click
  if (request.action === 'CLICK_ELEMENT') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        sendResponse({ ok: false, error: 'No active tab found' })
        return
      }
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          args: [request.selector],
          func: (selector) => {
            const el = document.querySelector(selector)
            if (el) {
              el.click()
              return { ok: true, clicked: true, tag: el.tagName }
            }
            return { ok: false, error: 'Element not found: ' + selector }
          }
        })
        sendResponse(results[0]?.result || { ok: false })
      } catch (e) {
        sendResponse({ ok: false, error: e.message })
      }
    })
    return true
  }

  // Autonomous Manus-style Input Fill
  if (request.action === 'TYPE_TEXT') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs || !tabs[0] || !tabs[0].id) {
        sendResponse({ ok: false, error: 'No active tab found' })
        return
      }
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          args: [request.selector, request.text],
          func: (selector, text) => {
            const el = document.querySelector(selector)
            if (el) {
              el.focus()
              el.value = text
              el.dispatchEvent(new Event('input', { bubbles: true }))
              el.dispatchEvent(new Event('change', { bubbles: true }))
              return { ok: true, typed: true }
            }
            return { ok: false, error: 'Input field not found: ' + selector }
          }
        })
        sendResponse(results[0]?.result || { ok: false })
      } catch (e) {
        sendResponse({ ok: false, error: e.message })
      }
    })
    return true
  }

  // Unknown action: always answer so senders never hang.
  sendResponse({ ok: false, error: `Unknown action: ${request && request.action}` })
  return false
})
