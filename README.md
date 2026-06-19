# DocuFlow - Intelligent Document Management

Este é um protótipo de ERP inteligente para gerenciamento de documentos PDF, desenvolvido com Next.js, Tailwind CSS e Genkit (IA).

## Como testar localmente

Como este é um projeto web moderno, você não precisa de um "executável" tradicional, mas sim do ambiente Node.js. Siga os passos abaixo:

### 1. Pré-requisitos
Certifique-se de ter instalado em sua máquina:
- [Node.js](https://nodejs.org/) (Versão 18 ou superior)
- Um editor de código (recomendamos o [VS Code](https://code.visualstudio.com/))

### 2. Instalação
Após baixar os arquivos do projeto para uma pasta no seu computador, abra o terminal nessa pasta e execute:

```bash
npm install
```
*Isso baixará todas as bibliotecas necessárias para o sistema funcionar.*

### 3. Configuração da IA (Opcional para visualização)
O sistema usa o Google Gemini para análise de documentos. Para que a IA funcione localmente, você precisaria criar um arquivo `.env` na raiz com sua `GOOGLE_GENAI_API_KEY`. No entanto, a interface e a navegação funcionam normalmente mesmo sem a chave.

### 4. Execução
Para iniciar o sistema, rode:

```bash
npm run dev
```

O terminal indicará que o sistema está rodando em `http://localhost:3000`. Abra este endereço no seu navegador.

## Tecnologias Utilizadas
- **Framework:** Next.js 15 (App Router)
- **Estilização:** Tailwind CSS + ShadCN UI
- **IA:** Genkit + Google Gemini
- **Ícones:** Lucide React
- **Gerenciamento de Estado:** React Context API
