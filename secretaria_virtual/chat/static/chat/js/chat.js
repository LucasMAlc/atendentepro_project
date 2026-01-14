// Elementos do DOM
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const typingIndicator = document.getElementById('typingIndicator');
const clearBtn = document.getElementById('clearBtn');

// Função para obter CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Função para formatar hora
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Função para adicionar mensagem do usuário
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#1e40af"/>
                <path d="M12 6C10.34 6 9 7.34 9 9C9 10.66 10.34 12 12 12C13.66 12 15 10.66 15 9C15 7.34 13.66 6 12 6ZM12 13.5C9.5 13.5 4.5 14.75 4.5 17.25V18H19.5V17.25C19.5 14.75 14.5 13.5 12 13.5Z" fill="white"/>
            </svg>
        </div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
            <span class="message-time">${getCurrentTime()}</span>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Função para adicionar mensagem do bot
function addBotMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    // Formatar mensagem (quebras de linha, negrito, etc)
    const formattedMessage = formatMessage(message);
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#1e40af"/>
                <path d="M12 6C10.34 6 9 7.34 9 9C9 10.66 10.34 12 12 12C13.66 12 15 10.66 15 9C15 7.34 13.66 6 12 6ZM12 13.5C9.5 13.5 4.5 14.75 4.5 17.25V18H19.5V17.25C19.5 14.75 14.5 13.5 12 13.5Z" fill="white"/>
            </svg>
        </div>
        <div class="message-content">
            ${formattedMessage}
            <span class="message-time">${getCurrentTime()}</span>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Função para formatar mensagem
function formatMessage(text) {
    // Escapar HTML primeiro
    text = escapeHtml(text);
    
    // Quebras de linha
    text = text.replace(/\n/g, '<br>');
    
    // Negrito com ** ou __
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Itálico com * ou _
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Criar parágrafos
    const paragraphs = text.split('<br><br>');
    return paragraphs.map(p => `<p>${p}</p>`).join('');
}

// Função para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Função para mostrar indicador de digitação
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

// Função para esconder indicador de digitação
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Função para rolar para o final
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Função para desabilitar input
function disableInput() {
    messageInput.disabled = true;
    sendBtn.disabled = true;
}

// Função para habilitar input
function enableInput() {
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
}

// Função para mostrar erro
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message bot-message';
    errorDiv.innerHTML = `
        <div class="message-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#ef4444"/>
                <path d="M12 8V12M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </div>
        <div class="message-content">
            <p>❌ ${escapeHtml(message)}</p>
            <span class="message-time">${getCurrentTime()}</span>
        </div>
    `;
    chatMessages.appendChild(errorDiv);
    scrollToBottom();
}

// Handler do formulário
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Adicionar mensagem do usuário
    addUserMessage(message);
    messageInput.value = '';
    
    // Desabilitar input e mostrar digitação
    disableInput();
    showTypingIndicator();
    
    try {
        const csrftoken = getCookie('csrftoken');
        const response = await fetch('/api/send-message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        hideTypingIndicator();
        
        if (response.ok && data.status === 'success') {
            addBotMessage(data.response);
        } else {
            showError(data.error || 'Erro ao processar mensagem');
        }
    } catch (error) {
        hideTypingIndicator();
        console.error('Erro:', error);
        showError('Erro de conexão. Por favor, tente novamente.');
    } finally {
        enableInput();
    }
});

// Handler do botão limpar
clearBtn.addEventListener('click', async () => {
    if (!confirm('Deseja iniciar uma nova conversa?')) return;
    
    try {
        const csrftoken = getCookie('csrftoken');
        const response = await fetch('/api/clear-conversation/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            }
        });
        
        if (response.ok) {
            // Limpar mensagens (manter apenas a mensagem inicial)
            const firstMessage = chatMessages.firstElementChild;
            chatMessages.innerHTML = '';
            chatMessages.appendChild(firstMessage);
            messageInput.focus();
        }
    } catch (error) {
        console.error('Erro ao limpar conversa:', error);
        alert('Erro ao limpar conversa. Por favor, recarregue a página.');
    }
});

// Auto-resize do input
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// Focus no input ao carregar
messageInput.focus();

// Atalho Enter para enviar (Shift+Enter para nova linha)
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});