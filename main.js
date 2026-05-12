(function () {
  'use strict';

  var conversation = [];

  function getRootContainer() {
    // En environnement 3DEXPERIENCE, l'objet widget est injecté par 3DDashboard.
    // En dehors de 3DX (test local simple), on retombe sur document.body.
    if (typeof widget !== 'undefined' && widget.body) {
      return widget.body;
    }
    return document.body;
  }

  function renderApp() {
    var root = getRootContainer();

    root.innerHTML = `
      <div class="copilot">
        <div class="copilot-header">
          <div class="title">Copilote 3DX</div>
          <div class="subtitle">V0 — démo locale sans backend</div>
        </div>

        <div id="messages" class="messages"></div>

        <div class="input-zone">
          <input
            id="userInput"
            type="text"
            placeholder="Pose ta question..."
            autocomplete="off"
          />
          <button id="sendBtn" type="button">Envoyer</button>
        </div>
      </div>
    `;

    bindEvents();
    addMessage('assistant', 'Bonjour 👋 Je suis le copilote 3DX en mode démo locale.');
  }

  function bindEvents() {
    var input = document.getElementById('userInput');
    var sendBtn = document.getElementById('sendBtn');

    sendBtn.addEventListener('click', sendMessage);

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
      }
    });
  }

  function sendMessage() {
    var input = document.getElementById('userInput');
    var text = input.value.trim();

    if (!text) {
      return;
    }

    addMessage('user', text);
    conversation.push({ role: 'user', text: text });

    input.value = '';
    input.focus();

    simulateAssistantReply(text);
  }

  function simulateAssistantReply(userText) {
    var reply = buildFakeReply(userText);

    // Petite latence artificielle pour donner un effet "assistant"
    setTimeout(function () {
      addMessage('assistant', reply);
      conversation.push({ role: 'assistant', text: reply });
    }, 500);
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

    return 'Réponse simulée locale : j’ai bien reçu ton message. Le backend sera branché à l’étape 2.';
  }

  function addMessage(role, text) {
    var messages = document.getElementById('messages');
    if (!messages) {
      return;
    }

    var item = document.createElement('div');
    item.className = 'message ' + role;
    item.textContent = text;

    messages.appendChild(item);
    scrollToBottom();
  }

  function scrollToBottom() {
    var messages = document.getElementById('messages');
    if (messages) {
      messages.scrollTop = messages.scrollHeight;
    }
  }

  function init() {
    renderApp();
  }

  // Cas 1 : exécution dans 3DEXPERIENCE
  if (typeof widget !== 'undefined' && widget.addEvent) {
    widget.addEvent('onLoad', init);
  } else {
    // Cas 2 : test simple hors 3DX
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();