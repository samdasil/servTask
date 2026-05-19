# Plano de Implementação - ServTask Versão 3

Este plano propõe uma arquitetura moderna e segura para sincronização em nuvem e compartilhamento de listas por URL no **ServTask**, mantendo a privacidade, simplicidade e velocidade do aplicativo PWA.

---

## 1. Sugestão Arquitetural: Vínculo Dispositivo-Tarefa

Para vincular dispositivos às tarefas sem requerer cadastros de e-mail ou senhas, propomos o **Padrão de Registro de UUID de Lista**:

1. **UUIDs por Lista:** Cada lista de tarefas terá um identificador único universal (**UUIDv4**), gerado automaticamente (ex: `https://servtask.app/?list=f47ac10b-58cc-4372-a567-0e02b2c3d479`).
2. **Registro no Dispositivo:** O dispositivo não precisa de um identificador de hardware rígido. Ele simplesmente mantém um registro no `localStorage` dos UUIDs das listas que ele mesmo criou ou abriu através de links de compartilhamento.
3. **Colaboração em Tempo Real:** Se dois dispositivos abrirem a mesma URL com o UUID da lista, ambos carregarão e sincronizarão a mesma lista diretamente com a nuvem, permitindo que colaborem na mesma lista em tempo real!

---

## 2. Escolha do Banco de Dados: Firebase Firestore

Como o **ServTask** é um PWA estático (atualmente compatível com hospedagem sem servidor como GitHub Pages), usaremos o **Firebase Firestore** integrado diretamente no navegador via CDN.

### Arquitetura Híbrida (Offline-First / Local-Fallback)
Para garantir que o app funcione instantaneamente sem internet ou antes de o desenvolvedor configurar a nuvem:
* **Funcionamento Local:** Se as credenciais do Firebase não estiverem presentes no código ou se o usuário estiver sem internet, o aplicativo opera normalmente usando o `localStorage` do navegador.
* **Sincronização Automática:** Assim que as credenciais do Firebase forem preenchidas, o app sincroniza as listas ativas com a nuvem do Firestore em segundo plano.

---

## 3. Alterações Propostas

### [Componente do App]

#### [MODIFY] [index.html](file:///c:/Users/sammy.melo/Queiroz/projects/to-do/index.html)
* **SDK do Firebase:** Importação do Firebase SDK via CDN (`v10.x.x` Compat) antes do script `todos.js`.
* **Botão Compartilhar:** Inserção de um botão de compartilhamento com ícone moderno (`fa-share-alt`) ao lado das ações da lista ou na seleção de listas.
* **Notificação Toast:** Inserção de um elemento HTML flutuante para mensagens curtas ("Link copiado!").
* **Indicador de Conexão/Sincronização:** Pequeno selo na barra de status indicando se a lista está na nuvem ou local.

#### [MODIFY] [style.css](file:///c:/Users/sammy.melo/Queiroz/projects/to-do/style.css)
* **Estilização do Botão Compartilhar:** Efeito de hover e clique consistente com o restante da barra de ações.
* **Notificação Toast:** Estilo premium (efeito glassmorphism de vidro fosco, sombra suave, entrada deslizante de baixo para cima e saída com fade).
* **Indicador de Status da Nuvem:** Estilos modernos para mostrar "Sincronizado" (verde sutil) ou "Modo Local" (cinza/azul).

#### [MODIFY] [todos.js](file:///c:/Users/sammy.melo/Queiroz/projects/to-do/todos.js)
* **Integração Firebase:** Inicialização do Firestore com fallback seguro para `localStorage`.
* **Estrutura de Dados das Listas:** Atualização do estado do `AppData` para que cada lista contenha um atributo `id` (UUID).
* **Roteamento de URL:** Ao carregar a página, o script verifica se existe o parâmetro `?list=UUID` na URL.
  * Se existir, baixa a lista do Firebase, adiciona-a ao registro local do dispositivo e a seleciona.
  * Se não existir, carrega as listas locais do `localStorage`.
* **Ação de Compartilhamento:** Ao clicar no botão, copia a URL completa da lista ativa com o parâmetro `?list=UUID` para a área de transferência do usuário e dispara o Toast de sucesso.

---

## 4. Plano de Verificação

### Testes Manuais
1. **Criação e Rota:** Criar uma lista e verificar se ela ganha um UUID no `localStorage`.
2. **Cópia do Link:** Clicar no botão "Compartilhar", confirmar se a URL com `?list=UUID` é copiada e se a notificação "Link copiado!" aparece.
3. **Acesso por Outro Dispositivo:** Abrir o link copiado em uma janela anônima (simulando outro dispositivo) e verificar se a lista é baixada da nuvem com as mesmas tarefas e adicionada à lista local desse segundo navegador.
4. **Sincronização Real-time:** Editar ou adicionar tarefas no primeiro navegador e observar a atualização em tempo real no segundo.

---

> [!IMPORTANT]
> **Ação necessária do Usuário:** O plano acima utiliza chaves de configuração do Firebase Firestore. O código virá com um template vazio para que você insira suas chaves do Firebase Console (`apiKey`, `projectId`, etc.). O aplicativo funcionará de forma 100% autônoma no modo Local até que você as configure.

Você aprova este plano de arquitetura para darmos início à execução?
