(function () {
  'use strict';

  var appStarted = false;

  // =========================
  // Configuration
  // =========================

  // Décommenter pour tester en local :
  // var BACKEND_URL = 'http://127.0.0.1:8000/chat';
  var BACKEND_URL = 'https://backendwidget3dx.onrender.com/chat';

  // Timeout logique côté frontend (en ms)
  var REQUEST_TIMEOUT_MS = 45000;

  // =========================
  // Helpers runtime
  // =========================

  function is3DXRuntime() {
    return typeof widget !== 'undefined' && widget && widget.body && widget.addEvent;
  }

  function getThreadId() {
    var key = 'copilot3dx-thread-id';
    var value = null;

    try {
      value = window.localStorage.getItem(key);
      if (!value) {
        value = 'thread-' + Date.now();
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      value = 'thread-' + Date.now();
    }

    return value;
  }

  function extractAnswer(data) {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return data;
      }
    }

    if (data && typeof data.answer === 'string') {
      return data.answer;
    }

    return 'Réponse reçue, mais format inattendu.';
  }

  function withTimeout(promise, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var settled = false;

      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        reject(new Error('Timeout après ' + timeoutMs + ' ms'));
      }, timeoutMs);

      promise
        .then(function (result) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(result);
        })
        .catch(function (error) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // =========================
  // Transport backend
  // =========================

  function postJson(url, payload) {
    return withTimeout(
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        return response.json();
      }),
      REQUEST_TIMEOUT_MS
    );
  }

  function sendToBackend(message) {
    var payload = {
      message: message,
      thread_id: getThreadId()
    };

    return postJson(BACKEND_URL, payload).then(extractAnswer);
  }

  // =========================
  // UI
  // =========================

  function renderApp(target) {
    if (appStarted || !target) {
      return;
    }

    appStarted = true;

    target.innerHTML =
      '<div class="copilot">' +
        '<div class="copilot-header">' +
          '<div class="title">Copilote 3DX</div>' +
          '<div class="subtitle">Connexion backend via fetch</div>' +
        '</div>' +
        '<div id="messages" class="messages"></div>' +
        '<div class="input-zone">' +
          '<input id="userInput" type="text" placeholder="Pose ta question..." autocomplete="off" />' +
          '<button id="sendBtn" type="button">Envoyer</button>' +
        '</div>' +
      '</div>';

    var input = document.getElementById('userInput');
    var button = document.getElementById('sendBtn');
    var messages = document.getElementById('messages');

    function addMessage(role, text) {
      if (!messages) return;

      var div = document.createElement('div');
      div.className = 'message ' + role;
      div.appendChild(document.createTextNode(text));
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
    }

    function setLoading(isLoading) {
      if (button) {
        button.disabled = !!isLoading;
        button.textContent = isLoading ? 'Envoi...' : 'Envoyer';
      }

      if (input) {
        input.disabled = !!isLoading;
      }
    }

    function sendMessage() {
      if (!input) return;

      var text = input.value.trim();
      if (!text) return;

      addMessage('user', text);
      input.value = '';
      setLoading(true);

      sendToBackend(text)
        .then(function (answer) {
          addMessage('assistant', answer);
        })
        .catch(function (error) {
          var message = 'Erreur backend.';
          if (error && error.message) {
            message += ' ' + error.message;
          }

          addMessage('assistant', message);
          console.error('[Copilot3DX] sendToBackend error:', error);
        })
        .finally(function () {
          setLoading(false);
          if (input) {
            input.focus();
          }
        });
    }

    if (button) {
      button.onclick = sendMessage;
    }

    if (input) {
      input.onkeydown = function (e) {
        e = e || window.event;
        if (e.key === 'Enter' || e.keyCode === 13) {
          if (e.preventDefault) e.preventDefault();
          sendMessage();
        }
      };
    }

    addMessage('assistant', 'Bonjour 👋 Je suis connecté au backend via fetch.');
  }

  // =========================
  // Init
  // =========================

  function init3DX() {
    widget.addEvent('onLoad', function () {
      renderApp(widget.body);
    });
  }

  function initStandalone() {
    renderApp(document.body);
  }

  function waitForWidgetOrFallback() {
    var tries = 0;
    var maxTries = 80; // ~8 secondes

    function step() {
      tries += 1;

      if (is3DXRuntime()) {
        init3DX();
        return;
      }

      if (tries >= maxTries) {
        initStandalone();
        return;
      }

      setTimeout(step, 100);
    }

    step();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForWidgetOrFallback);
  } else {
    waitForWidgetOrFallback();
  }
})();