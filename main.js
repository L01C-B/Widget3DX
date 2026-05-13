(function () {
  'use strict';

  var DEBUG = true;
  var panelReady = false;

  function debugLog() {
    var args = Array.prototype.slice.call(arguments);
    var msg = args.map(function (x) {
      if (typeof x === 'object') {
        try {
          return JSON.stringify(x);
        } catch (e) {
          return String(x);
        }
      }
      return String(x);
    }).join(' ');

    console.log('[Copilot3DX]', msg);

    if (DEBUG) {
      try {
        ensureDebugPanel();
        var lines = document.getElementById('copilot-debug-lines');
        if (lines) {
          var div = document.createElement('div');
          div.textContent = new Date().toISOString() + ' | ' + msg;
          lines.appendChild(div);
          lines.scrollTop = lines.scrollHeight;
        }
      } catch (e) {
        console.log('[Copilot3DX] debug panel error', e);
      }
    }
  }

  function ensureDebugPanel() {
    if (panelReady) return;

    var host = document.body || document.documentElement;
    if (!host) return;

    var existing = document.getElementById('copilot-debug-panel');
    if (existing) {
      panelReady = true;
      return;
    }

    var panel = document.createElement('div');
    panel.id = 'copilot-debug-panel';
    panel.style.position = 'fixed';
    panel.style.right = '8px';
    panel.style.bottom = '8px';
    panel.style.width = '420px';
    panel.style.maxHeight = '220px';
    panel.style.overflow = 'auto';
    panel.style.zIndex = '999999';
    panel.style.background = 'rgba(0,0,0,0.85)';
    panel.style.color = '#00ff99';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '11px';
    panel.style.padding = '8px';
    panel.style.border = '1px solid #666';
    panel.style.borderRadius = '6px';

    var title = document.createElement('div');
    title.textContent = 'Copilot3DX Debug Panel';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '6px';
    title.style.color = '#ffffff';

    var lines = document.createElement('div');
    lines.id = 'copilot-debug-lines';

    panel.appendChild(title);
    panel.appendChild(lines);
    host.appendChild(panel);

    panelReady = true;
  }

  window.onerror = function (message, source, lineno, colno, error) {
    debugLog('window.onerror =>', message, 'at', source + ':' + lineno + ':' + colno);
    if (error && error.stack) {
      debugLog('stack =>', error.stack);
    }
  };

  window.onunhandledrejection = function (event) {
    var reason = event && event.reason ? event.reason : 'unknown';
    if (reason && reason.stack) {
      debugLog('unhandledrejection =>', reason.stack);
    } else {
      debugLog('unhandledrejection =>', reason);
    }
  };

  function probe(url) {
    fetch(url, { method: 'GET' })
      .then(function (response) {
        debugLog('probe', url, 'status=', response.status);
      })
      .catch(function (error) {
        debugLog('probe FAIL', url, error.message || error);
      });
  }

  function renderApp(target) {
    debugLog('renderApp called. target exists =', !!target);

    if (!target) {
      debugLog('renderApp aborted: no target');
      return;
    }

    target.innerHTML =
      '<div class="copilot">' +
        '<div class="copilot-header">' +
          '<div class="title">Copilote 3DX</div>' +
          '<div class="subtitle">V0 — debug mode</div>' +
        '</div>' +
        '<div id="messages" class="messages"></div>' +
        '<div class="input-zone">' +
          '<input id="userInput" type="text" placeholder="Pose ta question..." autocomplete="off" />' +
          '<button id="sendBtn" type="button">Envoyer</button>' +
        '</div>' +
      '</div>';

    ensureDebugPanel();

    var input = document.getElementById('userInput');
    var button = document.getElementById('sendBtn');

    function addMessage(role, text) {
      var messages = document.getElementById('messages');
      if (!messages) {
        debugLog('addMessage aborted: #messages not found');
        return;
      }

      var div = document.createElement('div');
      div.className = 'message ' + role;
      div.appendChild(document.createTextNode(text));
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function buildFakeReply(text) {
      return 'Debug reply: ' + text;
    }

    function sendMessage() {
      if (!input) {
        debugLog('sendMessage aborted: input missing');
        return;
      }

      var text = input.value.replace(/^\s+|\s+$/g, '');
      if (!text) {
        debugLog('sendMessage ignored: empty input');
        return;
      }

      debugLog('sendMessage =>', text);
      addMessage('user', text);
      input.value = '';

      setTimeout(function () {
        addMessage('assistant', buildFakeReply(text));
      }, 300);
    }

    if (button) {
      button.onclick = sendMessage;
    } else {
      debugLog('button not found');
    }

    if (input) {
      input.onkeydown = function (e) {
        e = e || window.event;
        if (e.key === 'Enter' || e.keyCode === 13) {
          if (e.preventDefault) {
            e.preventDefault();
          }
          sendMessage();
        }
      };
    } else {
      debugLog('input not found');
    }

    addMessage('assistant', 'Bonjour 👋 Debug mode actif.');
    debugLog('renderApp DONE');
  }

  function initStandalone() {
    debugLog('Mode standalone détecté');
    renderApp(document.body);
  }

  function init3DX() {
    debugLog('Mode 3DX détecté');
    debugLog('widget exists =', typeof widget !== 'undefined');
    debugLog('widget.body exists =', !!(widget && widget.body));
    debugLog('widget.addEvent exists =', !!(widget && widget.addEvent));

    try {
      widget.addEvent('onLoad', function () {
        debugLog('widget.onLoad fired');
        renderApp(widget.body);
      });
      debugLog('widget.addEvent(onLoad) registered');
    } catch (error) {
      debugLog('init3DX ERROR =>', error.message || error);
      if (error && error.stack) {
        debugLog(error.stack);
      }
    }

    // Timeout diagnostic : si onLoad ne part jamais
    setTimeout(function () {
      debugLog('5s timeout reached. If no "widget.onLoad fired", onLoad never happened.');
    }, 5000);
  }

  function bootstrap() {
    debugLog('bootstrap start');
    debugLog('location =', window.location.href);
    debugLog('document.readyState =', document.readyState);
    debugLog('widget typeof =', typeof widget);

    probe('./main.js');
    probe('./style.css');
    probe('./assets/help/help_en.json');
    probe('./assets/help/help_fr.json');

    if (typeof widget !== 'undefined' && widget && widget.addEvent && widget.body) {
      init3DX();
    } else {
      initStandalone();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      debugLog('DOMContentLoaded fired');
      bootstrap();
    });
  } else {
    bootstrap();
  }
})();