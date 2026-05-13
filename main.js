(function () {
  'use strict';

  function renderApp(target) {
    if (!target) {
      console.error('[Copilote3DX] Aucun conteneur cible trouvé.');
      return;
    }

    target.innerHTML =
      '<div class="copilot">' +
        '<div class="copilot-header">' +
          '<div class="title">Copilote 3DX</div>' +
          '<div class="subtitle">V0 — démo locale sans backend</div>' +
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
      if (!messages) {
        return;
      }

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
        return 'Pour l’instant je suis une V0 locale. À l’étape suivante, je serai connecté à ton backend copilote.';
      }

      if (lower.indexOf('objet') !== -1 || lower.indexOf('item') !== -1) {
        return 'Bientôt, je pourrai résumer un objet 3DX et exploiter son contexte.';
      }

      if (lower.indexOf('aide') !== -1 || lower.indexOf('help') !== -1) {
        return 'Essaie par exemple : "Bonjour", "Parle-moi de 3DX", ou "Résume cet objet".';
      }

      return 'Réponse simulée locale : j’ai bien reçu ton message.';
    }

    function sendMessage() {
      if (!input) {
        return;
      }

      var text = input.value.replace(/^\s+|\s+$/g, '');
      if (!text) {
        return;
      }

      addMessage('user', text);
      input.value = '';

      setTimeout(function () {
        addMessage('assistant', buildFakeReply(text));
      }, 400);
    }

    if (button) {
      button.onclick = sendMessage;
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
    }

    addMessage('assistant', 'Bonjour 👋 Je suis le copilote 3DX en mode démo locale.');
    console.log('[Copilote3DX] Interface rendue avec succès.');
  }

  function initStandalone() {
    console.log('[Copilote3DX] Mode standalone détecté.');
    renderApp(document.body);
  }

  function init3DX() {
    console.log('[Copilote3DX] Mode 3DX détecté, attente de onLoad.');

    try {
      widget.addEvent('onLoad', function () {
        console.log('[Copilote3DX] onLoad reçu.');
        renderApp(widget.body);
      });
    } catch (error) {
      console.error('[Copilote3DX] Erreur pendant init3DX:', error);
    }
  }

  function bootstrap() {
    if (typeof widget !== 'undefined' && widget && widget.addEvent && widget.body) {
      init3DX();
    } else {
      initStandalone();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();