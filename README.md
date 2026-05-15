# ServTask – Premium PWA To‑Do List

![ServTask Home Mockup](file:///C:/Users/sammy.melo/.gemini/antigravity/brain/55dde6fd-ce26-4148-9d23-07853741ef03/servtask_home_mockup_1778869676511.png)

## Visão geral
**ServTask** é um aplicativo web progressivo (PWA) de lista de tarefas que combina uma experiência de usuário premium com desempenho offline e instalação nativa em dispositivos móveis e desktop.  
O projeto foi iniciado como um simples tutorial da Rocketseat e evoluiu para um demo completo que demonstra:
- Suporte a múltiplas listas de tarefas
- Validação de entrada e edição rápida
- Alternância de tema (claro/escuro) com animações fluidas
- Cabeçalho fixo e barra de ações responsiva
- Service Worker para funcionamento offline
- Manifesto PWA configurado com ícones de alta resolução e nome **ServTask**

## Tecnologias
- **HTML5** – estrutura semântica
- **CSS3** – layout flex, gradientes, glassmorphism, animações
- **JavaScript (ES6+)** – lógica de tarefas, manipulação do DOM e API Service Worker
- **PWA** – `manifest.json`, `sw.js`, e cache de ativos
- **Font Awesome** – ícones de ação

## Instalação
1. Clone o repositório
   ```bash
   git clone https://github.com/yourusername/servtask.git
   cd servtask
   ```
2. Abra `index.html` em um navegador moderno ou sirva com um servidor estático (ex.: `npx serve .`).
3. Para transformar em aplicativo instalável:
   - No Chrome/Edge, clique em *Instalar* na barra de endereço.
   - No iOS, use *Adicionar à Tela de Início*.

## Uso
- **Criar nova lista** – clique no botão “+” ao lado do seletor de listas.
- **Adicionar tarefa** – escreva no campo e pressione *Enter* ou clique no ícone “+”.
- **Editar tarefa** – duplo‑clique na tarefa para editá‑la inline.
- **Excluir lista/tarefa** – use os botões de lixeira nas áreas correspondentes.
- **Alternar tema** – ícone da lua/sol no cabeçalho.
- **Limpar lista** – botão “Limpar Lista” no rodapé.

## PWA – Detalhes técnicos
- **Service Worker (`sw.js`)**:
  - Cache de arquivos estáticos (`index.html`, `style.css`, `todos.js`, ícones) durante a instalação.
  - Estratégia *cache‑first* para garantir disponibilidade offline.
- **Manifest (`manifest.json`)** – nome **ServTask**, ícones 192×192 e 512×512, cores de tema, `display: standalone`.
- **HTTPS** – necessário para que o PWA seja instalável nos navegadores.

## Personalização
- Edite `style.css` para mudar cores, fontes ou efeitos de glassmorphism.
- Modifique `todos.js` para adicionar funcionalidades avançadas (ex.: persistência em `localStorage`).
- Atualize `manifest.json` com seu próprio nome, ícones e cores.

## Contribuição
Sinta‑se à vontade para abrir *issues* ou enviar *pull requests* com melhorias como:
- Suporte a arrastar e soltar tarefas
- Integração com API de backend
- Testes automatizados

## Licença
Este projeto está licenciado sob a MIT License – veja o arquivo `LICENSE` para mais detalhes.
