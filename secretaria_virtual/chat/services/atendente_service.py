import asyncio
import os
from pathlib import Path
from typing import Dict, List, Optional
from unittest import result
from atendentepro import activate, create_standard_network, AgentStyle, configure
from agents import Runner


class AtendenteService:
    """
    Service para gerenciar interações com o AtendentePro
    """
    
    _network = None
    _initialized = False
    
    def __init__(self):
        if not AtendenteService._initialized:
            self._initialize()
    
    def _initialize(self):
        """Inicializa o AtendentePro com as configurações"""
        try:
            # Ativar licença
            license_key = os.getenv('ATENDENTEPRO_LICENSE_KEY')
            if not license_key:
                raise ValueError("ATENDENTEPRO_LICENSE_KEY não configurada no .env")
            
            activate(license_key)
            
            # Estilo global
            global_style = AgentStyle(
                tone="profissional e educado",
                language_style="neutro",
                response_length="conciso",
                custom_rules="Use linguagem clara e seja empático.",
            )

            # Configurar modelo padrão
            configure(
                default_model="gpt-4o-mini"
            )

            # Criar rede de agentes
            # A pasta dos YAMLs é: chat/atendente/secretaria/
            templates_root = Path(__file__).parent.parent / "atendente" / "secretaria"
            
            network = create_standard_network(
                templates_root=templates_root,
                client="",
                include_knowledge=False,
                include_confirmation=False,
                include_usage=False,
                include_onboarding=False,
                include_escalation=True,
                include_feedback=True,
                global_style=global_style,
            )

            print(f"Agentes disponíveis: {dir(network)}")
            
            AtendenteService._network = network
            AtendenteService._initialized = True
            
            print("AtendentePro inicializado com sucesso!")
            
        except Exception as e:
            print(f"Erro ao inicializar AtendentePro: {str(e)}")
            raise
    
    async def process_message(self, message: str, conversation_history: list = None) -> dict:
        """
        Processa uma mensagem do usuário através da rede de agentes.
        
        Args:
            message: Mensagem do usuário
            conversation_history: Histórico da conversa (opcional)
            
        Returns:
            dict com resposta e metadados
        """
        try:
            if not AtendenteService._initialized or AtendenteService._network is None:
                self._initialize()
            
            # Monta histórico completo se existir
            if conversation_history:
                messages = conversation_history + [{"role": "user", "content": message}]
            else:
                messages = [{"role": "user", "content": message}]
            
            # Executa o agente de triagem
            result = await Runner.run(
                AtendenteService._network.triage,
                messages
            )

            print(f"Agente usado: {result}")
            
            # Extrai a resposta corretamente
            response_text = result.final_output if hasattr(result, 'final_output') else str(result)
            
            return {
                "response": response_text,
                "agent": "triage",
                "status": "success"
            }
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Erro ao processar mensagem: {str(e)}")
            print(f"Detalhes: {error_details}")
            return {
                "error": str(e),
                "message": "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
                "status": "error"
            }