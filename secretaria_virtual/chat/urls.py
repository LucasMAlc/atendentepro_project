from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('', views.home, name='home'),
    path('chat/', views.chat, name='chat'),
    path('api/send-message/', views.send_message, name='send_message'),
    path('api/clear-conversation/', views.clear_conversation, name='clear_conversation'),
]