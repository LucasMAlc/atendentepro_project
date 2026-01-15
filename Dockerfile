FROM python:3.11-slim

# Variáveis de ambiente
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Diretório de trabalho
WORKDIR /app

# Instalar dependências
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Mudar para pasta do Django
WORKDIR /app/secretaria_virtual

# Porta
EXPOSE 8000

# Comando
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]