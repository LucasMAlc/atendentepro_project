import asyncio
import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .services.atendente_service import AtendenteService


def home(request):
    """Renderiza a página inicial"""
    return render(request, 'chat/home.html')


def chat(request):
    """Renderiza a página do chat"""
    return render(request, 'chat/chat.html')


@csrf_exempt
@require_http_methods(["POST"])
def send_message(request):
    """
    Endpoint para enviar mensagens ao assistente
    """
    try:
        data = json.loads(request.body)
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return JsonResponse({
                'error': 'Mensagem vazia'
            }, status=400)
        
        # Recupera histórico da sessão (formato correto)
        conversation_history = request.session.get('conversation_history', [])
        
        # Debug
        print(f"Mensagem recebida: {user_message}")
        print(f"Histórico: {len(conversation_history)} mensagens")
        
        # Processa a mensagem
        service = AtendenteService()
        result = asyncio.run(service.process_message(user_message, conversation_history))
        
        if result.get('status') == 'error':
            return JsonResponse({
                'error': result.get('message', 'Erro desconhecido')
            }, status=500)
        
        # Atualiza histórico na sessão
        conversation_history.append({
            'role': 'user',
            'content': user_message
        })
        conversation_history.append({
            'role': 'assistant',
            'content': result['response']
        })
        
        # Limita histórico a últimas 20 mensagens para não sobrecarregar
        if len(conversation_history) > 10:
            conversation_history = conversation_history[-10:]
        
        request.session['conversation_history'] = conversation_history
        request.session.modified = True
        
        print(f"Resposta enviada: {result['response'][:100]}...")
        
        return JsonResponse({
            'response': result['response'],
            'status': 'success'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'JSON inválido'
        }, status=400)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Erro na view: {str(e)}")
        print(f"Traceback: {error_trace}")
        return JsonResponse({
            'error': f'Erro ao processar mensagem: {str(e)}'
        }, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def clear_conversation(request):
    """
    Limpa o histórico da conversa
    """
    try:
        request.session['conversation_history'] = []
        request.session.modified = True
        print("Conversa limpa")
        return JsonResponse({
            'status': 'success',
            'message': 'Conversa limpa'
        })
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=500)