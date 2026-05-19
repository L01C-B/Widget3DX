(function () {
  'use strict';

  var appStarted = false;

  // =========================
  // Configuration
  // =========================
 
  // var BACKEND_URL = 'http://127.0.0.1:8000/chat';
  var BACKEND_URL = "https://backendwidget3dx.onrender.com/chat";

  // =========================
  // Helpers runtime
  // =========================
  function is3DXRuntime() {
    return typeof widget !== 'undefined' && widget && widget.body && widget.addEvent;
  }

  function isLocalBackend(url) {
    return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(url);
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

  // =========================
  // Transport backend
  // =========================
  function postJsonFetch(url, payload) {
    return fetch(url, {
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
    });
  }

  function postJsonProxified(url, payload) {
    return new Promise(function (resolve, reject) {
      if (typeof require === 'undefined') {
        reject(new Error('RequireJS non disponible dans ce contexte.'));
        return;
      }

      require(['DS/WAFData/WAFData'], function (WAFData) {
        try {
          WAFData.proxifiedRequest(url, {
            method: 'POST',
            type: 'json',
            headers: {
              'Content-Type': 'application/json'
            },
            data: JSON.stringify(payload),
            onComplete: function (data) {
              resolve(data);
            },
            onFailure: function (error) {
              reject(error || new Error('Échec proxifiedRequest'));
            }
          });
        } catch (e) {
          reject(e);
        }
      }, function (err) {
        reject(err || new Error('Impossible de charger DS/WAFData/WAFData'));
      });
    });
  }

  function sendToBackend(message) {
    var payload = {
      message: message,
      thread_id: getThreadId()
    };

    // Cas 1 : backend local -> toujours fetch
    if (isLocalBackend(BACKEND_URL)) {
      return postJsonFetch(BACKEND_URL, payload).then(extractAnswer);
    }

    // Cas 2 : backend distant + runtime 3DX -> proxified
    if (is3DXRuntime()) {
      return postJsonProxified(BACKEND_URL, payload).then(extractAnswer);
    }

    // Cas 3 : backend distant + standalone -> fetch
    return postJsonFetch(BACKEND_URL, payload).then(extractAnswer);
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
          '<div class="subtitle">Connecté au backend</div>' +
        '</div>' +
        '<div id="messages" class="messages"></div>' +
        '<div class="input-zone">' +
          '<input id="userInput" type="text" placeholder="Pose ta question..." autocomplete="off" />' +
          '<button id="sendBtn" type="button">Envoyer</button>' +
        '</div>' +
      '</div>';

    var input = document.getElementById('userInput');
    var button = document.getElementById('sendBtn');

    function addMessage(role, text) {
      var messages = document.getElementById('messages');
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

      var text = input.value.replace(/^\s+|\s+$/g, '');
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

    addMessage(
      'assistant',
      isLocalBackend(BACKEND_URL)
        ? 'Bonjour 👋 Backend local détecté : appel via fetch.'
        : (is3DXRuntime()
            ? 'Bonjour 👋 Backend distant détecté : appel via proxifiedRequest.'
            : 'Bonjour 👋 Backend distant détecté : appel via fetch.')
    );
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