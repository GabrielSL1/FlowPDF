# FlowPDF - Guia de Instalação e Uso

Este é um sistema inteligente de gestão de documentos (ERP PDF) movido a IA.

## Como "Instalar" e Rodar o Sistema

Como o FlowPDF é um aplicativo web moderno, ele não possui um arquivo `.exe`. Ele roda através do **Node.js**.

### Passo 1: Pré-requisitos
Certifique-se de ter o **Node.js** instalado em seu computador.
- Baixe em: [nodejs.org](https://nodejs.org/) (Recomendamos a versão LTS).

### Passo 2: Execução Automática (Windows)
Se você estiver no Windows, basta dar um duplo clique no arquivo:
- `iniciar_sistema.bat`
*Este arquivo instalará as dependências na primeira vez e abrirá o sistema no seu navegador.*

### Passo 3: Execução Manual (Qualquer Sistema)
Abra a pasta do projeto no seu terminal (cmd, powershell ou bash) e digite:
1. `npm install` (Para instalar as bibliotecas na primeira vez)
2. `npm run dev` (Para iniciar o servidor)
3. Abra `http://localhost:9002` no seu navegador.

## Funcionalidades Principais
- **Login de Teste:** Use `admin@flowpdf.com` / `admin123`.
- **Gestão de Pastas:** Crie pastas raiz e subpastas clicando no ícone de `+`.
- **Exclusão Segura:** Apague pastas e subpastas usando o ícone de lixeira (com confirmação).
- **IA Integrada:** Uploads de PDF são analisados automaticamente para gerar tags e palavras-chave.
