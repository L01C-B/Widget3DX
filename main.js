(function () {
  'use strict';

  var appStarted = false;

  function renderApp(target) {
    if (appStarted || !target) {
      return;
    }
    appStarted = true;

    target.innerHTML =
      '<div class="copilot">' +
        '<div class="copilot-header">' +
          '<div class="title">Copilote 3DX V0 (démo test)</div>' +
          '<div class="subtitle">Version propre minimale</div>' +
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

    function buildFakeReply(text) {
      var lower = text.toLowerCase();

      if (lower.indexOf('bonjour') !== -1 || lower.indexOf('salut') !== -1) {
        return 'Bonjour ! Je suis prêt à t’aider sur 3DEXPERIENCE.';
      }

      if (lower.indexOf('3dx') !== -1 || lower.indexOf('3dexperience') !== -1) {
        return 'Je suis intégré au widget 3DX et prêt pour la prochaine étape backend.';
      }

      if (lower.indexOf('objet') !== -1 || lower.indexOf('item') !== -1) {
        return 'Bientôt, je pourrai résumer un objet 3DX et exploiter son contexte.';
      }

      return 'Réponse simulée locale : j’ai bien reçu ton message.';
    }

    function sendMessage() {
      if (!input) return;

      var text = input.value.replace(/^\s+|\s+$/g, '');
      if (!text) return;

      addMessage('user', text);
      input.value = '';

      setTimeout(function () {
        addMessage('assistant', buildFakeReply(text));
      }, 300);
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

    addMessage('assistant', 'Bonjour 👋 Je suis le copilote 3DX.');
  }

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

      var hasWidget = (typeof widget !== 'undefined' && widget && widget.addEvent && widget.body);

      if (hasWidget) {
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