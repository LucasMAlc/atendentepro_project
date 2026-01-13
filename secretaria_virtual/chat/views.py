from django.shortcuts import render
from .services.atendente_service import process_message
import asyncio

def chat_view(request):
    response = ""

    if request.method == "POST":
        user_message = request.POST.get("message")
        response = asyncio.run(process_message(user_message))

    return render(request, "chat/chat.html", {"response": response})
