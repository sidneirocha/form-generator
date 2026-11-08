# Form Generator

Gerador de formulários de contato em HTML, com prévia, campos personalizados e código de integração com Google Forms, Google Sheets e Apps Script.

## Usar o gerador

Baixe o repositório e abra `index.html` no navegador. Não há instalação, build ou banco de dados para o gerador.

O fluxo é dividido em **Campos → Aparência → Integração → Publicação**:

1. Configure os campos, a ordem, a largura de 50% ou 100% e a obrigatoriedade.
2. Personalize textos, Google Fonts, cores, botões e feedback de sucesso/erro.
3. Gere o Apps Script e associe seu Forms e sua planilha, ou use o código para criá-los.
4. Confira as pendências e exporte HTML ou o pacote ZIP completo.

Use **Salvar projeto** para exportar as configurações em JSON e **Abrir projeto** para continuar a edição. Os arquivos ficam no seu computador; não há sincronização automática.

## Campo select / lista suspensa

Em **Campos → Campos personalizados**, clique em **Adicionar campo** e escolha **Lista suspensa (select)**.

Informe um rótulo, o título da pergunta no Forms, um texto inicial e as opções, uma por linha. Por exemplo:

```text
Recepção
Manutenção
Locação de equipamentos médicos
Limpeza Geral
Controle de Acesso
Estacionamento
Equipe para clínicas e hospitais
Manutenção de ar-condicionado
```

Você pode configurar a lista como obrigatória ou opcional e usar largura de 50% ou 100%. O Apps Script cria uma pergunta do tipo **Lista suspensa** e valida os valores recebidos. Se usar um Forms existente, seus títulos, opções, ordem das opções e obrigatoriedade devem corresponder ao gerador. Ao alterar opções, atualize o Forms, execute `configurar` novamente e publique uma nova versão do Apps Script e do HTML.

## Criar Forms e planilha

1. Configure os campos e os destinatários. Deixe o ID da planilha vazio.
2. Em **Integração**, baixe o script de criação.
3. Crie um projeto em [script.google.com](https://script.google.com/), cole o código e execute `criarFormulario`.
4. Autorize o acesso à sua conta Google. Os links do Forms e da planilha aparecem no registro de execução.
5. Abra a planilha criada e execute `finalizarCriacao`. Copie o ID da planilha e o gid informados para o gerador.
6. Implante o script como **Aplicativo da Web**, executando como proprietário e permitindo acesso a qualquer pessoa, se sua conta permitir.
7. Cole a URL terminada em `/exec` no gerador, exporte o HTML e publique no site.

O gerador local prepara o código; a criação na conta Google exige executar e autorizar o Apps Script. Ele não faz login em sua conta automaticamente.

## Usar um Forms existente

Vincule o Forms a uma planilha. Informe no gerador o ID da planilha e o gid da aba de respostas. Crie as perguntas conforme a tabela de integração. Cole o código gerado no Apps Script, execute `configurar`, autorize e implante.

As respostas são enviadas pelo Apps Script ao Forms, que as vincula à planilha. O próprio script envia a notificação por e-mail; não é necessário configurar um gatilho de envio.

## Notificações

- Destinatários podem usar Gmail ou outros provedores.
- O remetente padrão é a conta que executa a implantação.
- Um remetente personalizado deve ser um alias autorizado em Gmail, em **Enviar e-mail como**.
- O Reply-to usa o primeiro campo de e-mail preenchido. Sem esse campo, o script não define um Reply-to personalizado.
- A confirmação de sucesso indica a gravação da resposta. Ela não garante a entrega da notificação na caixa de entrada.

## Proteção contra spam

O modo básico aplica validação no servidor e um campo invisível (honeypot). O modo completo acrescenta Cloudflare Turnstile, validação de domínio/ação e limites temporários de frequência e conteúdo.

1. Crie um widget Turnstile para os domínios do site.
2. Informe a Site key pública no gerador e habilite o modo completo.
3. No Apps Script, adicione `TURNSTILE_SECRET` em **Configurações do projeto → Propriedades do script**.
4. Informe os domínios permitidos, gere os arquivos novamente, execute `configurar` e atualize a implantação.

Nunca publique a Secret key. Limites baseados no cache são temporários e podem expirar antes do prazo. Um Forms público acessado diretamente não passa pelos filtros do endpoint do Apps Script.

## Publicar o gerador no GitHub Pages

No repositório, abra **Settings → Pages → Build and deployment**. Escolha **Deploy from a branch**, branch **main** e pasta **/ (root)**, e salve.

A URL esperada para este repositório é `https://sidneirocha.github.io/form-generator/`. Ela só ficará disponível depois que o GitHub Pages estiver habilitado e concluir a publicação.

## Verificação

Com Node.js 18 ou superior:

```bash
node --test tests/generator.test.cjs
```

Os testes verificam a sintaxe, o tratamento de listas e o Apps Script com serviços Google simulados. O teste real de Forms, planilha, Turnstile e e-mail exige a implantação na sua conta. A prévia do gerador simula o envio e não envia mensagens.

## Estrutura

```text
index.html                 Gerador completo, sem dependências de build
tests/generator.test.cjs    Verificações locais
README.md                  Orientações de uso e publicação
```

Os formulários exportados precisam de conexão com a internet para enviar respostas; Google Fonts, imagens por URL e Turnstile também dependem de acesso externo. SVG, PNG e JPG importados são incorporados ao HTML. Não publique arquivos JSON de clientes se contiverem configurações que você deseja manter privadas.
