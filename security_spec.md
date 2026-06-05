# Security Specification - IPBA Digital

## Data Invariants
1. O acesso administrativo é restrito a usuários com categoria "Pastor / Presbítero" ou "Coordenador / Admin".
2. Cada usuário pode ler e editar seu próprio perfil.
3. Pedidos de oração podem ser públicos ou pastorais (apenas admins veem os pastorais).
4. Contribuições são privadas para o usuário que as fez e para administradores (tesouraria).
5. Eventos, estudos e programas de rádio são de leitura pública, mas escrita restrita a administradores.
6. Tickets de suporte são privados ao autor e visíveis para administradores.

## The Dirty Dozen Payloads
1. Tentativa de um usuário comum atualizar outro perfil de usuário.
2. Tentativa de criar um evento sem ser administrador.
3. Tentativa de ler contribuições de outro usuário.
4. Tentativa de deletar um pedido de oração de outro usuário sem ser administrador.
5. Tentativa de criar um ticket de suporte com o email de outra pessoa.
6. Tentativa de atualizar a categoria de usuário para "Admin" por conta própria.
7. Tentativa de ler pedidos de oração "Pastoral" sem ser administrador.
8. Tentativa de injetar strings gigantes (>1MB) em campos de texto.
9. Tentativa de modificar o campo `createdAt` após a criação.
10. Tentativa de atualizar `updatedAt` com um timestamp do cliente (não servidor).
11. Tentativa de deletar um estudo teológico sendo um usuário comum.
12. Tentativa de ler a coleção de tickets de suporte completa (list) sem filtro de proprietário ou ser admin.

## Test Runner Logic
O arquivo `firestore.rules.test.ts` deve validar que as operações acima retornam `PERMISSION_DENIED`.
